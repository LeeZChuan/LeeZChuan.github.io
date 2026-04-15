import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';

export type AgentDocType = 'prompt' | 'skill' | 'rules' | 'links';

export interface AgentDoc {
  id: string;
  type: AgentDocType;
  title: string;
  name: string;
  description: string;
  fileName: string;
  relativePath: string;
  contentRaw: string;
  contentHtml: string;
  entryUrl?: string;
}

export type AgentContentMap = Record<AgentDocType, AgentDoc[]>;

const AGENT_CONTENT_DIR = path.join(process.cwd(), 'src/content/agent');
const AGENT_LINKS_FILE = path.join(AGENT_CONTENT_DIR, 'links.json');
const SUPPORTED_EXTENSIONS = new Set(['.md', '.mdc', '.markdown']);
const DOC_TYPES: Exclude<AgentDocType, 'links'>[] = ['prompt', 'skill', 'rules'];

interface AgentLinkEntry {
  slug?: string;
  title?: string;
  name?: string;
  description?: string;
  url?: string;
  summary?: string;
}

function inferTitle(fileName: string, body: string, frontmatterTitle?: unknown) {
  if (typeof frontmatterTitle === 'string' && frontmatterTitle.trim()) {
    return frontmatterTitle.trim();
  }

  const heading = body.match(/^#\s+(.+)$/m);
  if (heading?.[1]) {
    return heading[1].trim();
  }

  return fileName.replace(/\.[^.]+$/, '');
}

function inferDescription(body: string, frontmatterDescription?: unknown) {
  if (typeof frontmatterDescription === 'string' && frontmatterDescription.trim()) {
    return frontmatterDescription.trim();
  }

  const lines = body.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock || trimmed.length === 0) continue;
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('|')) continue;

    const normalized = trimmed.replace(/^>\s*/, '');
    if (normalized.length > 0) return normalized;
  }

  return '暂无描述';
}

async function renderMarkdown(content: string) {
  const processed = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  return processed.toString();
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function readDocsByType(type: Exclude<AgentDocType, 'links'>): Promise<AgentDoc[]> {
  const dir = path.join(AGENT_CONTENT_DIR, type);
  if (!fs.existsSync(dir)) return [];

  const filePaths: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        filePaths.push(fullPath);
      }
    }
  }

  walk(dir);
  filePaths.sort((a, b) => {
    const aRelative = path.relative(dir, a);
    const bRelative = path.relative(dir, b);
    return aRelative.localeCompare(bRelative, 'zh-CN');
  });

  const docs = await Promise.all(
    filePaths.map(async (fullPath) => {
      const raw = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(raw);
      const fileName = path.basename(fullPath);
      const relativePath = path.relative(dir, fullPath).replace(/\\/g, '/');
      const title = inferTitle(fileName, content, data.title);
      const name = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : title;
      const description = inferDescription(content, data.description);
      const contentHtml = await renderMarkdown(content);

      return {
        id: `${type}/${relativePath}`,
        type,
        title,
        name,
        description,
        fileName,
        relativePath,
        contentRaw: raw,
        contentHtml,
      };
    })
  );

  return docs;
}

async function readLinkDocs(): Promise<AgentDoc[]> {
  if (!fs.existsSync(AGENT_LINKS_FILE)) return [];

  const raw = fs.readFileSync(AGENT_LINKS_FILE, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  const entries: AgentLinkEntry[] = Array.isArray(parsed)
    ? parsed
    : (parsed as { links?: AgentLinkEntry[] })?.links ?? [];

  const docs = await Promise.all(
    entries
      .filter((entry) => entry.title && entry.description && entry.url)
      .map(async (entry, index) => {
        const title = entry.title!.trim();
        const description = entry.description!.trim();
        const url = entry.url!.trim();
        const slugBase = entry.slug?.trim() || slugify(title) || `link-${index + 1}`;
        const relativePath = `${slugBase}.link.md`;
        const name = entry.name?.trim() || title;
        const summary = entry.summary?.trim() || description;
        const contentRaw = `# ${title}

${summary}

## 入口

- [${url}](${url})
`;
        const contentHtml = await renderMarkdown(contentRaw);

        return {
          id: `links/${relativePath}`,
          type: 'links' as const,
          title,
          name,
          description,
          fileName: path.basename(relativePath),
          relativePath,
          contentRaw,
          contentHtml,
          entryUrl: url,
        };
      })
  );

  return docs;
}

export async function getAgentContent(): Promise<AgentContentMap> {
  const [prompt, skill, rules, links] = await Promise.all([
    readDocsByType('prompt'),
    readDocsByType('skill'),
    readDocsByType('rules'),
    readLinkDocs(),
  ]);

  return {
    prompt,
    skill,
    rules,
    links,
  };
}

export async function getAllAgentDocs(): Promise<AgentDoc[]> {
  const sections = await getAgentContent();
  return [...sections.prompt, ...sections.skill, ...sections.rules, ...sections.links];
}

export async function getAgentDocByPath(type: AgentDocType, relativePath: string): Promise<AgentDoc | null> {
  const docs = type === 'links' ? await readLinkDocs() : await readDocsByType(type);
  const normalized = relativePath.replace(/\\/g, '/');
  return docs.find((doc) => doc.relativePath === normalized) ?? null;
}
