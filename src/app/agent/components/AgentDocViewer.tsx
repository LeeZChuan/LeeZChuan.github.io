'use client';

import { useState } from 'react';
import type { AgentDoc } from '@/lib/agent';
import { useLang } from '@/contexts/LangContext';

interface Props {
  doc: AgentDoc;
}

export default function AgentDocViewer({ doc }: Props) {
  const { lang } = useLang();
  const [copied, setCopied] = useState(false);

  const labels = lang === 'zh'
    ? {
        copy: '复制',
        copied: '已复制',
        name: '名称',
        description: '描述',
        type: '分类',
        path: '路径',
      }
    : {
        copy: 'Copy',
        copied: 'Copied',
        name: 'Name',
        description: 'Description',
        type: 'Type',
        path: 'Path',
      };

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(doc.contentRaw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-[rgba(255,255,255,0.87)]">
            {doc.title}
          </h2>
          <button
            onClick={onCopy}
            className="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-white/[0.12] text-gray-600 dark:text-[rgba(255,255,255,0.70)] hover:text-gray-900 dark:hover:text-[rgba(255,255,255,0.87)] hover:border-gray-300 dark:hover:border-white/[0.25] transition-colors"
          >
            {copied ? labels.copied : labels.copy}
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 dark:text-[rgba(255,255,255,0.45)]">{labels.name}</p>
            <p className="text-gray-800 dark:text-[rgba(255,255,255,0.85)] mt-1">{doc.name}</p>
          </div>
          <div>
            <p className="text-gray-400 dark:text-[rgba(255,255,255,0.45)]">{labels.type}</p>
            <p className="text-gray-800 dark:text-[rgba(255,255,255,0.85)] mt-1">{doc.type}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-gray-400 dark:text-[rgba(255,255,255,0.45)]">{labels.path}</p>
            <p className="text-gray-800 dark:text-[rgba(255,255,255,0.85)] mt-1 break-all">{doc.type}/{doc.relativePath}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-gray-400 dark:text-[rgba(255,255,255,0.45)]">{labels.description}</p>
            <p className="text-gray-700 dark:text-[rgba(255,255,255,0.75)] mt-1 leading-relaxed">{doc.description}</p>
          </div>
        </div>
      </section>

      <article className="rounded-xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5">
        <div
          className="prose prose-gray dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-code:before:content-none prose-code:after:content-none"
          dangerouslySetInnerHTML={{ __html: doc.contentHtml }}
        />
      </article>
    </div>
  );
}
