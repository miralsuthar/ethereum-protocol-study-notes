# Ethereum Protocol Studies Website

A modern, responsive website showcasing comprehensive notes from the Ethereum Protocol Studies program. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 📚 **Lecture-by-lecture navigation** - Browse through all 22 lectures with intuitive navigation
- 📖 **Markdown rendering** - Beautiful rendering of markdown content with syntax highlighting
- 🖼️ **Image support** - Displays all diagrams and images from the lecture assets
- 📑 **Table of contents** - Auto-generated table of contents for each lecture
- 🔍 **Search functionality** - Easy navigation between lectures
- 📱 **Responsive design** - Works perfectly on desktop, tablet, and mobile
- ⚡ **Fast performance** - Static site generation for optimal loading speeds

## Quick Start

### Prerequisites

- Node.js 18.17.0 or higher
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
# Build the static site
npm run build

# Start the production server
npm start
```

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── lectures/          # Lecture listing and individual pages
│   ├── about/             # About page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Homepage
├── components/            # Reusable React components
│   ├── Navigation.tsx     # Site navigation
│   ├── Footer.tsx         # Site footer
│   ├── MarkdownRenderer.tsx # Markdown content renderer
│   ├── LectureNavigation.tsx # Lecture prev/next navigation
│   └── TableOfContents.tsx # Auto-generated TOC
├── lib/                   # Utility functions
│   └── lectures.ts        # Lecture data management
├── public/                # Static assets
│   └── assets/           # Symlink to lecture assets
├── notes/                 # Markdown lecture files
└── assets/               # Lecture diagrams and images
```

## How It Works

### Markdown Processing
The website automatically reads all markdown files from the `notes/` directory and processes them to extract:
- Lecture numbers and titles
- Speaker information
- Descriptions and reading time estimates
- Table of contents from headings

### Asset Handling
Images and diagrams are automatically linked from the `assets/` directory using a symlink in `public/assets/`. Markdown image references are processed to properly display all visual content.

### Navigation
- **Homepage**: Overview with latest lectures and features
- **Lectures page**: Grid view of all available lectures
- **Individual lecture pages**: Full content with TOC and navigation
- **About page**: Information about EPS and the project

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Typography plugin
- **Markdown**: Marked.js with syntax highlighting (Prism.js)
- **Icons**: Lucide React
- **Deployment**: Static export ready

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Submit a pull request

## License

This project is part of the Ethereum Protocol Studies notes collection. See the main README for license information.

## Acknowledgments

Built with ❤️ for the Ethereum community, based on the excellent content from the Ethereum Protocol Studies program. 