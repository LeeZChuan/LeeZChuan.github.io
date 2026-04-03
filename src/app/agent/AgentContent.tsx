'use client';

import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { translations } from '@/lib/i18n';
import { promptContent, skillContent } from './content';

interface AgentItem {
  name: string;
  type: 'prompt' | 'skill' | 'rules';
  content: string;
}

const agentItems: AgentItem[] = [
  {
    name: '通用埋点方案复用 Prompt 模板',
    type: 'prompt',
    content: promptContent,
  },
  {
    name: '对话与执行护栏（Conversation Guardrails）',
    type: 'skill',
    content: skillContent,
  },
];

export default function AgentContent() {
  const { lang } = useLang();
  const t = translations[lang].agent;
  const [activeTab, setActiveTab] = useState<'prompt' | 'skill' | 'rules'>('prompt');

  const activeItems = agentItems.filter((item) => item.type === activeTab);

  const tabItems = [
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

      <div className="mb-8 flex gap-2 border-b border-gray-200 dark:border-white/[0.08]">
        {tabItems.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === id
                ? 'text-gray-900 dark:text-[rgba(255,255,255,0.87)] border-gray-900 dark:border-[rgba(255,255,255,0.87)]'
                : 'text-gray-500 dark:text-[rgba(255,255,255,0.50)] border-transparent hover:text-gray-900 dark:hover:text-[rgba(255,255,255,0.87)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeItems.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-[rgba(255,255,255,0.50)]">
          No content available for this category yet.
        </div>
      )}

      {activeItems.length > 0 && (
        <div className="space-y-8">
          {activeItems.map((item, idx) => (
            <div key={idx} className="prose dark:prose-invert max-w-none">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-[rgba(255,255,255,0.87)] mb-4">
                {item.name}
              </h2>
              <div className="text-sm text-gray-700 dark:text-[rgba(255,255,255,0.70)] leading-relaxed whitespace-pre-wrap">
                {item.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
