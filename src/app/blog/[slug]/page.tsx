import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPostSlugs, getPostBySlug, formatDate, CATEGORIES } from '@/lib/posts';
import TableOfContents from '@/components/TableOfContents';
import { absoluteUrl, siteConfig } from '@/lib/site';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return {};
  const url = `/blog/${post.slug}`;
  const title = post.title || 'Blog Post';
  const description = post.description || siteConfig.description;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: post.date,
      authors: [siteConfig.author.name],
      tags: post.tags,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [siteConfig.ogImage],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const categoryLabel = post.category && CATEGORIES[post.category]
    ? CATEGORIES[post.category].label
    : null;
  const postUrl = absoluteUrl(`/blog/${post.slug}`);
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: 'zh-CN',
    url: postUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    image: absoluteUrl(siteConfig.ogImage),
    keywords: post.tags.join(', '),
    author: {
      '@type': 'Person',
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    publisher: {
      '@type': 'Person',
      name: siteConfig.author.name,
      url: siteConfig.url,
    },
  };

  return (
    <div className="max-w-5xl mx-auto px-6 flex gap-0 min-h-full">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <TableOfContents html={post.contentHtml} />
      <article className="flex-1 min-w-0 max-w-2xl mx-auto px-0 lg:px-10 py-12">
        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-[rgba(255,255,255,0.38)] hover:text-gray-700 dark:hover:text-[rgba(255,255,255,0.60)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            返回
          </Link>
        </div>

        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            {categoryLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400/80">
                {categoryLabel}
              </span>
            )}
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-[rgba(255,255,255,0.60)]"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[rgba(255,255,255,0.87)] leading-tight mb-3">
            {post.title}
          </h1>
          <p className="text-gray-500 dark:text-[rgba(255,255,255,0.60)] text-base leading-relaxed mb-4">
            {post.description}
          </p>
          <time
            dateTime={post.date}
            className="text-xs text-gray-400 dark:text-[rgba(255,255,255,0.38)]"
          >
            {formatDate(post.date)}
          </time>
        </header>

        <div
          className="prose prose-gray dark:prose-invert max-w-none
            prose-headings:scroll-mt-20
            prose-code:before:content-none prose-code:after:content-none
            prose-img:rounded-lg prose-img:w-full prose-img:h-auto prose-img:block prose-img:my-6
          "
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        <div className="mt-14 pt-8 border-t border-gray-100 dark:border-white/[0.12]">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-[rgba(255,255,255,0.60)] hover:text-gray-900 dark:hover:text-[rgba(255,255,255,0.87)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            返回文章列表
          </Link>
        </div>
      </article>
    </div>
  );
}
