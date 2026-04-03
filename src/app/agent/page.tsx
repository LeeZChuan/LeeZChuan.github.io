import type { Metadata } from 'next';
import AgentContent from './AgentContent';
import { getAgentContent } from '@/lib/agent';

export const metadata: Metadata = { title: 'Agent' };

export default async function AgentPage() {
  const sections = await getAgentContent();
  return <AgentContent sections={sections} />;
}
