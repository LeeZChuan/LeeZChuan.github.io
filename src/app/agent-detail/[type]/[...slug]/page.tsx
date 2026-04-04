import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AgentDocViewer from '@/app/agent/components/AgentDocViewer';
import { getAllAgentDocs, getAgentDocByPath, type AgentDocType } from '@/lib/agent';

interface Props {
  params: {
    type: string;
    slug: string[];
  };
}

function isAgentDocType(type: string): type is AgentDocType {
  return type === 'prompt' || type === 'skill' || type === 'rules';
}

function decodeSegments(segments: string[]) {
  return segments.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
}

export async function generateStaticParams() {
  const docs = await getAllAgentDocs();
  return docs.map((doc) => ({
    type: doc.type,
    slug: doc.relativePath.split('/').map((part) => encodeURIComponent(part)),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isAgentDocType(params.type)) return {};
  const relativePath = decodeSegments(params.slug).join('/');
  const doc = await getAgentDocByPath(params.type, relativePath);
  if (!doc) return {};

  return {
    title: `${doc.name} · Agent Detail`,
    description: doc.description,
  };
}

export default async function AgentDetailPage({ params }: Props) {
  if (!isAgentDocType(params.type)) notFound();
  const relativePath = decodeSegments(params.slug).join('/');
  const doc = await getAgentDocByPath(params.type, relativePath);
  if (!doc) notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-6">
        <Link
          href="/agent"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-[rgba(255,255,255,0.60)] hover:text-gray-900 dark:hover:text-[rgba(255,255,255,0.87)] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to Agent
        </Link>
      </div>

      <AgentDocViewer doc={doc} />
    </div>
  );
}
