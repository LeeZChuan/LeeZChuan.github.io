# my-blog

A personal blog built with Next.js 14, Tailwind CSS, and Markdown.

## Features

- Markdown-based blog posts with frontmatter support
- Dark / light mode toggle
- Per-post table of contents with smooth scroll and active highlight
- Syntax-highlighted code blocks
- Responsive layout
- Category and tag filtering

## Project Structure

```
src/
├── app/
│   ├── about/         # About page
│   ├── blog/          # Blog list and post pages
│   ├── projects/      # Projects page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── TableOfContents.tsx
│   ├── ThemeProvider.tsx
│   ├── ThemeToggle.tsx
│   └── TopNav.tsx
├── content/
│   └── blog/          # Markdown posts organized by category
│       ├── journal/
│       ├── tech/
│       └── tools/
└── lib/
    └── posts.ts       # Markdown parsing and post utilities
```

## Commands

| Command         | Action                        |
| :-------------- | :---------------------------- |
| `npm install`   | Install dependencies          |
| `npm run dev`   | Start dev server at port 3000 |
| `npm run build` | Build for production          |
| `npm start`     | Start production server       |

## Writing Posts

Add a `.md` file to `src/content/blog/<category>/`. Each file requires frontmatter:

```md
---
title: "Post Title"
description: "Short description"
date: "2024-01-01"
category: "tech"
tags: ["tag1", "tag2"]
---

Post content here...
```

Supported categories: `tech`, `tools`, `journal`.
