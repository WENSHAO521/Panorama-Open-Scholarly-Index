# 多语言阶段 1:路由与语言文件设计

状态:设计稿(2026-10-15),对应 `docs/DEVELOPMENT-CYCLE.md` C1 的 P1。目标与公告 *Plan: a multilingual POSI interface* 一致:界面文字移入语言文件,页面有带语言的地址(如 `/zh/journals/`),现有英文地址一个都不变,语言切换器只列英文。

## 1. 约束(来自 `node_modules/next/dist/docs/` 和本仓库)

- 本站是 `output: "export"` + `trailingSlash: true`。静态导出**不支持** Proxy、Rewrites、Redirects、Headers(`01-app/02-guides/static-exports.md`),所以官方 i18n 指南里"用 Proxy 按 Accept-Language 重定向到 `/en-US/...`"的做法用不了。
- 官方指南把所有路由放进 `app/[lang]`。照做会让英文变成 `/en/...`,违反"现有地址不变"。
- Cloudflare Pages 单次部署最多 20,000 个文件,`scripts/check-output-sizes.mjs` 的预算是 18,000。期刊页 `/journal/[code]/` 有 2.5 万多条,第 2 阶段不能无脑再生成一份中文版(见 §7)。

## 2. 路由方案:两个根布局,英文留在根路径

```
src/app/
  (en)/layout.tsx        <html lang="en">         现有全部路由移进来,地址不变
  (en)/journals/…  (en)/journal/[code]/…  (en)/(docs)/…
  zh/layout.tsx          <html lang="zh-Hans">    只放已翻译的页面
  zh/journals/page.tsx   → /zh/journals/
  global-not-found.tsx   全站唯一的 404
  sitemap.ts  opengraph-image.tsx  icon.*          留在 app/ 根
```

不用 `[lang]`,不用重定向,英文 URL 不动。路由组 `(en)` 不出现在地址里。

**已验证**:在 `next 16.3.6` 里用最小工程(`output: export`、`trailingSlash`、两个根布局、动态路由各带 `generateStaticParams`)构建通过,得到 `out/index.html`(`<html lang="en">`)、`out/journals/`、`out/zh/journals/`(`<html lang="zh-Hans">`)、`out/zh/journal/a/`。该工程已删除,没有进入仓库。

**已验证的两个细节**
- `sitemap.ts` 里的 `alternates.languages` 会输出 `<xhtml:link rel="alternate" hreflang=…>`,不需要另外写 hreflang。
- 多个根布局时,没有根布局可供 404 套用:只有 `app/not-found.tsx` 时,`out/404.html` 是没有语言、没有样式的裸 `<html>`。要用 `experimental.globalNotFound: true` 加 `app/global-not-found.tsx`,实测 `out/404.html` 正常。这个标志是实验性的,升级 Next 时要复查。Cloudflare 对任何未知地址都返回同一个 `404.html`,无法按语言区分,所以 404 只做英文(带一行中文提示可在第 2 阶段再定)。

## 3. 语言模型

`src/i18n/config.ts`

```ts
export const LOCALES = ['en', 'zh-Hans'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'
export const PREFIX: Record<Locale, string> = { en: '', 'zh-Hans': '/zh' }
export const localePath = (l: Locale, href: string) => `${PREFIX[l]}${href}`   // href 以 / 开头
export const stripLocale = (pathname: string) => …                            // /zh/journals/ → /journals/
```

每个根布局在构建时就知道自己的语言,不需要 `next/root-params`。

## 4. 语言文件

- 位置 `src/i18n/messages/en.ts`、`zh-Hans.ts`。用 TypeScript 对象而不是 JSON:`zh-Hans.ts` 声明为 `typeof en`,漏一个键 `npm run typecheck` 就失败。
- 按组件分命名空间:`header`、`footer`、`nav`、`docsNav`、`common`。每页只传自己需要的命名空间。
- 服务端组件:`getMessages(locale)`。客户端组件(`SiteHeader` 是 `'use client'`):根布局放一个 `LocaleProvider`,只传 `header`/`nav` 这类用到的命名空间,组件用 `useT()` 和 `useLocale()`。
- `site-nav.ts`、`docs-nav.ts` 保留结构和 `href`,给每个链接加稳定的 `id`,`label` 和 `description` 移进语言文件,按 `id` 取。
- 不翻译、也不进语言文件:POSI-J 编号、ISSN、期刊和出版社名、PQF/AJR/PNCI/PCS/C-Q1–C-Q4/POSI Zone 等术语,以及 PSG 引用格式(公告里已承诺)。

## 5. 链接、元数据、站点地图

- 内部链接统一走 `<LocalizedLink>`(包装 `next/link`,按当前语言加前缀)。目前 62 个文件直接 `import Link`,第 1 阶段只改头部、页脚、导航、语言切换器;其余页面保持 `Link`,英文下行为相同,到第 2 阶段翻译哪一页再改哪一页。
- `usePathname()` 判断导航高亮的地方先 `stripLocale`(`SiteHeader` 的 `match` 前缀)。
- 元数据:新增 `pageAlternates(path)`,只在该路径**存在**中文版时才输出 `alternates.languages`,并保持各页现有的 `canonical`。第 1 阶段没有中文页,所以不输出任何 hreflang,不会指向 404。`sitemap.ts` 同理,中文页进入路由表后再加。
- `openGraph.locale` 随语言变化(`en_US` / `zh_CN`)。

## 6. 语言切换器(第 1 阶段)

头部和页脚各一个。当前路径有哪些语言版本,就列哪些;第 1 阶段只有英文,所以显示"English"一项,不可切换(用 `aria-current`)。组件签名已按"可用语言列表"写好,第 2 阶段不需要改组件,只往注册表里加已翻译的路径。

## 7. 要做的 PR(每个单独合并,同时进行不超过 3 个)

1. **只搬文件**:全部现有路由移入 `(en)`,删掉 `app/layout.tsx` 换成 `(en)/layout.tsx`,加 `global-not-found`。不改任何内容。门槛:`out/` 的文件清单与改前逐项相同,抽样 20 个 HTML 除构建哈希外无差异。实测结果:`error.tsx` 进 `(en)`;`icon.*`、`sitemap.ts` 留在 `app/` 根,输出不变;`opengraph-image.tsx` 留在根(进 `(en)` 会被改名为 `/opengraph-image-35z9bs`),各页不再自动继承,改由 `site-metadata.ts` 的 `openGraph.images` / `twitter.images` 显式引用,地址 `/opengraph-image` 不变,只少了 `?哈希` 缓存参数。
2. **i18n 核心 + 头部、页脚、导航**:`src/i18n/*`、`en.ts`、`LocaleProvider`、`getMessages`,把 `SiteHeader`、`SiteFooter`、`site-nav.ts`、`docs-nav.ts` 的文字抽出。英文输出必须与改前相同。
3. **切换器 + `pageAlternates` + 测试**:`zh-Hans.ts` 键与 `en.ts` 一致的类型检查;`localePath`/`stripLocale` 的单元测试(`npm test` 已用 `node --test`)。

第 1 阶段**不发布** `zh/` 目录。中文路由和 `zh/layout.tsx` 在第 2 阶段(C2)随第一批译文一起加;第 1 阶段只在 PR 3 里用一个仅测试用的构建确认 `/zh/…` 能由语言文件生成,不进生产。

## 8. 完成标准与度量

- 每个页面都由语言文件构建出英文;`out/` 里没有任何现有地址消失或改变(PR 1、2 都要对比文件清单)。
- 构建时间增加不超过 10%。**基线还没测**:改动前在同一台机器上跑一次 `npm run build` 记录总时长和 `out/` 文件数(`find out -type f | wc -l`),写进 PR 1。
- `npm run typecheck`、`npm run lint`、`npm test` 通过。

## 9. 第 2 阶段要先决定的事(现在不做)

- **期刊页要不要有中文版**:`/journal/[code]/` 有 2.5 万多页,再生成一份会撞上 18,000 文件预算。备选:只翻译外壳和固定文字,数据仍用英文;或中文只覆盖 Core Collection 和有排名的期刊。第 2 阶段开始前要有数字再定。
- 中文 404 的做法(见 §2)。
- 翻译审校人和"每页标注所依据的英文版本日期"的字段放在哪(`DEVELOPMENT-CYCLE.md` 风险表要求)。

## 10. 未验证,实施时要查

- `globalNotFound` 在 `next build` 之外的 `next dev` 下的行为。
- 把 `(docs)/layout.tsx` 放进 `(en)` 之后,嵌套布局是否与新的根布局正常叠加(PoC 没有嵌套布局)。

## 11. 第 2 阶段进展

- **2026-10-23,首批**:`zh-Hans` 上线于 `/zh/`(`zh/layout.tsx`),首页 `/zh/` 已翻译;头部、页脚、导航、文档导航的全部文字有中文。
  - 尚未翻译的页面:中文界面里的链接直接指向英文原页(`localizedHref`,依据 `TRANSLATED_PATHS`),不会出现 404。
  - PSC 48 个学科大类与类别的中文名在 `src/i18n/psc-zh-Hans.ts`,国家和地区名沿用 `country-list.ts` 的 `zh` 字段。
  - 新闻标题仍为英文(标 `lang="en"`)。404 页仍只有英文。
  - 测试:各语言键与英文一致、占位符一致、每个 PSC 代码都有中文名。
- 下一批:期刊列表、排名表、文献检索、学科类别、出版商、核心合集。期刊详情页(2.5 万页)仍按 §9 待定。
- **2026-10-23,第二至五批**:`/zh/journals/`、`/zh/journals/open-access/`、`/zh/subjects/`、`/zh/publishers/`、`/zh/rankings/`、`/zh/core-collection/`、`/zh/publications/`、`/zh/certificate/`、`/zh/certificate/zone/`。
  - 做法:每页一个共用视图(`src/components/views/`),英文与中文路由都渲染它;页面专属文字放在该文件的 `Record<Locale, …>` 里,以英文为类型,漏键即 typecheck 失败。跨页共用的界面文字仍在 `messages/`。
  - **证书与验证页保持英文**(负责人 2026-10-23 确认):中文页只翻译申请表、核查结果和说明;证书 PDF、`/certificate/verify/`、`/certificate/zone/verify/` 不翻译。
  - **2026-10-24 更新**(负责人):验证页 `/zh/certificate/verify/`、`/zh/certificate/zone/verify/` 已翻译;证书 PDF 及其二维码地址仍为英文(扫码进入英文验证页,可用语言切换转到中文,查询参数保留)。
  - 排名的类别页与历年版本页、期刊详情页、文档类页面仍为英文。
- **2026-10-24,第六批**:`/zh/cite/`、`/zh/datasets/`、`/zh/certification/`、`/zh/logos/`、`/zh/about/`。
  - 引文生成器只翻译界面(表单、提示、格式说明、批量转换);生成的引文本身按各格式规范保持英文。
  - 认证申请表的界面为中文,生成的申请邮件保持英文(编辑部工作语言)。徽标图片、`alt` 文字与嵌入代码保持英文(出现在期刊自己的网站上)。
  - 文档类页面:每页一个视图(`src/components/views/docs/`),英文与中文各为一个组件,共用数据;中文路由组 `zh/(docs)/` 复用文档侧栏。
- **2026-10-24,第七批:期刊页**:`/zh/journal/?issn=`(期刊页)、`/zh/record/?code=`(记录查看器)、核心合集期刊的静态记录页 `/zh/journal/<code>/`。
  - 其余约 1,000 个有英文静态页的记录(Benchmark 等)不再生成中文静态副本(会超出部署文件数上限),中文界面链接到 `/zh/record/?code=`,由浏览器读取 `/data/journal/<code>.json` 动态生成中文页面(`localizedHref` 自动改写)。负责人 2026-10-24 同意改为动态。
  - 核心合集期刊代码由 `scripts/sync-corpus.mjs` 写入 `src/i18n/core-journal-codes.json`,测试确保与 `core-collection.json` 一致。
  - 评价面板与卡片、排名历史、逐年趋势图、其他索引核查、记录字段(`src/i18n/records-zh-Hans.ts`)均已翻译。语言切换在同一页面时保留查询参数。
- **2026-10-24,第八批:文档类页面**:`/zh/docs/` 及其下的数据、记录结构、证书、数据溯源页,评价方法、POSI 等级、PQF、引文指标、AJR(含 AJR-E、AJR-M)、编辑政策、负责任使用、利益冲突、PSG 引文格式、联系我们、使用条款、隐私政策。
  - 使用条款与隐私政策的中文页注明:中英文如有不一致,以英文版本为准(链接到英文页)。
  - PSG 引文格式的示例引文与联系邮件主题行保持英文;新闻动态仍为英文。
  - 所有剩余页面都不大(约 20 页、约 150 个文件),继续生成静态中文页;只有数量大的期刊记录页走动态(第七批)。
- **2026-10-24,第九批:排名类别页与历年版次页**:`/zh/rankings/<类别>/`、`/zh/rankings/all/`、`/zh/rankings/edition/<年>/` 及其类别页。
  - 排名整节翻译:`TRANSLATED_SECTIONS` 记录整节已翻译的路径前缀,中英文路由共用 `src/components/views/ranking-pages.ts` 中的参数与元数据,测试确保两边路由一一对应。
  - 新闻动态保持英文。至此,除新闻动态、证书 PDF 与验证页(按决定保持英文)外,所有页面都有中文版本。
