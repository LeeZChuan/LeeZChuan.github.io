import type { Metadata } from 'next';
import AgentContent from './AgentContent';
import { getAgentContent } from '@/lib/agent';
import { siteConfig } from '@/lib/site';

const description = 'LeeZChuan 整理的 AI Agent 提示词、规则、技能和工程化工作流资料。';

export const metadata: Metadata = {
  title: 'Agent',
  description,
  alternates: {
    canonical: '/agent',
  },
  openGraph: {
    title: `Agent — ${siteConfig.name}`,
    description,
    url: '/agent',
    type: 'website',
  },
};

export default async function AgentPage() {
  const sections = await getAgentContent();
  return <AgentContent sections={sections} />;
}
