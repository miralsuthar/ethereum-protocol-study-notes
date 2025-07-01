import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface Lecture {
  slug: string
  number: number
  title: string
  description: string
  speaker: string
  filename: string
  content?: string
  readTime?: number
}

const lecturesDirectory = path.join(process.cwd(), 'notes')

export function getLectures(): Lecture[] {
  const filenames = fs.readdirSync(lecturesDirectory)
  const lectures = filenames
    .filter(name => name.endsWith('.md'))
    .map(filename => {
      const filePath = path.join(lecturesDirectory, filename)
      const fileContents = fs.readFileSync(filePath, 'utf8')
      const { data, content } = matter(fileContents)
      
      // Extract lecture number from filename
      const numberMatch = filename.match(/lec-(\d+)/)
      const number = numberMatch ? parseInt(numberMatch[1]) : 0
      
      // Extract title from content (first heading)
      const titleMatch = content.match(/^# (.+)$/m)
      const title = titleMatch ? titleMatch[1] : filename.replace('.md', '')
      
      // Extract speaker from title
      const speakerMatch = title.match(/by (.+?)(?:\s*\(|$)/)
      const speaker = speakerMatch ? speakerMatch[1] : 'Unknown'
      
      // Clean title to remove speaker info
      const cleanTitle = title.replace(/\s*by\s+.+$/i, '').replace(/^Lec-?\d+:\s*/i, '')
      
      // Extract first paragraph as description
      const paragraphs = content.split('\n\n')
      let description = ''
      for (const paragraph of paragraphs) {
        if (paragraph.trim() && !paragraph.startsWith('#') && !paragraph.startsWith('|') && !paragraph.startsWith('More info')) {
          description = paragraph.replace(/\n/g, ' ').trim()
          break
        }
      }
      
      // Calculate approximate read time (200 words per minute)
      const wordCount = content.split(/\s+/).length
      const readTime = Math.ceil(wordCount / 200)
      
      return {
        slug: filename.replace('.md', ''),
        number,
        title: cleanTitle,
        description: description || 'Ethereum Protocol Studies lecture',
        speaker,
        filename,
        readTime
      }
    })
    .sort((a, b) => a.number - b.number)

  return lectures
}

export function getLecture(slug: string): Lecture & { content: string } {
  const filePath = path.join(lecturesDirectory, `${slug}.md`)
  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContents)
  
  const lectures = getLectures()
  const lecture = lectures.find(l => l.slug === slug)
  
  if (!lecture) {
    throw new Error(`Lecture not found: ${slug}`)
  }
  
  return {
    ...lecture,
    content
  }
}

export function getLectureByNumber(number: number): Lecture | null {
  const lectures = getLectures()
  return lectures.find(l => l.number === number) || null
} 