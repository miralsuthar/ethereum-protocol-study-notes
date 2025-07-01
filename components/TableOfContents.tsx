'use client'

import { useState, useEffect } from 'react'
import { List } from 'lucide-react'

interface Props {
  content: string
}

interface Heading {
  id: string
  title: string
  level: number
}

export function TableOfContents({ content }: Props) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Extract headings from markdown content
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const extractedHeadings: Heading[] = []
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const title = match[2].trim()
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      extractedHeadings.push({ id, title, level })
    }

    setHeadings(extractedHeadings)
  }, [content])

  useEffect(() => {
    // Handle scroll spy for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '0% 0% -80% 0%' }
    )

    // Observe all headings
    const headingElements = headings.map(h => document.getElementById(h.id)).filter(Boolean)
    headingElements.forEach(el => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (headings.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center mb-4">
        <List className="h-5 w-5 text-ethereum-600 mr-2" />
        <h3 className="font-semibold text-gray-900">Table of Contents</h3>
      </div>
      
      <nav className="space-y-1">
        {headings.map((heading, index) => (
          <button
            key={index}
            onClick={() => handleClick(heading.id)}
            className={`
              block w-full text-left text-sm py-1 px-2 rounded transition-colors
              ${heading.level === 1 ? 'font-medium' : ''}
              ${heading.level === 2 ? 'ml-2' : ''}
              ${heading.level === 3 ? 'ml-4' : ''}
              ${heading.level === 4 ? 'ml-6' : ''}
              ${heading.level === 5 ? 'ml-8' : ''}
              ${heading.level === 6 ? 'ml-10' : ''}
              ${activeId === heading.id 
                ? 'text-ethereum-600 bg-ethereum-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            {heading.title}
          </button>
        ))}
      </nav>
    </div>
  )
} 