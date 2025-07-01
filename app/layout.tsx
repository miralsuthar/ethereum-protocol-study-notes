import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ethereum Protocol Studies',
  description: 'Comprehensive notes on Ethereum Protocol Studies - Learn how Ethereum really works',
  keywords: ['Ethereum', 'Protocol', 'Blockchain', 'EPS', 'Study Notes'],
  authors: [{ name: 'EPS Student' }],
  openGraph: {
    title: 'Ethereum Protocol Studies',
    description: 'Comprehensive notes on Ethereum Protocol Studies',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <Navigation />
          <main>
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
} 