import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site';
import AboutContent from './AboutContent';

const description = '关于 LeeZChuan 的个人介绍、技术背景、兴趣和联系方式。';

export const metadata: Metadata = {
  title: 'About',
  description,
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: `About — ${siteConfig.name}`,
    description,
    url: '/about',
    type: 'profile',
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
