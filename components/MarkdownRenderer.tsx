'use client'

import { marked } from 'marked'
import { useEffect } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-solidity'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'

interface Props {
  content: string
}

export function MarkdownRenderer({ content }: Props) {
  useEffect(() => {
    Prism.highlightAll()
  }, [content])

  // Configure marked options
  marked.setOptions({
    breaks: true,
    gfm: true,
  })

  // Custom renderer for images to handle assets
  const renderer = new marked.Renderer()
  renderer.image = (href, title, text) => {
    // Handle relative paths for assets
    const src = href?.startsWith('/') ? href : `/assets/${href}`
    return `<img src="${src}" alt="${text || ''}" title="${title || ''}" class="rounded-lg shadow-md" />`
  }

  // Custom renderer for code blocks
  renderer.code = (code, language) => {
    const validLanguage = language && Prism.languages[language] ? language : 'text'
    return `<pre class="language-${validLanguage}"><code class="language-${validLanguage}">${code}</code></pre>`
  }

  // Custom renderer for tables
  renderer.table = (header, body) => {
    return `<div class="overflow-x-auto"><table class="min-w-full border-collapse border border-gray-300">${header}${body}</table></div>`
  }

  renderer.tablerow = (content) => {
    return `<tr class="border-b border-gray-200">${content}</tr>`
  }

  renderer.tablecell = (content, flags) => {
    const tag = flags.header ? 'th' : 'td'
    const className = flags.header 
      ? 'px-4 py-2 bg-gray-50 font-semibold text-left border border-gray-300' 
      : 'px-4 py-2 border border-gray-300'
    return `<${tag} class="${className}">${content}</${tag}>`
  }

  marked.use({ renderer })

  const htmlContent = marked(content)

  return (
    <div 
      className="prose prose-lg max-w-none p-8"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
} 