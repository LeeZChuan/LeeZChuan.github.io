import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/posts';
import BlogContent from './BlogContent';

export const metadata: Metadata = { title: 'Blog' };

const CATEGORIES = {
  tech: { label: '技术', labelEn: 'Tech', description: '前端、后端、框架与语言' },
  business: { label: '商业', labelEn: 'Business', description: '互联网商业与产品思维' },
  notes: { label: '笔记', labelEn: 'Notes', description: '工作记录与架构设计' },
  life: { label: '生活', labelEn: 'Life', description: '阅读、旅行与日常思考' },
};

interface Props {
  searchParams: { page?: string; cat?: string };
}

export default function BlogPage({ searchParams }: Props) {
  const posts = getAllPosts();
  const activeCat = searchParams.cat ?? 'all';
  const currentPage = Math.max(1, parseInt(searchParams.page ?? '1', 10));

  return (
    <BlogContent
      posts={posts}
      categories={CATEGORIES}
      activeCat={activeCat}
      currentPage={currentPage}
    />
  );
}
