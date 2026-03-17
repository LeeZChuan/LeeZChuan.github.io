import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-[rgba(255,255,255,0.87)] mb-8">
        YourName
      </h1>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p>
          你好！我是 YourName，一位热爱技术的全栈开发者，目前专注于 Web 开发和开源软件。
          我相信好的软件应该简单、快速、可靠，并且对用户友好。
        </p>

        <p>
          我日常使用 TypeScript、React 和 Node.js 构建 Web 应用，对性能优化和开发者体验有浓厚兴趣。
          闲暇时我喜欢为开源项目做贡献，写一些小工具来解决日常遇到的问题。
        </p>

        <h2>技术栈</h2>
        <ul>
          <li><strong>前端：</strong>TypeScript, React, Next.js, Tailwind CSS</li>
          <li><strong>后端：</strong>Node.js, Go, PostgreSQL, Redis</li>
          <li><strong>工具：</strong>Vite, Docker, GitHub Actions</li>
          <li><strong>云服务：</strong>Vercel, Cloudflare</li>
        </ul>

        <h2>我在做什么</h2>
        <p>
          目前在维护几个开源项目，同时探索 AI 辅助开发的可能性。
          这个博客是分享技术思考和项目记录的地方。
        </p>

        <h2>联系</h2>
        <ul>
          <li>GitHub: <a href="https://github.com/yourname" target="_blank" rel="noopener noreferrer">@yourname</a></li>
          <li>Email: <a href="mailto:hello@example.com">hello@example.com</a></li>
          <li>Twitter: <a href="https://twitter.com/yourname" target="_blank" rel="noopener noreferrer">@yourname</a></li>
        </ul>
      </div>
    </div>
  );
}
