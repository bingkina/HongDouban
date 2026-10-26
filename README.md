# 红豆瓣

专注红果短剧的深色评分社区首页原型，适配桌面 Web 和手机 H5。

## 本地运行

需要 Node.js 22.18 或更新版本（测试使用 Node 原生 TypeScript 支持）。

```bash
npm install
npm run dev
```

打开终端打印的地址，默认是 http://127.0.0.1:3000 。

```bash
npm test
npm run typecheck
npm run build
npm start
```

`npm run build` 会生成静态站点到 `out/`；`npm start` 预览导出的静态文件，默认地址为 http://127.0.0.1:3000 。

## 当前功能

- 真实海报推荐、六列热播展示和红果真人剧热度榜。
- 剧名、内容类型、题材组合筛选，卡片快速预览与红果原始链接。
- 想看 / 已看、五星评分（2–10 分）、500 字短评；可修改、删除。
- 个人片单与短评存于当前浏览器，刷新后保留。预览关闭时保存草稿。
- 手机底部导航、底部预览面板、键盘焦点管理、减少动态效果支持。

## 内容与真实性

`src/data/catalog.v1.json` 是 2026-10-26 从红果公开分类页与分类热播榜取得的版本化快照，共 24 部作品：真人短剧 12、漫剧 6、AI 剧 6。`src/lib/catalog.ts` 的 `getCatalog()` 是数据读取边界。

每条记录包含原始作品 ID、分类出处、详情页、榜单来源、海报出处及采集时间。平台评分为空时显示暂无评分；它与浏览器中保存的个人评分分开。热播榜保留来源平台的榜位，不按本站个人评分排序。

海报是来源公开页面中对应作品的海报，保存为 WebP。`src/data/asset-manifest.json` 包含原始文件与本地转换文件的校验信息。仅用于本地原型展示；正式上线前应核查内容与图片的使用条件。

页面三条示例短评均明确标注“示例短评 · 非真实用户”，不冒充真实社区数据。用户输入只作为纯文本渲染，不上传、不执行 HTML。

本期不含视频播放、账号、公共评论后端、独立详情页及自动同步。快照不会随打开页面自动更新。

来源：

- https://hongguoduanju.com/category/real-drama
- https://hongguoduanju.com/category/comic-drama
- https://hongguoduanju.com/category/ai-drama
- https://hongguoduanju.com/rank/hot-real-drama
- https://hongguoduanju.com/rank/hot-comic-drama

## 设计

采用 ui-ux-pro-max 的暗色界面、触控、响应式、键盘和减少动态效果指导。最终设计约定记录于 `design-system/hongdouban/MASTER.md`，以用户批准的产品方案为准。

## 后续同步接入

后续同步程序应生成相同的目录快照结构，再通过 `getCatalog()` 提供；组件不直接访问外部平台。同步应以红果作品 ID 去重，保留出处与时间，禁止混入未经红果来源核验的作品。当前没有配置定时任务或外部采集 API。

## Cloudflare Pages 部署

项目已在 `next.config.ts` 配置 `output: "export"`，不需要 Node.js 常驻服务或 Next.js 服务端适配器。

在 Cloudflare Pages 导入 `bingkina/HongDouban` 仓库，使用以下配置：

| 配置 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 框架预设 | Next.js (Static HTML Export) |
| 构建命令 | `npm run build` |
| 输出目录 | `out` |
| Node.js | `22.18.0`（`.node-version`） |

部署包含页面、脚本、样式和 24 张本地海报。个人收藏、评分与短评仍保存在访问者的浏览器，不上传到 Cloudflare。更换访问域名后，原域名的浏览器记录不会自动迁移。

参考：[Cloudflare Next.js 静态部署文档](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/)。
