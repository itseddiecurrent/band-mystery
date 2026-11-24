# 贡献指南 / Contributing

本仓库采用：**从最新 `main` 创建工作分支 → 修改并验证 → 提交 Pull Request（PR）→ 同事审核批准 → 合并到 `main` → 删除 PR 来源分支**。

不要直接向 `main` 推送。每个 PR 只解决一件事，保持改动小、原因清楚、结果可验证。

## 1. 获取源码，创建工作分支

首次参与：

```sh
git clone https://github.com/itseddiecurrent/band-mystery.git
cd band-mystery
```

先检查未提交的工作，再从最新主分支创建新分支：

```sh
git status
git fetch origin
git switch -c codex/short-topic origin/main
```

将 `codex/short-topic` 换成自己的分支名，例如 `xiaowang/fix-clue-history`。Codex 创建的分支默认使用 `codex/` 前缀。每个任务新建分支，不复用他人分支或已合并的分支。若有其他任务的未提交修改，先妥善保存；不要用强制重置或删除文件清空工作区。

## 2. 本地修改和验证

游戏使用原生 HTML、CSS 和 JavaScript，无前端依赖安装或构建步骤。准备 Python 3 和支持项目所用 API 的 Node.js；建议使用与 GitHub Actions 一致的 Node.js 24。

从仓库根目录启动游戏：

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

浏览器打开 <http://127.0.0.1:8000/>，按 `Ctrl+C` 停止服务。邀请码入口与存档行为见 [README](README.md)。

游戏代码、剧情数据或素材变更，提交前运行：

```sh
node --test
```

涉及界面时，在桌面与窄屏实际操作受影响功能，检查对白、调查热点、线索、前后步进和存档恢复，并在 PR 提供截图或短录像。剧情变更还要验证相关路线的角色行踪、证词、线索获取顺序和结局是否一致。

纯文档变更检查差异、链接和图示即可；未运行游戏测试时在 PR 如实说明。不要声称未执行的检查已通过。

本地统计看板的运行、依赖和配置见 [analytics/README.md](analytics/README.md)。不要将数据库密码、访问令牌、`.env` 或玩家原始数据加入 PR。

## 游戏文本必须同步中英文

标题页支持中文与 English。新增或修改对话、旁白、线索、按钮、场景、人物档案、提示和辅助功能标签时，必须在同一改动中更新 `src/locales/en.mjs`，并通过统一的 `t()` 或已有翻译助手显示。完整流程和固定英文人名见[中英文支持说明](docs/i18n.md)。

保持故事 ID、证据 ID、素材路径和存档标识不变，不要用显示用的英文名字替换角色逻辑。提交前运行 `node --test`，并实际检查受影响场景的两种语言；不得通过削弱检查绕过缺失翻译。

## 3. 提交并同步主分支

只暂存本次任务的文件。以下以文档修改为例：

```sh
git status
git diff
git add CONTRIBUTING.md
git diff --cached
git commit -m "docs: explain contribution workflow"
```

提交标题采用 `type: description`，例如 `feat: add party choices`、`fix: restore clue history` 或 `docs: explain plot branches`。

**创建 PR 或向已有 PR 推送更新前**，同步最新 `main`：

```sh
git fetch origin
git rebase origin/main
git diff origin/main...HEAD
git push -u origin codex/short-topic
```

变基前保持工作区干净；同步或解决冲突后，重新执行受影响的检查。冲突解决后用 `git add` 标记，再运行 `git rebase --continue`；需要退出时使用 `git rebase --abort`。不要覆盖他人改动。

变基后的推送若被拒绝，只能在本人独占分支、确认不会覆盖他人提交并经维护者同意后使用 `--force-with-lease`。不要使用裸 `--force`，不要强推 `main`。

## 4. 创建 PR

打开[仓库](https://github.com/itseddiecurrent/band-mystery)，选择 **Pull requests → New pull request**：

- **base：`main`**。
- **compare：自己的工作分支**。

确认差异仅包含本次任务，填写英文标题和正文，并指定一名同事或维护者审核。正文可参考：

```markdown
## What changed
Describe the resulting behavior and affected area.

## Why
Explain the problem this change solves.

## How I tested it
- Commands actually run and their results
- Manual verification, if applicable
- Checks not run and the reason

## Screenshots
Attach evidence for UI changes, or write "Not applicable".

## Watch for
Describe remaining limitations, or write "None identified".
```

仅使用真实 issue 编号；不要将示例编号写成关联问题。

## 5. 审核、合并与删除分支

1. 在同一工作分支处理审核意见、验证并提交；推送前同步最新 `main`。
2. 审核后又有改动时，请 reviewer 检查最新版本。
3. **至少一名非作者的人类 reviewer 批准（Approve）**，审核问题已处理，所需本地检查与 PR 上已有自动检查通过后，才可合并。自我批准或 AI 审核不能代替同事批准。
4. 由有权限的维护者合并到 `main`；仓库允许时建议 **Squash and merge**。
5. **合并后删除该 PR 的来源分支。** 仓库管理员应在 **Settings → General → Pull Requests → Automatically delete head branches** 开启自动删除（API 字段 `delete_branch_on_merge: true`）。该设置负责删除已合并 PR 的远程来源分支，不会删除本地分支；本文档本身不会开启设置。
6. 合并后确认远程来源分支已删除。若自动删除受分支保护、其他打开的 PR 或权限等限制，由维护者确认没有未合并工作后手动删除；不要删除 `main` 或仍有人使用的分支。此前已经合并而遗留的分支也需单独清理。
7. 下一个任务从最新 `origin/main` 创建新分支，不恢复或复用已合并的分支。

本地清理前，先确认 PR 已合并且分支没有额外提交，再切换到其他分支：

```sh
git fetch origin --prune
git switch main
git pull --ff-only origin main
git branch -d codex/short-topic
```

以上操作应在工作区干净时进行。Squash 或 rebase 合并后，`git branch -d` 可能无法识别已合并状态；先核对 PR 与提交，不要直接改用强制删除。

这些是团队贡献约定。若需 GitHub 强制要求 PR、人类批准及新提交后重新审核，管理员应另行配置 `main` 的分支保护或 ruleset；本文档不表示这些保护已启用。

## 6. 剧情、素材与发布边界

- 正式剧情、台词和素材位置以 [场景.txt](场景.txt) 为准；交互与实现参考 [实现计划.md](实现计划.md)。`docs/` 中的分支树属于创作草案，不代表已实现或已批准的剧情。
- 文档 PR 不夹带游戏行为、分析看板或素材改动。游戏行为变更应明确描述，并验证相关路线。
- 不提交凭据，不用 `git add -f` 绕过忽略规则。新增素材应说明来源及用途，避免无关大文件。
- 本仓库已有 GitHub Pages 自动部署：合并到 `main` 后触发 `.github/workflows/deploy-pages.yml`，先运行测试，再发布游戏文件。不要套用其他项目“合并不部署”的约定。
- 当前部署产物不包含 `CONTRIBUTING.md` 或 `docs/`；仅修改贡献指南、剧情说明和图示不会改变游戏内容。普通文档 PR 不调整部署配置。
