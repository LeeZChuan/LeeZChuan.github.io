import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Projects' };

const projects = [
  {
    name: 'project-alpha',
    description: '一个高性能的前端构建工具，支持热重载和模块联邦，专为大型团队设计。',
    url: 'https://example.com',
    github: 'https://github.com',
    tags: ['TypeScript', 'Vite', 'Node.js'],
    featured: true,
  },
  {
    name: 'design-system',
    description: '基于 React 的企业级组件库，包含 50+ 个无障碍组件，覆盖常见业务场景。',
    url: 'https://example.com',
    github: 'https://github.com',
    tags: ['React', 'Tailwind CSS', 'Storybook'],
    featured: true,
  },
  {
    name: 'next-blog-theme',
    description: '这个博客本身的主题，基于 Next.js，开源、简洁、高性能，支持 Markdown 和深色模式。',
    github: 'https://github.com',
    tags: ['Next.js', 'Markdown', 'Tailwind CSS'],
    featured: true,
  },
  {
    name: 'cli-toolkit',
    description: '命令行工具集合，用于自动化日常开发任务，包括代码生成、数据库迁移等。',
    github: 'https://github.com',
    tags: ['Go', 'CLI', 'DevOps'],
    featured: false,
  },
  {
    name: 'micro-state',
    description: '超轻量级状态管理库，压缩后不到 1kb，API 简洁，类型安全。',
    github: 'https://github.com',
    tags: ['TypeScript', 'React', 'State Management'],
    featured: false,
  },
  {
    name: 'api-mock',
    description: '基于 OpenAPI 规范的 Mock 服务器，可自动生成符合 Schema 的测试数据。',
    github: 'https://github.com',
    tags: ['Node.js', 'OpenAPI', 'Testing'],
    featured: false,
  },
];

const ExternalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const GitHubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

export default function ProjectsPage() {
  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">Projects</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">我构建的一些项目和开源作品</p>
      </div>

      <section className="mb-12">
        <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">
          精选项目
        </h2>
        <div className="space-y-4">
          {featured.map((project) => (
            <div
              key={project.name}
              className="p-5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 font-mono text-sm">
                  {project.name}
                </h3>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {project.url && (
                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" aria-label="访问项目">
                      <ExternalIcon />
                    </a>
                  )}
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" aria-label="GitHub">
                      <GitHubIcon />
                    </a>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">{project.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span key={tag} className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/60 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-5">
          其他项目
        </h2>
        <ul className="-mx-2 space-y-0">
          {others.map((project) => (
            <li key={project.name}>
              <div className="flex items-center justify-between px-2 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-sm text-gray-800 dark:text-gray-200">{project.name}</span>
                  <span className="hidden sm:block text-xs text-gray-400 dark:text-gray-500 truncate">{project.description}</span>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noopener noreferrer" className="text-gray-300 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" aria-label="GitHub">
                      <GitHubIcon />
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
