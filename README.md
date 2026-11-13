# Grok Bot 游戏迁移 · h5game

完整迁移自 [`waynexie/toilet-repair-g1`](https://github.com/waynexie/toilet-repair-g1/tree/9091729e63c8b01b064fe83cad109e79b15dd14c) 的 `main`（`9091729e63c8b01b064fe83cad109e79b15dd14c`）。250 个源文件逐字节保留，包括代码、数据、图片、设计稿、原 QA 脚本和录屏。没有重新设计玩法、美术或剧情。

在线预览入口：**https://waynexie.github.io/h5game/**（GitHub Pages，发布来源 `gh-pages` 根目录，内容从已合并的 `main` 导出）。手机竖屏触摸、桌面鼠标均可操作。

## 本地运行

```bash
python3 -m http.server 8787
```

打开 http://localhost:8787/ 。这是原生 JavaScript + Canvas 2D 静态项目，没有 npm 依赖或构建步骤；需要 HTTP 服务读取 JSON，不能直接双击 `index.html`。音效由 Web Audio 实时合成，代码已原样迁移。`.nojekyll` 保证 Pages 直接发布静态资源；所有游戏资源使用相对路径。

## 迁移验证与回退

```bash
python3 migration/verify-copy.py
for f in src/*.js; do node --check "$f" || exit 1; done
```

[迁移报告](migration/REPORT.md) / [源文件 SHA-256 清单](migration/source-manifest.json) / [浏览器证据](migration/evidence/)。新增内容仅本 README 和 `migration/` 下的审计、测试文件，不被游戏入口加载。

旧 `main` 仅有 README，旧 Demo 实际位于 `gh-pages`；两个版本都已备份到远端：

- [`backup/pre-grok-main-20261113`](https://github.com/waynexie/h5game/tree/backup/pre-grok-main-20261113)：`1e064929dc5f203c00a1748b87be70fc3f55ebac`
- [`backup/pre-grok-preview-20261113`](https://github.com/waynexie/h5game/tree/backup/pre-grok-preview-20261113)：`7f05a1d9474e8592216a20e535048ba7c123b05e`，旧试玩游戏完整版本

需要回退旧试玩时，从 `backup/pre-grok-preview-20261113` 导出完整文件树，作为新的部署提交发布到 `gh-pages`；无需改动只读源仓库。
