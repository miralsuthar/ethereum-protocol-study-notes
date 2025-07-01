'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, BookOpen, Github } from 'lucide-react'

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-ethereum-600" />
            <span className="text-xl font-bold text-gray-900">EPS Notes</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-ethereum-600 transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/lectures" 
              className="text-gray-700 hover:text-ethereum-600 transition-colors"
            >
              Lectures
            </Link>
            <Link 
              href="/about" 
              className="text-gray-700 hover:text-ethereum-600 transition-colors"
            >
              About
            </Link>
            <a 
              href="https://epf.wiki"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-ethereum-600 transition-colors"
            >
              EPF Wiki
            </a>
            <a 
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-ethereum-600 transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-ethereum-600 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-ethereum-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/lectures" 
                className="text-gray-700 hover:text-ethereum-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Lectures
              </Link>
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-ethereum-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <a 
                href="https://epf.wiki"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-ethereum-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                EPF Wiki
              </a>
              <a 
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-ethereum-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                GitHub
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
} 