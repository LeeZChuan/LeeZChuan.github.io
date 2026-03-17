'use client';

import { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

function extractHeadings(html: string): Heading[] {
  const regex = /<h([2-3])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[2-3]>/gi;
  const headings: Heading[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      id: match[2],
      text: match[3].replace(/<[^>]+>/g, ''),
    });
  }
  return headings;
}

export default function TableOfContents({ html }: { html: string }) {
  const [activeId, setActiveId] = useState('');
  const headings = extractHeadings(html);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-56px 0% -70% 0%' }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [html]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveId(id);
    }
  }

  if (headings.length === 0) return null;

  return (
    <aside className="hidden lg:block w-56 shrink-0">
      <div className="sticky top-20 pt-12 pr-6">
        <p className="text-xs font-medium text-gray-400 dark:text-[rgba(255,255,255,0.38)] uppercase tracking-widest mb-4">
          目录
        </p>
        <nav className="space-y-1">
          {headings.map(({ id, text, level }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => handleClick(e, id)}
              className={`block text-xs leading-relaxed transition-colors duration-150 ${
                level === 3 ? 'pl-3' : ''
              } ${
                activeId === id
                  ? 'text-gray-900 dark:text-[rgba(255,255,255,0.87)] font-medium'
                  : 'text-gray-400 dark:text-[rgba(255,255,255,0.38)] hover:text-gray-700 dark:hover:text-[rgba(255,255,255,0.60)]'
              }`}
            >
              {text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
