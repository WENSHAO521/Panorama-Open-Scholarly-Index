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

1. **只搬文件**:全部现有路由移入 `(en)`,删掉 `app/layout.tsx` 换成 `(en)/layout.tsx`,加 `global-not-found`。不改任何内容。门槛:`out/` 的文件清单与改前逐项相同,抽样 20 个 HTML 除构建哈希外无差异。需要同时确认 `error.tsx`、`opengraph-image.tsx`、`icon.*` 在多根布局下的位置(`error.tsx` 应进 `(en)`;其余在 PoC 里未测,要在这个 PR 里测)。
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
- `opengraph-image.tsx`、`icon.png`/`icon.svg` 放在 `app/` 根、没有根布局时是否仍生成。
- 把 `(docs)/layout.tsx` 放进 `(en)` 之后,嵌套布局是否与新的根布局正常叠加(PoC 没有嵌套布局)。
