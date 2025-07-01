import { getLectures } from '@/lib/lectures'
import Link from 'next/link'
import { Clock, User } from 'lucide-react'

export default function LecturesPage() {
  const lectures = getLectures()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">All Lectures</h1>
        <p className="text-xl text-gray-600">
          Complete collection of Ethereum Protocol Studies lectures. Each lecture covers 
          different aspects of the Ethereum protocol with detailed notes and explanations.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lectures.map((lecture) => (
          <Link 
            key={lecture.slug}
            href={`/lectures/${lecture.slug}`}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-ethereum-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-ethereum-600 bg-ethereum-50 px-2 py-1 rounded">
                Lecture {lecture.number}
              </div>
              {lecture.readTime && (
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  {lecture.readTime} min
                </div>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-ethereum-700 transition-colors">
              {lecture.title}
            </h3>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {lecture.description}
            </p>
            
            <div className="flex items-center text-sm text-gray-500">
              <User className="h-4 w-4 mr-1" />
              {lecture.speaker}
            </div>
          </Link>
        ))}
      </div>

      {lectures.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No lectures found.</p>
        </div>
      )}
    </div>
  )
} 