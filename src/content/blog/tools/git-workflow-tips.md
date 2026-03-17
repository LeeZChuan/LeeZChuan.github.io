---
title: 我的 Git 工作流：让提交历史更有意义
description: 好的 Git 历史记录是团队协作的基础。分享我在日常开发中使用的 Git 工作流、提交规范和几个提升效率的技巧。
date: 2024-07-03
tags: [Git, 工具, 工作流]
---

Git 是每天都要用的工具，但很多人只用了它最基本的功能。这篇文章分享我觉得最有价值的工作流实践。

## Conventional Commits

统一的提交信息格式让历史记录可读，也是自动生成 Changelog 的基础：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

常用的 type：

- `feat` — 新功能
- `fix` — Bug 修复
- `docs` — 文档变更
- `refactor` — 重构（不改变功能）
- `perf` — 性能优化
- `chore` — 构建工具、依赖更新等

示例：

```
feat(auth): add OAuth2 login with Google

Implements the Google OAuth2 flow. Users can now sign in with
their Google account from the login page.

Closes #142
```

## `git rebase -i`：整理提交历史

在合并 PR 之前，我通常会整理提交历史：

```bash
git rebase -i HEAD~5
```

这会打开一个编辑器，列出最近 5 个提交。可以：

- `pick` — 保留
- `squash` / `s` — 合并到前一个提交
- `reword` / `r` — 修改提交信息
- `drop` / `d` — 删除这个提交

把一堆 `fix: typo`、`wip: temp` 整理成几个有意义的提交，让 reviewer 的工作轻松很多。

## `git stash` 的正确用法

不只是 `git stash` 和 `git stash pop`：

```bash
# 保存时加描述
git stash push -m "WIP: refactor auth module"

# 查看所有 stash
git stash list

# 应用特定的 stash（不删除）
git stash apply stash@{2}

# 只 stash 特定文件
git stash push src/components/Header.tsx
```

## `git log` 的好看输出

默认的 `git log` 太难看了，配置一个好看的别名：

```bash
git config --global alias.lg "log --oneline --graph --decorate --all"
```

然后用 `git lg` 代替 `git log`。

## `git bisect`：二分查找 Bug

当你不知道哪次提交引入了 Bug 时：

```bash
git bisect start
git bisect bad                  # 当前版本有 bug
git bisect good v1.0.0          # 这个版本没有 bug

# Git 会自动切换到中间某次提交，你测试后：
git bisect good  # 或 git bisect bad

# 重复，Git 会找到引入 bug 的具体提交
git bisect reset  # 结束后恢复
```

这个命令在大型项目里排查历史 Bug 非常有效。

---

Git 是值得深入学习的工具，掌握这些命令能让每天的开发更顺畅。
