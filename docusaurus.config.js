// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '不如怀念',
  tagline: '记录 分享 交流 思考',
  url: 'https://lzc.github.io',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'lzc', // Usually your GitHub org/user name.
  projectName: 'lzc.github.io', // Usually your repo name.
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    // defaultLocale: 'en',
    // locales: ['en'],
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        // docs: {
        //   sidebarPath: require.resolve('./sidebars.js'),
        //   // Please change this to your repo.
        //   // Remove this to remove the "edit this page" links.
        //   editUrl:
        //     'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        // },
        docs: false,
        blog: {
          routeBasePath: '/', // Serve the blog at the site's root
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/LeeZChuan/LeeZChuan.github.io/tree/master/',
          blogSidebarCount: 'ALL',
          blogSidebarTitle: '所有文章',
          // postsPerPage: 10,
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: '点点滴滴',
        // logo: {
        //   alt: 'My Site Logo',
        //   src: 'img/logo.svg',
        // },
        items: [
          // {
          //   type: 'doc',
          //   docId: 'intro',
          //   position: 'left',
          //   label: 'Tutorial',
          // },
          { to: '/archive', label: '文章归档', position: 'left' },
          { to: '/tags', label: '标签分类', position: 'left' },
          {
            href: 'https://github.com/LeeZChuan/LeeZChuan.github.io',
            label: 'Source',
            position: 'right',
          },
        ],
        hideOnScroll: true,
      },
      footer: {
        style: 'dark',
        links: [
          // {
          //   title: '更多',
          //   items: [
          {
            label: '收藏列表',
            href: 'https://github.com/LeeZChuan/awesome-favorites-list',
          },
          {
            label: 'The Book Of Ruby(zh)',
            href: 'https://LeeZChuan.github.io/the-book-of-ruby/',
          },
          {
            label: 'Email',
            href: 'mailto:@126.com',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/LeeZChuan',
          },
          {
            label: 'Gitee',
            href: 'https://gitee.com/LeeZChuan',
          },
          // ],
          // },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} My Blog. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        language: ['en', 'zh'],
        hashed: true,
        indexDocs: false,
        blogRouteBasePath: '/',
      },
    ],
  ],

  //
};

module.exports = config;
