import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import TopNav from '@/components/TopNav';

export const metadata: Metadata = {
  title: {
    default: 'LeeZChuan',
    template: '%s — LeeZChuan',
  },
  description: '作为一名全栈开发者，我精通 Vue 3、React、Node.js 和 Java。在编码之外，我同样热衷于滑雪、骑行、徒步以及摄影，在技术与自然中寻找平衡与灵感。',
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
