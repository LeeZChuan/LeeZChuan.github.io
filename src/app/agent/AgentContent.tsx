'use client';

import { useLang } from '@/contexts/LangContext';
import { translations } from '@/lib/i18n';
import type { AgentContentMap } from '@/lib/agent';
import AgentDocListSection from './components/AgentDocListSection';

interface Props {
  sections: AgentContentMap;
}

export default function AgentContent({ sections }: Props) {
  const { lang } = useLang();
  const t = translations[lang].agent;

  const sectionMeta = [
    { id: 'prompt', label: t.prompt },
    { id: 'skill', label: t.skill },
    { id: 'rules', label: t.rules },
  ] as const;

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

          return (
            <AgentDocListSection
              key={id}
              label={label}
              docs={docs}
              emptyText={t.empty}
            />
          );
        })}
      </div>
    </div>
  );
}
