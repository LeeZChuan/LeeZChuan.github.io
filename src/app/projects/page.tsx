import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site';
import ProjectsContent from './ProjectsContent';

const description = 'LeeZChuan 的项目作品与工程实践，包括 AI、前端、全栈和自动化方向。';

export const metadata: Metadata = {
  title: 'Projects',
  description,
  alternates: {
    canonical: '/projects',
  },
  openGraph: {
    title: `Projects — ${siteConfig.name}`,
    description,
    url: '/projects',
    type: 'website',
  },
};

export default function ProjectsPage() {
  return <ProjectsContent />;
}
