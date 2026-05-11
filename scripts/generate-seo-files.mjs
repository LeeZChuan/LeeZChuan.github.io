import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const postsDir = path.join(rootDir, 'src/content/blog');
const publicDir = path.join(rootDir, 'public');
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leezchuan.github.io').replace(/\/$/, '');
const fallbackDate = '1970-01-01T00:00:00.000Z';

function absoluteUrl(routePath) {
  return `${siteUrl}${routePath.startsWith('/') ? routePath : `/${routePath}`}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function scanPostFiles() {
  if (!fs.existsSync(postsDir)) return [];
  const results = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push({
          slug: entry.name.replace(/\.md$/, ''),
          filePath: fullPath,
        });
      }
    }
  }

  walk(postsDir);
  return results;
}

const posts = scanPostFiles()
  .map(({ slug, filePath }) => {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);
    return {
      slug,
      date: data.date ? new Date(data.date).toISOString() : fallbackDate,
      draft: Boolean(data.draft),
    };
  })
  .filter((post) => !post.draft)
  .sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf());

const latestPostDate = posts[0]?.date ?? fallbackDate;
const routes = [
  { path: '/', lastModified: latestPostDate, changeFrequency: 'weekly', priority: 1 },
  { path: '/blog', lastModified: latestPostDate, changeFrequency: 'weekly', priority: 0.9 },
  { path: '/projects', lastModified: latestPostDate, changeFrequency: 'monthly', priority: 0.7 },
  { path: '/about', lastModified: latestPostDate, changeFrequency: 'yearly', priority: 0.6 },
  { path: '/agent', lastModified: latestPostDate, changeFrequency: 'monthly', priority: 0.6 },
  ...posts.map((post) => ({
    path: `/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: 'monthly',
    priority: 0.8,
  })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `<url>
  <loc>${escapeXml(absoluteUrl(route.path))}</loc>
  <lastmod>${escapeXml(route.lastModified)}</lastmod>
  <changefreq>${route.changeFrequency}</changefreq>
  <priority>${route.priority}</priority>
</url>`
  )
  .join('\n')}
</urlset>
`;

const robots = `User-Agent: *
Allow: /

Host: ${siteUrl}
Sitemap: ${absoluteUrl('/sitemap.xml')}
`;

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots);
