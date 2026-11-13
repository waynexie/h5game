# 迁移与部署报告 · 2026-11-13

## 来源与范围

- 源仓库只读：`waynexie/toilet-repair-g1`，当前 `main` 固定到 `9091729e63c8b01b064fe83cad109e79b15dd14c`。
- 目标：`waynexie/h5game`，迁移分支 `migration/grok-game-20261113`，通过 PR 合并；发布沿用现有 GitHub Pages `gh-pages:/`，从已通过 PR 合并的 `main` 导出文件树。
- 源项目没有 AGENTS.md、构建器、package.json、Git LFS 或 submodule。运行时是 5 个原生 JS 文件、Canvas 2D、JSON 和本地图片；音效是 Web Audio 合成。
- 用 `git archive` 导出固定提交的完整树，250 文件共 67,558,840 字节；源项目所有路径、文件内容、配置与历史 QA 资料原样保留，包括设计稿和源仓库已跟踪的辅助文件。
- 逐文件 SHA-256 校验一致。图片为 175 PNG + 18 JPG + 2 SVG（含设计及 QA 图）；2 份原有 MP4 也完整保留。
- 目标旧 `main` 只有 README；实际旧 Demo 在 `gh-pages`。已先推送两个备份分支，SHA 与远端核对一致。旧 `gh-pages` 文件树已由备份分支保存；部署时以新的提交替换发布内容，保留提交历史。
- 源仓库工作区无改动，克隆的 push URL 设为 `DISABLED_SOURCE_READ_ONLY`。未对源仓库提交、推送、建分支、开 PR 或改设置。

## 一致性与运行验证

| 检查 | 结果 |
|---|---|
| `python3 migration/verify-copy.py` | 250/250 源文件 SHA-256 一致，运行时 JSON 可解析，30 项美术 manifest 引用均存在 |
| `node --check src/*.js`（逐文件） | 5 个运行时 JS 语法通过 |
| 静态构建 | 原项目无需编译，直接发布源文件；没有新增运行依赖 |
| 子路径 | `/h5game/` 下加载入口、代码、JSON、图像正常，无硬编码源仓库地址 |
| 画面一致性 | 固定测试时钟/随机源后，390×780 和 1440×1000 的标题、维修现场、设置共 6 个画面，源和目标 canvas PNG 哈希完全一致 |
| 手机触摸 | Chromium 触摸模拟 320×640、390×844、430×932，正常点开工、经过场、接首单、冲水观察进入工作；画布在视口内 |
| 浏览器错误 | 上述运行检查无 JS 异常、无游戏资源 404 |
| 三天完整流程 | 迁移测试脚本通过全部断言：软堵/高水位/硬物、升级、追加门锁、转介绍及第三天收工；终态 `screen=end, day=3`，详见 [实际日志](evidence/playthrough.log) 和 [收工截图](evidence/three-days-complete.png) |

像素比对冻结动画仅用于测试，生产文件没有测试开关修改。源和目标都使用同一台浏览器，不能据此声称不同系统字体也逐像素相同。

原 `qa/playthrough.test.js` 已直接执行：第一天四单、升级、第二天两单及追加门锁均能结算。原脚本第三天仍用旧螺丝坐标 `(195,340)/(195,470)`，而当前代码 `lockGeom()` 已随原有门口图移动到 `(130,328)/(130,458)`，导致脚本停在门锁；这属于原 QA 脚本坐标过期。`migration/playthrough.cjs` 在内存中仅修正测试坐标、浏览器启动路径和输出目录，原 QA 与游戏文件保持不变，并添加结算/第三天收工断言。

原脚本会使用原有调试钩子关闭过场、触发老钱广告测试；它是功能回归，不是真人盲玩。测试 HTTP 日志仅出现浏览器自动请求 `/favicon.ico` 的两次 404，源仓库本来就没有该图标；不影响游戏，不据此改动源入口。

## 复现浏览器检查

需要外部安装 Playwright 和 Chromium，仅用于 QA，不是游戏运行依赖。用 `CHROMIUM_PATH` 指向本机 Chromium；通过 `NODE_PATH` 指向测试环境的 Playwright。

```bash
# 将只读源副本与目标分别通过静态 HTTP 提供；可用 SOURCE_URL/TARGET_URL 指定。
SOURCE_URL=http://localhost:8788/ TARGET_URL=http://localhost:8787/ node migration/smoke.cjs
TARGET_URL=http://localhost:8787/ node migration/playthrough.cjs
```

`smoke.cjs` 结果与截图写入 `migration/evidence/`（可用 `EVIDENCE_DIR` 改写输出位置）。完整流程脚本默认输出到 `/workspace/pw-migration`，可用 `EVIDENCE_DIR` 改写。GitHub Pages 上线后使用相同 smoke 流程再核对远端版本。

## 保留的边界

没有迁移其他站点浏览器里的 localStorage；浏览器存储按域名隔离。源项目原有设置、存档能力和限制原样保留。真机 iOS/Android 的系统声音、振动及不同浏览器性能未作物理设备验证；没有把桌面触摸模拟写成真机验收。

本轮没有接入此前 Codex 的 Gameplay v0.3 代码，也没有扩充或重做 Grok Bot 的玩法、美术、剧情。Pages 设置更新 API 返回 `403 Resource not accessible by integration`，因此使用已有 `gh-pages` 发布配置，正常提交已验证的 main 文件树；没有修改权限设置。旧 Demo 可从备份分支恢复。
