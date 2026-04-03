'use client';

import Link from 'next/link';
import { formatDateShort } from '@/lib/dateUtils';
import type { PostMeta } from '@/lib/posts';
import { useLang } from '@/contexts/LangContext';
import { translations } from '@/lib/i18n';

const PAGE_SIZE = 15;

interface CategoryInfo {
  label: string;
  labelEn: string;
  description: string;
}

interface Props {
  posts: PostMeta[];
  categories: Record<string, CategoryInfo>;
  activeCat: string;
  currentPage: number;
}

export default function BlogContent({ posts, categories, activeCat, currentPage }: Props) {
  const { lang } = useLang();
  const t = translations[lang].blog;

  const filtered = activeCat === 'all' ? posts : posts.filter((p) => p.category === activeCat);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const categoryOrder = Object.keys(categories);
  const catCounts = categoryOrder.reduce((acc, cat) => {
    acc[cat] = posts.filter((p) => p.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  function getCatLabel(cat: string) {
    const info = categories[cat];
    if (!info) return cat;
    return lang === 'zh' ? info.label : info.labelEn;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-[rgba(255,255,255,0.87)] mb-1">{t.title}</h1>
        <p className="text-sm text-gray-500 dark:text-[rgba(255,255,255,0.38)]">{t.totalPosts(posts.length)}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/blog"
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            activeCat === 'all'
              ? 'bg-gray-900 dark:bg-white/[0.87] text-white dark:text-gray-900'
              : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-[rgba(255,255,255,0.60)] hover:bg-gray-200 dark:hover:bg-white/[0.10]'
          }`}
        >
          {t.all} <span className="opacity-60">{posts.length}</span>
        </Link>
        {categoryOrder.map((cat) => {
          const count = catCounts[cat] ?? 0;
          if (count === 0) return null;
          return (
            <Link
              key={cat}
              href={`/blog?cat=${cat}`}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeCat === cat
                  ? 'bg-gray-900 dark:bg-white/[0.87] text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-[rgba(255,255,255,0.60)] hover:bg-gray-200 dark:hover:bg-white/[0.10]'
              }`}
            >
              {getCatLabel(cat)} <span className="opacity-60">{count}</span>
            </Link>
          );
        })}
      </div>

      <ul className="-mx-2 space-y-0 mb-8">
        {paginated.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex items-baseline justify-between px-2 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors duration-150"
            >
              <span className="flex items-baseline gap-2 min-w-0 mr-4">
                {activeCat === 'all' && categories[post.category] && (
                  <span className="text-xs text-gray-300 dark:text-[rgba(255,255,255,0.20)] flex-shrink-0">
                    {getCatLabel(post.category)}
                  </span>
                )}
                <span className="text-sm text-gray-700 dark:text-[rgba(255,255,255,0.60)] group-hover:text-gray-900 dark:group-hover:text-[rgba(255,255,255,0.87)] transition-colors truncate">
                  {post.title}
                </span>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/[0.08]">
          <Link
            href={currentPage > 1 ? `/blog?${activeCat !== 'all' ? `cat=${activeCat}&` : ''}page=${currentPage - 1}` : '#'}
            aria-disabled={currentPage <= 1}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              currentPage <= 1
                ? 'text-gray-300 dark:text-[rgba(255,255,255,0.20)] pointer-events-none'
                : 'text-gray-600 dark:text-[rgba(255,255,255,0.60)] hover:bg-gray-50 dark:hover:bg-white/[0.04]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            {t.prevPage}
          </Link>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isNear = Math.abs(p - currentPage) <= 1 || p === 1 || p === totalPages;
              const isDot = !isNear && (p === currentPage - 2 || p === currentPage + 2);
              if (isDot) return <span key={p} className="text-xs text-gray-300 dark:text-[rgba(255,255,255,0.20)] px-1">…</span>;
              if (!isNear) return null;
              return (
                <Link
                  key={p}
                  href={`/blog?${activeCat !== 'all' ? `cat=${activeCat}&` : ''}page=${p}`}
                  className={`w-7 h-7 flex items-center justify-center rounded-md text-xs transition-colors ${
                    p === currentPage
                      ? 'bg-gray-900 dark:bg-white/[0.87] text-white dark:text-gray-900 font-medium'
                      : 'text-gray-600 dark:text-[rgba(255,255,255,0.60)] hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {p}
                </Link>
              );
            })}
          </div>

          <Link
            href={currentPage < totalPages ? `/blog?${activeCat !== 'all' ? `cat=${activeCat}&` : ''}page=${currentPage + 1}` : '#'}
            aria-disabled={currentPage >= totalPages}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              currentPage >= totalPages
                ? 'text-gray-300 dark:text-[rgba(255,255,255,0.20)] pointer-events-none'
                : 'text-gray-600 dark:text-[rgba(255,255,255,0.60)] hover:bg-gray-50 dark:hover:bg-white/[0.04]'
            }`}
          >
            {t.nextPage}
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'rotate(180deg)' }}>
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
