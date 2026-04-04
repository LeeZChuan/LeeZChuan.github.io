'use client';

import Link from 'next/link';
import type { AgentDoc } from '@/lib/agent';

interface Props {
  label: string;
  docs: AgentDoc[];
  emptyText: string;
}

export default function AgentDocListSection({
  label,
  docs,
  emptyText,
}: Props) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 dark:text-[rgba(255,255,255,0.87)] mb-3">
        {label}
      </h2>

      {docs.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-[rgba(255,255,255,0.50)] py-2">
          {emptyText}
        </div>
      ) : (
        <ul className="rounded-xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] divide-y divide-gray-100 dark:divide-white/[0.08]">
          {docs.map((doc) => {
            const href = `/agent-detail/${doc.type}/${doc.relativePath
              .split('/')
              .map((part) => encodeURIComponent(part))
              .join('/')}`;
            return (
              <li key={doc.id}>
                <Link
                  href={href}
                  className="block w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                >
                  <div className="text-sm font-medium text-gray-800 dark:text-[rgba(255,255,255,0.85)]">
                    {doc.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-[rgba(255,255,255,0.60)] mt-1 line-clamp-2">
                    {doc.description}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-[rgba(255,255,255,0.45)] mt-1">
                    {doc.type}/{doc.relativePath}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
