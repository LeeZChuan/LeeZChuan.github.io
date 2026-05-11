import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllPosts } from '@/lib/posts';
import { siteConfig } from '@/lib/site';
import BlogContent from './BlogContent';

const description = 'LeeZChuan 的技术、商业、笔记与生活文章归档。';

export const metadata: Metadata = {
  title: 'Blog',
  description,
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: `Blog — ${siteConfig.name}`,
    description,
    url: '/blog',
    type: 'website',
  },
};

const CATEGORIES = {
  tech: { label: '技术', labelEn: 'Tech', description: '前端、后端、框架与语言' },
  business: { label: '商业', labelEn: 'Business', description: '互联网商业与产品思维' },
  notes: { label: '笔记', labelEn: 'Notes', description: '工作记录与架构设计' },
  life: { label: '生活', labelEn: 'Life', description: '阅读、旅行与日常思考' },
};

export default function BlogPage() {
  const posts = getAllPosts();
  return (
    <Suspense>
      <BlogContent posts={posts} categories={CATEGORIES} />
    </Suspense>
  );
}
