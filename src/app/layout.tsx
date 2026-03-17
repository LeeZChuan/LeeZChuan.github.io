import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import TopNav from '@/components/TopNav';

export const metadata: Metadata = {
  title: {
    default: 'YourName',
    template: '%s — YourName',
  },
  description: '分享技术、思考与生活的个人博客',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="bg-white dark:bg-[#0f0f0f] min-h-screen">
        <ThemeProvider>
          <TopNav />
          <main className="pt-14">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
