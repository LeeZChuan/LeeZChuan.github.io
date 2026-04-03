'use client';

import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { translations } from '@/lib/i18n';
import type { AgentContentMap, AgentDocType } from '@/lib/agent';

interface Props {
  sections: AgentContentMap;
}

export default function AgentContent({ sections }: Props) {
  const { lang } = useLang();
  const t = translations[lang].agent;
  const [activeByType, setActiveByType] = useState<Record<AgentDocType, string | null>>({
    prompt: sections.prompt[0]?.id ?? null,
    skill: sections.skill[0]?.id ?? null,
    rules: sections.rules[0]?.id ?? null,
  });
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  const sectionMeta = [
    { id: 'prompt', label: t.prompt },
    { id: 'skill', label: t.skill },
    { id: 'rules', label: t.rules },
  ] as const;

  function selectDoc(type: AgentDocType, docId: string) {
    setActiveByType((prev) => ({ ...prev, [type]: docId }));
  }

  async function copyContent(docId: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedDocId(docId);
      window.setTimeout(() => setCopiedDocId((prev) => (prev === docId ? null : prev)), 1200);
    } catch {
      setCopiedDocId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-[rgba(255,255,255,0.87)] mb-1">
          {t.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-[rgba(255,255,255,0.50)]">
          AI Agent Prompts, Skills, and Rules
        </p>
      </div>

      <div className="space-y-10">
        {sectionMeta.map(({ id, label }) => {
          const docs = sections[id];
          const activeId = activeByType[id];
          const activeDoc = docs.find((doc) => doc.id === activeId) ?? docs[0];

          return (
            <section key={id}>
              <h2 className="text-base font-semibold text-gray-900 dark:text-[rgba(255,255,255,0.87)] mb-3">
                {label}
              </h2>

              {docs.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-[rgba(255,255,255,0.50)] py-3">
                  {t.empty}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {docs.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => selectDoc(id, doc.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          activeDoc?.id === doc.id
                            ? 'bg-gray-900 dark:bg-white/[0.87] text-white dark:text-gray-900'
                            : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-[rgba(255,255,255,0.60)] hover:bg-gray-200 dark:hover:bg-white/[0.10]'
                        }`}
                      >
                        {doc.title}
                      </button>
                    ))}
                  </div>

                  {activeDoc && (
                    <article className="rounded-xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-[rgba(255,255,255,0.87)]">
                          {activeDoc.title}
                        </h3>
                        <button
                          onClick={() => copyContent(activeDoc.id, activeDoc.contentRaw)}
                          className="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-white/[0.12] text-gray-600 dark:text-[rgba(255,255,255,0.70)] hover:text-gray-900 dark:hover:text-[rgba(255,255,255,0.87)] hover:border-gray-300 dark:hover:border-white/[0.25] transition-colors"
                        >
                          {copiedDocId === activeDoc.id ? t.copied : t.copy}
                        </button>
                      </div>
                      <div
                        className="prose prose-gray dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-code:before:content-none prose-code:after:content-none"
                        dangerouslySetInnerHTML={{ __html: activeDoc.contentHtml }}
                      />
                    </article>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
