import { notFound } from 'next/navigation'
import { getLecture, getLectures } from '@/lib/lectures'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { LectureNavigation } from '@/components/LectureNavigation'
import { TableOfContents } from '@/components/TableOfContents'
import { Clock, User, Calendar } from 'lucide-react'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  const lectures = getLectures()
  return lectures.map((lecture) => ({
    slug: lecture.slug,
  }))
}

export function generateMetadata({ params }: Props) {
  try {
    const lecture = getLecture(params.slug)
    return {
      title: `${lecture.title} - Ethereum Protocol Studies`,
      description: lecture.description,
    }
  } catch {
    return {
      title: 'Lecture Not Found',
    }
  }
}

export default function LecturePage({ params }: Props) {
  let lecture
  try {
    lecture = getLecture(params.slug)
  } catch {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Table of Contents - Left Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-8">
              <TableOfContents content={lecture.content} />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {/* Lecture Header */}
            <div className="bg-white rounded-xl p-8 shadow-sm mb-8">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-ethereum-100 text-ethereum-700 px-3 py-1 rounded-full text-sm font-semibold">
                  Lecture {lecture.number}
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {lecture.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  {lecture.speaker}
                </div>
                {lecture.readTime && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {lecture.readTime} min read
                  </div>
                )}
              </div>
              
              <p className="text-lg text-gray-700 leading-relaxed">
                {lecture.description}
              </p>
            </div>

            {/* Markdown Content */}
            <div className="bg-white rounded-xl shadow-sm">
              <MarkdownRenderer content={lecture.content} />
            </div>

            {/* Navigation */}
            <div className="mt-8">
              <LectureNavigation currentLecture={lecture} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 