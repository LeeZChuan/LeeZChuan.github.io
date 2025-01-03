---
title: 利用脚本执行 `tsc` 忽略类型检查错误
date: 2022-08-06 17:33:00
update: 2022-08-13 02:46:00
author: LeeZChuan
categories: &ref_0
  - 计算机技术
  - 工具
  - TypeScript
  - 类型定义
description: TypeScript 作为一个强类型的语言，增强了 JavaScript 编程开发体验，类型定义文件为一个第三方模块的使用体验增色不少，现如今很多 npm 包的发布都内置了对类型定义文件的支持。
---

在发布 npm 包时添加对 TypeScript 类型定义文件的支持会让用户的使用体验增色不少，TypeScript 官方提供了 `tsc --emitDeclarationOnly` 命令用来生成类型定义文件（`.d.ts`）。但是，该命令会同时执行类型检查，遇到错误时会报错中断命令行进程，这就使其无法直接集成在 CI 环节在发布 npm 包时自动执行生成类型定义文件的操作。当然，一个解决办法就是解决掉代码中所有的类型检查错误即可，既然讨论到这个问题，必然不会花费额外精力去解决一些历史遗留问题。

<!-- truncate -->

```bash
tsc --emitDeclarationOnly
```

怎么能让以上脚本在执行时不做类型检查（或者说忽略错误，例如类似 `silent` 标志位），在查阅了很多资料之后，显然 TypeScript 官方没有对其支持（因为他们认为忽略类型检查错误就失去了使用 TypeScript 的意义），但另一方面前端生态的很多工具链却都一致的推荐使用类 Babel 这种编译方案（不做类型检查），而且有很多开发者是有这样的需求的。在查阅很多资料无果后，突然想到前段时间学习了 Nodejs 的 `child_process` API，可以用其来写一些工具脚本，最终有了一个待实践的方案：利用 JS 脚本执行该命令，但忽略类型检查错误不让进程中断，这样就可以安全的集成到 CI 环节中。经过实践，确实能达到预期效果，贴出代码：

```js
const { execSync } = require("node:child_process");

try {
  const args = process.argv.slice(2);
  let isSilent = args.findIndex((item) => item.trim() === "--silent");
  if (isSilent > -1) {
    args.splice(isSilent, 1);
    isSilent = true;
  } else {
    isSilent = false;
  }

  if (isSilent) {
    console.log("[generate-types] silent mode");
  } // see https://nodejs.org/dist/latest-v16.x/docs/api/child_process.html#optionsstdio

  const result = execSync(`npx tsc --emitDeclarationOnly ${args.join(" ")}`, {
    cwd: WORKING_DIRECTORY,
    encoding: "utf8",
    stdio: isSilent ? "ignore" : ["inherit", "inherit", "ignore"],
  });
} catch (error) {
  // console.error(error.message);
}
```

这里实际上是利用 `try ... catch` 将错误捕获，防止其导致进程异常中断；另外，使用了 `stdio` 配置项去控制子进程的执行结果信息怎么交由父进程来处理，利用 `silent` 标志位将所有的输出信息忽略，或者仅忽略掉错误信息，类型检查的结果信息依然可以打印到控制台以做参考。

```bash
node generate-types.cjs --silent

node generate-types.cjs

node generate-types.cjs --watch # 等同于 tsc --emitDeclarationOnly --watch
```

在实际使用的过程中，发现 CI 环节的 Node 环境中会报错（`npx` 不存在），解决方案就是将要执行的命令写成 npm 脚本，在 js 脚本中运行 npm 脚本即可，例如：

```js
// npm 脚本
{
    "tsc:types": "tsc --emitDeclarationOnly"
}

// js 脚本
execSync(`npm run tsc:types`);
```

至此，利用脚本执行命令可以轻松解决无法控制程序命令行为的问题。

### 参考资源

- https://www.typescriptlang.org/docs/handbook/declaration-files/dts-from-js.html
