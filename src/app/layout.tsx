import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import TopNav from '@/components/TopNav';
import { LangProvider } from '@/contexts/LangContext';
import { siteConfig } from '@/lib/site';

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: 'zh-CN',
    publisher: {
      '@type': 'Person',
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.author.name,
    url: siteConfig.url,
    email: `mailto:${siteConfig.author.email}`,
    sameAs: [siteConfig.links.github],
  },
];

const themeScript = `
  (() => {
    const now = new Date();
    const hour = now.getHours();
    const scheduledTheme = hour >= 6 && hour < 18 ? 'light' : 'dark';
    let theme = scheduledTheme;

    try {
      const stored = localStorage.getItem('theme-override');
      if (stored) {
        const override = JSON.parse(stored);
        if (
          (override.theme === 'light' || override.theme === 'dark') &&
          typeof override.expiresAt === 'number' &&
          override.expiresAt > now.getTime()
        ) {
          theme = override.theme;
        } else {
          localStorage.removeItem('theme-override');
        }
      }
    } catch {}

    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  })();
`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  creator: siteConfig.author.name,
  publisher: siteConfig.author.name,
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/images/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: '/',
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-white dark:bg-[#0f0f0f] min-h-screen">
        <ThemeProvider>
          <LangProvider>
            <TopNav />
            <main className="pt-14">
              {children}
            </main>
            <script
              type="application/ld+json"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
              }}
            />
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
