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

const NOTICE_ICONS: Record<string, string> = {
  note: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  warning: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  tip: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  danger: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
};

const NOTICE_LABELS: Record<string, string> = {
  note: '备注',
  warning: '注意',
  tip: '提示',
  danger: '警告',
};

function transformNoticeShortcodes(content: string): string {
  return content.replace(
    /\{\{<\s*notice\s+"(\w+)"\s*>\}\}([\s\S]*?)\{\{<\s*\/notice\s*>\}\}/g,
    (_, type: string, inner: string) => {
      const t = type.toLowerCase();
      const icon = NOTICE_ICONS[t] ?? NOTICE_ICONS.note;
      const label = NOTICE_LABELS[t] ?? type;
      const body = inner.trim();
      return `<div class="notice notice-${t}"><div class="notice-header">${icon}<span>${label}</span></div><div class="notice-body">\n\n${body}\n\n</div></div>`;
    }
  );
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const files = scanPostFiles();
  const found = files.find((f) => f.slug === slug);
  if (!found) return null;

  const fileContents = fs.readFileSync(found.filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const transformedContent = transformNoticeShortcodes(content);

  const processed = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(transformedContent);

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
