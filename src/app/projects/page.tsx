import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Projects' };

type FeaturedProject = {
  name: string;
  description: string;
  github?: string;
  url?: string;
  tags: string[];
};

const featured: FeaturedProject[] = [
  {
    name: 'aimarket-analysis-platform',
    description: '基于 React 18 + TypeScript + Vite 的 AI 股票分析交易平台。用户可与图表交互提取范围数据，组装成结构化内容传给 LLM 进行对话，同时设计了 RAG 方案提升对话质量。后端基于 Node.js + Express + Prisma，数据来源为 yfinance 海外股票历史数据。',
    github: 'https://github.com/LeeZChuan/aimarket-analysis-platform',
    tags: ['React 18', 'TypeScript', 'Vite', 'Node.js', 'Prisma', 'RAG', 'LLM'],
  },
  {
    name: 'znz-ui',
    description: '基于 Element Plus 封装的企业级业务组件库，包含 Table、Date 等高频业务组件，使用 BEM 语法与组件抽象定义。集成虚拟滚动技术，支持超过 100k 个单元格的大数据表格，发布至内网 npm 仓库，开箱即用。',
    tags: ['Vue 3', 'Element Plus', 'TypeScript', 'Virtual Scroll', 'BEM', 'Monorepo'],
  },
  {
    name: 'ZRender 矩形树图',
    description: '基于 ZRender 底层渲染引擎从零实现的矩形树图（Treemap）组件，用于板块数据可视化展示。支持缩放、拖拽交互，参考主流图表平台设计理念，采用合理的功能划分与封装架构，使用 Rollup 打包发布。',
    tags: ['TypeScript', 'ZRender', 'Visualization', 'Rollup'],
  },
];

const others = [
  {
    name: '行情 K 线图表库',
    description: '基于开源 klinecharts 定制化修改的业务行情组件，已应用于 App 引导学习等页面。',
    url: 'https://klinecharts.com/',
    tags: ['TypeScript', 'pnpm', 'Rollup'],
    date: '2025-01',
  },
  {
    name: '原生多场景表格组件',
    description: '为支持 Win7/XP 低版本浏览器，使用 OOP 模式在 Vue 中封装带虚拟滚动、分页、子列展开的原生表格，支持左侧固定列。',
    tags: ['Vue', 'JavaScript', 'OOP', '低版本兼容'],
    date: '2024',
  },
  {
    name: '易盘点 SaaS 平台',
    description: '固定资产管理 SaaS 平台，涵盖 Web 管理端、钉钉小程序与微信小程序多端，基于 Taro 框架实现跨端开发。',
    url: 'https://web.epandian.com/',
    tags: ['Vue 3', 'Taro', 'TypeScript'],
    date: '2023-01',
  },
  {
    name: 'Ainvest 移动端图表库',
    description: '在同花顺期间，为海外 F10 移动端提供标准化基础图表组件，减少业务前端的图表配置开发量，提高研发效率。',
    url: 'https://s.thsi.cn/cd/iwc-datav-datav-front-web/components/chart-kit/demo/light.html',
    tags: ['JavaScript', 'ZRender', 'Visualization'],
    date: '2021-12',
  },
  {
    name: '带时间轴的动态图表',
    description: '在同花顺期间，基于金融数据时间属性，设计并实现带时间轴的动态矩形树图、柱状图、折线图。',
    url: 'https://basic.10jqka.com.cn/datav/dividendFinancingAnimation.html?code=300033',
    tags: ['JavaScript', 'D3.js', 'Visualization'],
    date: '2022-03',
  },
  {
    name: 'BDVis 数据安全可视分析',
    description: 'ChinaVis 2022 参赛作品，使用 Neo4j 图数据库进行分析，结合 React + D3.js 构建可视化工具辅助信息安全数据分析。',
    url: 'https://chinavis.org/2022/challenge.html',
    tags: ['React', 'D3.js', 'Neo4j', 'Visualization'],
    date: '2022-06',
  },
  {
    name: 'SCVis 传感器异常可视化',
    description: 'ChinaVis 2019 参赛作品，设计并制作实时可视化监控平台，荣获一等奖（2018 年参赛获优秀奖）。',
    url: 'https://chinavis.org/2019/challenge.html',
    tags: ['JavaScript', 'D3.js', 'Echarts', 'Visualization'],
    date: '2019-06',
  },
  {
    name: 'HaiKouTVis 交通流量可视化',
    description: '参加 2019 CCF-BDCI 交通流量时空演变特征可视分析比赛，基于 Echarts 和 D3.js 开发交通流量分析平台，获三等奖。',
    url: 'https://leezchuan.github.io/HaiKouTVis-master/',
    tags: ['JavaScript', 'Echarts', 'D3.js', 'Visualization'],
    date: '2019-10',
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
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">Projects</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">参与构建或独立负责的项目与开源作品</p>
      </div>

      <section className="mb-12">
        <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">
          代表项目
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
          涉猎并参与的项目
        </h2>
        <ul className="-mx-2 space-y-0">
          {others.map((project) => (
            <li key={project.name}>
              <div className="flex items-center justify-between px-2 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-sm text-gray-800 dark:text-gray-200 shrink-0">{project.name}</span>
                  <span className="hidden sm:block text-xs text-gray-400 dark:text-gray-500 truncate">{project.description}</span>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span className="hidden sm:block text-xs text-gray-300 dark:text-gray-600 tabular-nums">{project.date}</span>
                  {project.url && (
                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" aria-label="访问项目">
                      <ExternalIcon />
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
