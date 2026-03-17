import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts, formatDateShort, CATEGORIES } from '@/lib/posts';

export const metadata: Metadata = { title: 'Blog' };

export default function BlogPage() {
  const posts = getAllPosts();

  const postsByCategory = posts.reduce((acc, post) => {
    const cat = post.category || '';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(post);
    return acc;
  }, {} as Record<string, typeof posts>);

  const categoryOrder = Object.keys(CATEGORIES);
  const uncategorized = postsByCategory[''] ?? [];

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-[rgba(255,255,255,0.87)] mb-1">Blog</h1>
        <p className="text-sm text-gray-500 dark:text-[rgba(255,255,255,0.38)]">共 {posts.length} 篇文章</p>
      </div>

      <div className="space-y-12">
        {categoryOrder.map((cat) => {
          const catPosts = postsByCategory[cat];
          if (!catPosts || catPosts.length === 0) return null;
          const info = CATEGORIES[cat];
          return (
            <section key={cat}>
              <div className="flex items-baseline gap-3 mb-5">
                <h2 className="text-xs font-medium text-gray-400 dark:text-[rgba(255,255,255,0.38)] uppercase tracking-widest">
                  {info.label}
                </h2>
                <span className="text-xs text-gray-300 dark:text-[rgba(255,255,255,0.20)]">
                  {info.description}
                </span>
              </div>
              <ul className="-mx-2 space-y-0">
                {catPosts.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group flex items-baseline justify-between px-2 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors duration-150"
                    >
                      <span className="text-sm text-gray-700 dark:text-[rgba(255,255,255,0.60)] group-hover:text-gray-900 dark:group-hover:text-[rgba(255,255,255,0.87)] transition-colors truncate mr-4">
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
            </section>
          );
        })}

        {uncategorized.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-gray-400 dark:text-[rgba(255,255,255,0.38)] uppercase tracking-widest mb-5">
              其他
            </h2>
            <ul className="-mx-2 space-y-0">
              {uncategorized.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group flex items-baseline justify-between px-2 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors duration-150"
                  >
                    <span className="text-sm text-gray-700 dark:text-[rgba(255,255,255,0.60)] group-hover:text-gray-900 dark:group-hover:text-[rgba(255,255,255,0.87)] transition-colors truncate mr-4">
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
          </section>
        )}
      </div>
    </div>
  );
}
