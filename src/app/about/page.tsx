import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-[rgba(255,255,255,0.87)] mb-8">
        LeeZChuan
      </h1>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p>
          作为一名全栈开发者，我精通 Vue 3、React、Node.js 和 Java。在编码之外，我同样热衷于滑雪、骑行、徒步以及摄影，在技术与自然中寻找平衡与灵感。加入我的旅程，一起探索技术的力量、户外生活的魅力，以及镜头背后的世界。
        </p>

        <h2>技术栈</h2>
        <ul>
          <li><strong>前端：</strong>Vue 3, React, TypeScript, Tailwind CSS</li>
          <li><strong>后端：</strong>Node.js, Java, PostgreSQL</li>
          <li><strong>工具：</strong>Vite, Docker, GitHub Actions</li>
        </ul>

        <h2>兴趣爱好</h2>
        <ul>
          <li>滑雪 · 骑行 · 徒步</li>
          <li>摄影</li>
        </ul>

        <h2>联系</h2>
        <ul>
          <li>GitHub: <a href="https://github.com/LeeZChuan" target="_blank" rel="noopener noreferrer">@LeeZChuan</a></li>
          <li>Email: <a href="mailto:cdutlzc@gmail.com">cdutlzc@gmail.com</a></li>
        </ul>
      </div>
    </div>
  );
}
