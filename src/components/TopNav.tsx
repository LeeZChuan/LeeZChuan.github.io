'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { useLang } from '@/contexts/LangContext';
import { translations } from '@/lib/i18n';

const GitHubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

export default function TopNav() {
  const pathname = usePathname();
  const { lang, toggleLang } = useLang();
  const t = translations[lang].nav;

  const navLinks = [
    { href: '/blog', label: t.blog },
    { href: '/projects', label: t.projects },
    { href: '/about', label: t.about },
  ];

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur-md border-b border-gray-100 dark:border-white/[0.08]">
      <nav className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-gray-800 dark:text-[rgba(255,255,255,0.80)] hover:text-gray-900 dark:hover:text-[rgba(255,255,255,0.87)] transition-colors"
          aria-label="Home"
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80 hover:opacity-100 transition-opacity">
            <text x="2" y="22" fontFamily="Georgia, serif" fontSize="18" fontStyle="italic" fontWeight="600" fill="currentColor">LZC</text>
          </svg>
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 text-sm transition-colors duration-150 rounded-md ${
                isActive(href)
                  ? 'text-gray-900 dark:text-[rgba(255,255,255,0.87)]'
                  : 'text-gray-500 dark:text-[rgba(255,255,255,0.50)] hover:text-gray-900 dark:hover:text-[rgba(255,255,255,0.87)]'
              }`}
            >
              {label}
            </Link>
          ))}

          <div className="w-px h-4 bg-gray-200 dark:bg-white/[0.12] mx-2" />

          <a
            href="https://github.com/LeeZChuan"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 dark:text-[rgba(255,255,255,0.40)] hover:text-gray-800 dark:hover:text-[rgba(255,255,255,0.80)] transition-colors rounded-md"
            aria-label="GitHub"
          >
            <GitHubIcon />
          </a>

          <a
            href="mailto:cdutlzc@gmail.com"
            className="p-1.5 text-gray-400 dark:text-[rgba(255,255,255,0.40)] hover:text-gray-800 dark:hover:text-[rgba(255,255,255,0.80)] transition-colors rounded-md"
            aria-label="Email"
          >
            <EmailIcon />
          </a>

          <button
            onClick={toggleLang}
            className="p-1.5 rounded-md text-gray-400 dark:text-[rgba(255,255,255,0.40)] hover:text-gray-800 dark:hover:text-[rgba(255,255,255,0.80)] transition-colors text-xs font-medium tracking-wide min-w-[28px]"
            aria-label="Switch language"
          >
            {lang === 'zh' ? 'EN' : '中'}
          </button>

          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
