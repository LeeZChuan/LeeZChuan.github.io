'use client';

import { useLang } from '@/contexts/LangContext';
import { translations } from '@/lib/i18n';

export default function AboutContent() {
  const { lang } = useLang();
  const t = translations[lang].about;

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-[rgba(255,255,255,0.87)] mb-8">
        LeeZChuan
      </h1>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p>{t.bio}</p>

        <h2>{t.techStack}</h2>
        <ul>
          <li><strong>{t.frontend}</strong>Vue 3, React, TypeScript, Tailwind CSS</li>
          <li><strong>{t.backend}</strong>Node.js, Java, PostgreSQL</li>
          <li><strong>{t.tools}</strong>Vite, Docker, GitHub Actions</li>
        </ul>

        <h2>{t.interests}</h2>
        <ul>
          {t.interestItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>{t.contact}</h2>
        <ul>
          <li>GitHub: <a href="https://github.com/LeeZChuan" target="_blank" rel="noopener noreferrer">@LeeZChuan</a></li>
          <li>Email: <a href="mailto:cdutlzc@gmail.com">cdutlzc@gmail.com</a></li>
        </ul>
      </div>
    </div>
  );
}
