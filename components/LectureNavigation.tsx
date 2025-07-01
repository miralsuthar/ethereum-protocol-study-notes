import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getLectures, Lecture } from '@/lib/lectures'

interface Props {
  currentLecture: Lecture
}

export function LectureNavigation({ currentLecture }: Props) {
  const lectures = getLectures()
  const currentIndex = lectures.findIndex(l => l.slug === currentLecture.slug)
  const prevLecture = currentIndex > 0 ? lectures[currentIndex - 1] : null
  const nextLecture = currentIndex < lectures.length - 1 ? lectures[currentIndex + 1] : null

  return (
    <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm">
      <div className="flex-1">
        {prevLecture ? (
          <Link 
            href={`/lectures/${prevLecture.slug}`}
            className="group flex items-center text-gray-600 hover:text-ethereum-600 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <div>
              <div className="text-sm text-gray-500">Previous</div>
              <div className="font-medium">Lecture {prevLecture.number}</div>
              <div className="text-sm">{prevLecture.title}</div>
            </div>
          </Link>
        ) : (
          <div></div>
        )}
      </div>

      <div className="flex-1 text-center">
        <Link 
          href="/lectures"
          className="text-gray-600 hover:text-ethereum-600 transition-colors font-medium"
        >
          All Lectures
        </Link>
      </div>

      <div className="flex-1 text-right">
        {nextLecture ? (
          <Link 
            href={`/lectures/${nextLecture.slug}`}
            className="group flex items-center justify-end text-gray-600 hover:text-ethereum-600 transition-colors"
          >
            <div className="text-right">
              <div className="text-sm text-gray-500">Next</div>
              <div className="font-medium">Lecture {nextLecture.number}</div>
              <div className="text-sm">{nextLecture.title}</div>
            </div>
            <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  )
} 