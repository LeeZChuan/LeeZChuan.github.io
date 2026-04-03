import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';

export type AgentDocType = 'prompt' | 'skill' | 'rules';

export interface AgentDoc {
  id: string;
  type: AgentDocType;
  title: string;
  fileName: string;
  contentRaw: string;
  contentHtml: string;
}

export type AgentContentMap = Record<AgentDocType, AgentDoc[]>;

const AGENT_CONTENT_DIR = path.join(process.cwd(), 'src/content/agent');
const SUPPORTED_EXTENSIONS = new Set(['.md', '.mdc', '.markdown']);
const DOC_TYPES: AgentDocType[] = ['prompt', 'skill', 'rules'];

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

async function readDocsByType(type: AgentDocType): Promise<AgentDoc[]> {
  const dir = path.join(AGENT_CONTENT_DIR, type);
  if (!fs.existsSync(dir)) return [];

  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

  const docs = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(raw);
      const title = inferTitle(entry.name, content, data.title);
      const contentHtml = await renderMarkdown(content);

      return {
        id: `${type}/${entry.name}`,
        type,
        title,
        fileName: entry.name,
        contentRaw: raw,
        contentHtml,
      };
    })
  );

  return docs;
}

export async function getAgentContent(): Promise<AgentContentMap> {
  const sections = await Promise.all(DOC_TYPES.map((type) => readDocsByType(type)));

  return {
    prompt: sections[0],
    skill: sections[1],
    rules: sections[2],
  };
}
