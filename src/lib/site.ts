export const siteConfig = {
  name: 'LeeZChuan',
  title: 'LeeZChuan',
  description:
    'LeeZChuan 的个人博客，记录全栈开发、AI 工程、Web 架构、工具实践，以及阅读、旅行和生活思考。',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leezchuan.github.io').replace(/\/$/, ''),
  ogImage: '/images/og-image.png',
  author: {
    name: 'LeeZChuan',
    email: 'cdutlzc@gmail.com',
    url: 'https://github.com/LeeZChuan',
  },
  links: {
    github: 'https://github.com/LeeZChuan',
  },
};

export function absoluteUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`;
}
