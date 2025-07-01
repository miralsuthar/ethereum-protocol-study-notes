import Link from 'next/link'
import { BookOpen, ExternalLink } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen className="h-8 w-8 text-ethereum-400" />
              <span className="text-xl font-bold">Ethereum Protocol Studies</span>
            </div>
            <p className="text-gray-400 mb-4">
              Comprehensive notes and resources for understanding the Ethereum protocol. 
              Learn from industry experts and core developers.
            </p>
            <p className="text-gray-400 text-sm">
              These notes represent a journey through the Ethereum Protocol Studies program, 
              compiled with gratitude to all the mentors and speakers who made this learning possible.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/lectures" className="text-gray-400 hover:text-white transition-colors">
                  All Lectures
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  About EPS
                </Link>
              </li>
              <li>
                <a 
                  href="https://epf.wiki" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors inline-flex items-center"
                >
                  EPF Wiki <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://ethereum.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors inline-flex items-center"
                >
                  Ethereum.org <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/ethereum" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors inline-flex items-center"
                >
                  Ethereum GitHub <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
              <li>
                <a 
                  href="https://eips.ethereum.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors inline-flex items-center"
                >
                  EIPs <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            Made with ❤️ for the Ethereum community • Study notes compiled with gratitude to EPS mentors and speakers
          </p>
        </div>
      </div>
    </footer>
  )
} 