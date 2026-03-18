import Link from 'next/link';
import { getAllPosts, formatDateShort } from '@/lib/posts';

export default function HomePage() {
  const recentPosts = getAllPosts().slice(0, 5);

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <div className="mb-14">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[rgba(255,255,255,0.87)] mb-4">
          LeeZChuan
        </h1>

        <p className="text-base text-gray-600 dark:text-[rgba(255,255,255,0.60)] leading-relaxed mb-4">
          作为一名全栈开发者，我精通 Vue 3、React、Node.js 和 Java。在编码之外，我同样热衷于滑雪、骑行、徒步以及摄影，在技术与自然中寻找平衡与灵感。
        </p>

        <p className="text-base text-gray-600 dark:text-[rgba(255,255,255,0.60)] leading-relaxed mb-4">
          加入我的旅程，一起探索技术的力量、户外生活的魅力，以及镜头背后的世界。
        </p>

        <p className="text-base text-gray-600 dark:text-[rgba(255,255,255,0.60)] leading-relaxed">
          在{' '}
          <a
            href="https://github.com/LeeZChuan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-800 dark:text-[rgba(255,255,255,0.80)] underline underline-offset-2 decoration-gray-300 dark:decoration-white/20 hover:decoration-gray-500 dark:hover:decoration-white/50 transition-colors"
          >
            GitHub
          </a>{' '}
          可以看到我维护的项目。欢迎通过{' '}
          <a
            href="mailto:cdutlzc@gmail.com"
            className="text-gray-800 dark:text-[rgba(255,255,255,0.80)] underline underline-offset-2 decoration-gray-300 dark:decoration-white/20 hover:decoration-gray-500 dark:hover:decoration-white/50 transition-colors"
          >
            Email
          </a>{' '}
          交流。
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-medium text-gray-400 dark:text-[rgba(255,255,255,0.38)] uppercase tracking-widest">
            最近文章
          </span>
          <Link
            href="/blog"
            className="text-sm text-gray-400 dark:text-[rgba(255,255,255,0.38)] hover:text-gray-700 dark:hover:text-[rgba(255,255,255,0.60)] transition-colors"
          >
            全部 →
          </Link>
        </div>

        <ul className="-mx-2">
          {recentPosts.map((post) => (
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
