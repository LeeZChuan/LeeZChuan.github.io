'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { formatDateShort } from '@/lib/dateUtils';
import type { PostMeta } from '@/lib/posts';
import { useLang } from '@/contexts/LangContext';
import { translations } from '@/lib/i18n';

const MIN_RECENT_POSTS = 5;

interface Props {
  recentPosts: PostMeta[];
}

export default function HomeContent({ recentPosts }: Props) {
  const { lang } = useLang();
  const t = translations[lang].home;
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [visiblePostCount, setVisiblePostCount] = useState(MIN_RECENT_POSTS);

  useEffect(() => {
    let frameId = 0;

    const updateVisiblePostCount = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        const container = containerRef.current;
        const list = listRef.current;
        const firstItem = list?.querySelector('li');

        if (!container || !list || !firstItem) return;

        const containerStyle = window.getComputedStyle(container);
        const bottomPadding = Number.parseFloat(containerStyle.paddingBottom) || 0;
        const listTop = list.getBoundingClientRect().top;
        const itemHeight = firstItem.getBoundingClientRect().height;

        if (itemHeight <= 0) return;

        const availableHeight = window.innerHeight - listTop - bottomPadding;
        const fittingCount = Math.floor(availableHeight / itemHeight);
        const nextCount = Math.min(
          recentPosts.length,
          Math.max(MIN_RECENT_POSTS, fittingCount)
        );

        setVisiblePostCount(nextCount);
      });
    };

    updateVisiblePostCount();
    window.addEventListener('resize', updateVisiblePostCount);

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(updateVisiblePostCount);

    if (containerRef.current) {
      resizeObserver?.observe(containerRef.current);
    }

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', updateVisiblePostCount);
      resizeObserver?.disconnect();
    };
  }, [lang, recentPosts.length]);

  const visiblePosts = recentPosts.slice(0, visiblePostCount);

  return (
    <div ref={containerRef} className="max-w-2xl mx-auto px-6 py-20">
      <div className="mb-14">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[rgba(255,255,255,0.87)] mb-4">
          LeeZChuan
        </h1>

        <p className="text-base text-gray-600 dark:text-[rgba(255,255,255,0.60)] leading-relaxed mb-4">
          {t.bio1}
        </p>

        <p className="text-base text-gray-600 dark:text-[rgba(255,255,255,0.60)] leading-relaxed mb-4">
          {t.bio2}
        </p>

        <p className="text-base text-gray-600 dark:text-[rgba(255,255,255,0.60)] leading-relaxed">
          {t.bio3Pre}{' '}
          <a
            href="https://github.com/LeeZChuan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-800 dark:text-[rgba(255,255,255,0.80)] underline underline-offset-2 decoration-gray-300 dark:decoration-white/20 hover:decoration-gray-500 dark:hover:decoration-white/50 transition-colors"
          >
            GitHub
          </a>{' '}
          {t.bio3Mid}{' '}
          <a
            href="mailto:cdutlzc@gmail.com"
            className="text-gray-800 dark:text-[rgba(255,255,255,0.80)] underline underline-offset-2 decoration-gray-300 dark:decoration-white/20 hover:decoration-gray-500 dark:hover:decoration-white/50 transition-colors"
          >
            Email
          </a>
          {t.bio3Post}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-medium text-gray-400 dark:text-[rgba(255,255,255,0.38)] uppercase tracking-widest">
            {t.recentPosts}
          </span>
          <Link
            href="/blog"
            className="text-sm text-gray-400 dark:text-[rgba(255,255,255,0.38)] hover:text-gray-700 dark:hover:text-[rgba(255,255,255,0.60)] transition-colors"
          >
            {t.allPosts}
          </Link>
        </div>

        <ul ref={listRef} className="-mx-2">
          {visiblePosts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex items-baseline justify-between gap-4 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors duration-150"
              >
                <span className="text-sm text-gray-700 dark:text-[rgba(255,255,255,0.60)] group-hover:text-gray-900 dark:group-hover:text-[rgba(255,255,255,0.87)] transition-colors truncate">
                  {post.title}
                </span>
                <time
                  dateTime={post.date}
                  className="text-xs text-gray-400 dark:text-[rgba(255,255,255,0.38)] flex-shrink-0 font-mono"
                >
                  {formatDateShort(post.date)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
