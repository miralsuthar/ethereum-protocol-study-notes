import { BookOpen, Users, Zap, Target } from 'lucide-react'
import Link from 'next/link'
import { getLectures } from '@/lib/lectures'

export default function HomePage() {
  const lectures = getLectures()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Ethereum Protocol Studies
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          A comprehensive journey through the Ethereum protocol. Learn how Ethereum really works through detailed notes, 
          diagrams, and explanations from industry experts.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/lectures"
            className="bg-ethereum-600 text-white px-8 py-3 rounded-lg hover:bg-ethereum-700 transition-colors font-semibold"
          >
            Start Learning
          </Link>
          <Link 
            href="/about"
            className="border border-ethereum-600 text-ethereum-600 px-8 py-3 rounded-lg hover:bg-ethereum-50 transition-colors font-semibold"
          >
            About EPS
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <BookOpen className="h-12 w-12 text-ethereum-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Comprehensive Notes</h3>
          <p className="text-gray-600">Detailed lecture notes covering all aspects of the Ethereum protocol</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <Users className="h-12 w-12 text-ethereum-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Expert Speakers</h3>
          <p className="text-gray-600">Learn from Ethereum core developers and researchers</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <Zap className="h-12 w-12 text-ethereum-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Interactive Content</h3>
          <p className="text-gray-600">Engage with diagrams, code examples, and Q&A sections</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <Target className="h-12 w-12 text-ethereum-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Practical Focus</h3>
          <p className="text-gray-600">Real-world applications and implementation details</p>
        </div>
      </div>

      {/* Recent Lectures */}
      <div className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Latest Lectures</h2>
          <Link 
            href="/lectures"
            className="text-ethereum-600 hover:text-ethereum-700 font-medium"
          >
            View All →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lectures.slice(0, 6).map((lecture) => (
            <Link 
              key={lecture.slug}
              href={`/lectures/${lecture.slug}`}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="text-sm text-ethereum-600 font-medium mb-2">
                Lecture {lecture.number}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {lecture.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {lecture.description}
              </p>
              <div className="text-sm text-gray-500">
                by {lecture.speaker}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl p-8 shadow-sm">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-ethereum-600 mb-2">{lectures.length}</div>
            <div className="text-gray-600">Total Lectures</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-ethereum-600 mb-2">24</div>
            <div className="text-gray-600">Weeks of Content</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-ethereum-600 mb-2">∞</div>
            <div className="text-gray-600">Learning Opportunities</div>
          </div>
        </div>
      </div>
    </div>
  )
} 