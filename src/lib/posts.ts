import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeSlug from 'rehype-slug';

const postsDir = path.join(process.cwd(), 'src/content/blog');

export const CATEGORIES: Record<string, { label: string; description: string }> = {
  tech: { label: '技术', description: '前端、后端、框架与语言' },
  business: { label: '商业', description: '互联网商业与产品思维' },
  notes: { label: '笔记', description: '工作记录与架构设计' },
  life: { label: '生活', description: '阅读、旅行与日常思考' },
};

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: string;
  draft: boolean;
}

export interface Post extends PostMeta {
  contentHtml: string;
}

function scanPostFiles(): Array<{ slug: string; filePath: string; category: string }> {
  if (!fs.existsSync(postsDir)) return [];
  const results: Array<{ slug: string; filePath: string; category: string }> = [];

  function walk(dir: string, topCategory: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const nextTop = topCategory === '' ? entry.name : topCategory;
        walk(fullPath, nextTop);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const slug = entry.name.replace(/\.md$/, '');
        results.push({ slug, filePath: fullPath, category: topCategory });
      }
    }
  }

  walk(postsDir, '');
  return results;
}

export function getAllPostSlugs(): string[] {
  return scanPostFiles().map(({ slug }) => slug);
}

export function getAllPosts(): PostMeta[] {
  return scanPostFiles()
    .map(({ slug, filePath, category }) => {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);
      return {
        slug,
        title: data.title ?? '',
        description: data.description ?? '',
        date: data.date ? new Date(data.date).toISOString() : '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        category,
        draft: data.draft ?? false,
      } as PostMeta;
    })
    .filter((p) => !p.draft)
    .sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf());
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const files = scanPostFiles();
  const found = files.find((f) => f.slug === slug);
  if (!found) return null;

  const fileContents = fs.readFileSync(found.filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const processed = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  return {
    slug,
    title: data.title ?? '',
    description: data.description ?? '',
    date: data.date ? new Date(data.date).toISOString() : '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    category: found.category,
    draft: data.draft ?? false,
    contentHtml: processed.toString(),
  };
}

export function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(isoDate));
}

export function formatDateShort(isoDate: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date(isoDate))
    .replace(/\//g, '-');
}
