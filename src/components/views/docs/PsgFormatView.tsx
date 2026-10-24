// /psg-format/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import type { Metadata } from 'next'
import { PageHeader, OnThisPage } from '@/components/db'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const EN_META: Metadata = {
  title: 'PSG Author-Date Citation Format',
  description:
    'PSG Author-Date Citation Format - the official citation standard of Panorama Scholarly Group. Covers in-text citations, reference list rules, and examples for journals, books, datasets, software, AI tools, and multilingual sources.',
  alternates: { canonical: '/psg-format/' },
}

const CONTENTS: [string, string][] = [
  ['in-text', 'In-text citations'],
  ['reference-list', 'Reference list formats'],
  ['rules', 'Fixed rules'],
  ['batch', 'Batch conversion'],
  ['definition', 'Official definition'],
]

function Example({ children, intext }: { children: React.ReactNode; intext?: string }) {
  return (
    <>
      <div className="formula" style={{ fontSize: 13, lineHeight: 1.6, overflowWrap: 'anywhere', marginTop: '0.75rem' }}>{children}</div>
      {intext && <p className="text-[13px]">In-text: <code>{intext}</code></p>}
    </>
  )
}

function Table({ head, rows }: { head: [string, string]; rows: [string, string][] }) {
  return (
    <div className="panel overflow-x-auto">
      <table className="dtable">
        <thead><tr><th>{head[0]}</th><th>{head[1]}</th></tr></thead>
        <tbody>
          {rows.map(([a, b]) => (
            <tr key={a}><td className="font-medium" style={{ width: '34%', minWidth: 120 }}>{a}</td><td>{b}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function En() {
  return (
    <div className="pb-12">
      <PageHeader
        title="PSG Author-Date Citation Format"
        crumbs={[{ label: 'POSI', href: '/' }, { label: 'Docs', href: '/docs/' }, { label: 'PSG Format' }]}
      >
        <p>
          PSG Format is the author-date citation format of Panorama Scholarly Group. It follows a Chicago-style
          author-date structure with APA-informed practice for digital metadata, and adds rules for DOI
          normalisation, multilingual references, datasets, software, AI tools and reference integrity.
        </p>
      </PageHeader>

      <OnThisPage items={CONTENTS} />

      <div className="doc">
        <div className="panel" style={{ padding: '0.75rem 1rem', marginBottom: '2.75rem' }}>
          <div className="eyebrow">Core pattern</div>
          <p style={{ marginTop: 4, overflowWrap: 'anywhere' }} className="font-mono text-[13px]">
            Author. Year. &ldquo;Article Title.&rdquo; <em>Journal Name</em> Volume, no. Issue: Pages. https://doi.org/…
          </p>
        </div>

        <section aria-labelledby="in-text">
          <h2 id="in-text">1. In-text citations</h2>
          <p>PSG in-text citations use the author-year form in parentheses. Surnames only; no comma between author and year.</p>
          <Table
            head={['Type', 'PSG Format']}
            rows={[
              ['1 author', '(Smith 2024)'],
              ['2 authors', '(Smith and Lee 2024)'],
              ['3 authors', '(Smith, Lee, and Wang 2024)'],
              ['4 or more authors', '(Smith et al. 2024)'],
              ['With page number', '(Smith 2024, 25)'],
              ['Page range', '(Smith 2024, 25–27)'],
              ['Multiple sources', '(Chen 2021; Kim 2022; Smith 2024)'],
              ['No date', '(Smith n.d.)'],
              ['Same author, same year', '(Smith 2024a, 2024b)'],
            ]}
          />
        </section>

        <section aria-labelledby="reference-list">
          <h2 id="reference-list">2. Reference list formats</h2>

          <h3>Journal article</h3>
          <p style={{ overflowWrap: 'anywhere' }}><code>Last, First, and First Last. Year. &ldquo;Title.&rdquo; Journal Vol, no. Issue: Pages. https://doi.org/…</code></p>
          <Example intext="(Smith, Lee, and Wang 2024)">
            Smith, John A., Helen K. Lee, and Ming Wang. 2024. &ldquo;Artificial Intelligence and Administrative
            Reform in Local Government.&rdquo; <em>Journal of Public Governance and Society</em> 12, no. 2: 45–63.
            https://doi.org/10.xxxx/xxxxx
          </Example>

          <h3>Article number (no page range)</h3>
          <Example intext="(Chen and Park 2023)">
            Chen, Li, and Sungho Park. 2023. &ldquo;Digital Learning Anxiety among University Students.&rdquo;{' '}
            <em>Educational Psychology Review</em> 35, no. 2: Article 108. https://doi.org/10.xxxx/xxxxx
          </Example>

          <h3>Book</h3>
          <p style={{ overflowWrap: 'anywhere' }}><code>Last, First. Year. Book Title: Subtitle. Place: Publisher.</code></p>
          <Example intext="(Giddens 1991)">
            Giddens, Anthony. 1991. <em>Modernity and Self-Identity: Self and Society in the Late Modern Age.</em>{' '}
            Stanford: Stanford University Press.
          </Example>

          <h3>Book chapter</h3>
          <Example intext="(Lee 2022, 60)">
            Lee, Hyun K. 2022. &ldquo;Artificial Intelligence in Public Administration.&rdquo; In <em>Digital
            Governance in Asia</em>, edited by John Smith and Robert Brown, 55–78. Singapore: Springer.
            https://doi.org/10.xxxx/xxxxx
          </Example>

          <h3>Webpage</h3>
          <Example intext="(Panorama Scholarly Group 2026)">
            Panorama Scholarly Group. 2026. &ldquo;Publication Ethics.&rdquo; Accessed June 24, 2026.
            https://example.com/publication-ethics
          </Example>

          <h3>Government or institutional report</h3>
          <Example intext="(Ministry of Education 2024)">
            Ministry of Education. 2024. <em>Annual Report on Higher Education Development.</em> Seoul:
            Ministry of Education. https://example.gov/report
          </Example>

          <h3>Chinese-language source</h3>
          <p>Original-language title + English translation in square brackets. Author names romanized (Pinyin).</p>
          <Example intext="(Wang and Li 2023)">
            Wang, Ming, and Hua Li. 2023. &ldquo;数字治理背景下的公共服务改革 [Public Service Reform in the
            Context of Digital Governance].&rdquo; <em>公共行政研究 [Public Administration Research]</em> 15,
            no. 2: 45–58. https://doi.org/10.xxxx/xxxxx
          </Example>

          <h3>Korean-language source</h3>
          <Example intext="(Kim 2024)">
            Kim, Minsoo. 2024. &ldquo;공공기관의 디지털 전환과 조직성과 [Digital Transformation and
            Organizational Performance in Public Institutions].&rdquo; <em>한국행정학보 [Korean Public
            Administration Review]</em> 58, no. 1: 101–125. https://doi.org/10.xxxx/xxxxx
          </Example>

          <h3>Dataset</h3>
          <Example intext="(Lee 2024)">
            Lee, Sungho. 2024. <em>Survey Data on Digital Public Service Satisfaction in South Korea.</em>{' '}
            Data set. Zenodo. https://doi.org/10.xxxx/xxxxx
          </Example>

          <h3>Software / GitHub repository</h3>
          <Example intext="(Chen 2024)">
            Chen, Li. 2024. <em>OJS Reference Checker.</em> Source code. GitHub.
            https://github.com/example/ojs-reference-checker
          </Example>

          <h3>AI tool</h3>
          <Example intext="(OpenAI 2026)">
            OpenAI. 2026. <em>ChatGPT.</em> Large language model. https://chat.openai.com/
          </Example>
        </section>

        <section aria-labelledby="rules">
          <h2 id="rules">3. Fixed rules</h2>
          <Table
            head={['Element', 'PSG rule']}
            rows={[
              ['In-text style', 'Author-year parenthetical; no comma between author and year'],
              ['Year position', 'After author in reference list; no brackets'],
              ['Same author, same year', 'Add a, b, c to the year in both the reference list and the in-text citation (2024a, 2024b), ordered by title'],
              ['No date', 'Write n.d. in place of the year'],
              ['Article title', 'Curly (typographic) quotes “ ”; period inside the closing quote'],
              ['Book, report, dataset, software titles', 'Italic, no quotes; sentence ends with a period'],
              ['Journal name', 'Italic; in plain-text copies it is left unmarked'],
              ['Volume & issue', '12, no. 2'],
              ['Page range', '45–63 (en dash, not hyphen)'],
              ['Article number', 'Article 108 (in place of a page range)'],
              ['DOI format', 'Must be https://doi.org/…'],
              ['After DOI or URL', 'No trailing period'],
              ['Multilingual title', 'Original title + [English translation] in square brackets'],
              ['Author connector', 'and (not &)'],
              ['4+ authors in-text', 'First surname + et al. (no comma before et al.)'],
              ['Author format (1st)', 'Last, First (inverted)'],
              ['Author format (others)', 'First Last (natural order)'],
            ]}
          />
        </section>

        <section aria-labelledby="batch">
          <h2 id="batch">4. Batch conversion</h2>
          <p>
            The <Link href="/cite/">citation generator</Link> converts 100 or more references to PSG in one run (up to
            1,000). Paste DOIs one per line, paste a reference list in APA, AMA, MLA, Chicago, IEEE, Harvard or GB/T
            style, or open a BibTeX, RIS or CSL JSON export. DOIs are looked up in Crossref in bulk, with OpenAlex as a
            fallback; references without a DOI are matched by title, and any match not confirmed by its DOI is flagged for
            checking. Works by the same authors in the same year within one run get the a, b, c year suffixes, ordered by title, in both the reference and its in-text citation. Output can be sorted alphabetically, copied, or downloaded.
          </p>
        </section>

        <section aria-labelledby="definition">
          <h2 id="definition">5. Official definition</h2>
          <div className="panel" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--teal)' }}>
            <p>
              <strong>PSG Format</strong> is the official author-date citation format of Panorama Scholarly
              Group. It uses a Chicago-style author-date structure, APA-informed digital metadata practices,
              and PSG-specific rules for DOI normalization, multilingual references, datasets, software, AI
              tools, and reference integrity.
            </p>
          </div>
        </section>

        <p className="text-[13px]" style={{ marginTop: '2.5rem' }}>
          <Link href="/cite/">Citation generator</Link> · <Link href="/editorial-policy/">Publication policies</Link> · <Link href="/about/">About POSI</Link>
        </p>
      </div>
    </div>
  )
}

export function psgFormatMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/psg-format/', locale) }
}

export function PsgFormatView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: 'PSG 著者–出版年引文格式',
  description: 'PSG 著者–出版年引文格式：Panorama Scholarly Group 的官方引文标准，涵盖文内引用、参考文献列表规则，以及期刊、图书、数据集、软件、AI 工具与多语种文献的示例。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

const CONTENTS_ZH: [string, string][] = [
  ['in-text', '文内引用'],
  ['reference-list', '参考文献列表格式'],
  ['rules', '固定规则'],
  ['batch', '批量转换'],
  ['definition', '官方定义'],
]

// The examples are references as they are written, in English; only the explanations are translated.
function ExampleZh({ children, intext }: { children: React.ReactNode; intext?: string }) {
  return (
    <>
      <div className="formula" style={{ fontSize: 13, lineHeight: 1.6, overflowWrap: 'anywhere', marginTop: '0.75rem' }}>{children}</div>
      {intext && <p className="text-[13px]">文内引用：<code>{intext}</code></p>}
    </>
  )
}

function Zh() {
  return (
    <div className="pb-12">
      <PageHeader
        locale="zh-Hans"
        title="PSG 著者–出版年引文格式"
        crumbs={[{ label: 'POSI', href: L('/') }, { label: '文档', href: L('/docs/') }, { label: 'PSG 格式' }]}
      >
        <p>
          PSG 格式是 Panorama Scholarly Group 的著者–出版年引文格式。它采用芝加哥格式的著者–出版年结构，在数字元数据方面参照 APA 的做法，并增加了关于 DOI 规范化、多语种参考文献、数据集、软件、AI 工具与参考文献完整性的规则。
        </p>
      </PageHeader>

      <OnThisPage items={CONTENTS_ZH} locale="zh-Hans" />

      <div className="doc">
        <div className="panel" style={{ padding: '0.75rem 1rem', marginBottom: '2.75rem' }}>
          <div className="eyebrow">基本格式</div>
          <p style={{ marginTop: 4, overflowWrap: 'anywhere' }} className="font-mono text-[13px]">
            Author. Year. &ldquo;Article Title.&rdquo; <em>Journal Name</em> Volume, no. Issue: Pages. https://doi.org/…
          </p>
        </div>

        <section aria-labelledby="in-text">
          <h2 id="in-text">1. 文内引用</h2>
          <p>PSG 文内引用采用括号内“著者 出版年”的形式。只写姓氏；著者与年份之间不加逗号。</p>
          <Table
            head={['类型', 'PSG 格式']}
            rows={[
              ['1 位著者', '(Smith 2024)'],
              ['2 位著者', '(Smith and Lee 2024)'],
              ['3 位著者', '(Smith, Lee, and Wang 2024)'],
              ['4 位及以上著者', '(Smith et al. 2024)'],
              ['注明页码', '(Smith 2024, 25)'],
              ['页码范围', '(Smith 2024, 25–27)'],
              ['多个来源', '(Chen 2021; Kim 2022; Smith 2024)'],
              ['无日期', '(Smith n.d.)'],
              ['同一著者同一年份', '(Smith 2024a, 2024b)'],
            ]}
          />
        </section>

        <section aria-labelledby="reference-list">
          <h2 id="reference-list">2. 参考文献列表格式</h2>

          <h3>期刊文章</h3>
          <p style={{ overflowWrap: 'anywhere' }}><code>Last, First, and First Last. Year. &ldquo;Title.&rdquo; Journal Vol, no. Issue: Pages. https://doi.org/…</code></p>
          <ExampleZh intext="(Smith, Lee, and Wang 2024)">
            Smith, John A., Helen K. Lee, and Ming Wang. 2024. &ldquo;Artificial Intelligence and Administrative
            Reform in Local Government.&rdquo; <em>Journal of Public Governance and Society</em> 12, no. 2: 45–63.
            https://doi.org/10.xxxx/xxxxx
          </ExampleZh>

          <h3>文章编号（无页码范围）</h3>
          <ExampleZh intext="(Chen and Park 2023)">
            Chen, Li, and Sungho Park. 2023. &ldquo;Digital Learning Anxiety among University Students.&rdquo;{' '}
            <em>Educational Psychology Review</em> 35, no. 2: Article 108. https://doi.org/10.xxxx/xxxxx
          </ExampleZh>

          <h3>图书</h3>
          <p style={{ overflowWrap: 'anywhere' }}><code>Last, First. Year. Book Title: Subtitle. Place: Publisher.</code></p>
          <ExampleZh intext="(Giddens 1991)">
            Giddens, Anthony. 1991. <em>Modernity and Self-Identity: Self and Society in the Late Modern Age.</em>{' '}
            Stanford: Stanford University Press.
          </ExampleZh>

          <h3>图书章节</h3>
          <ExampleZh intext="(Lee 2022, 60)">
            Lee, Hyun K. 2022. &ldquo;Artificial Intelligence in Public Administration.&rdquo; In <em>Digital
            Governance in Asia</em>, edited by John Smith and Robert Brown, 55–78. Singapore: Springer.
            https://doi.org/10.xxxx/xxxxx
          </ExampleZh>

          <h3>网页</h3>
          <ExampleZh intext="(Panorama Scholarly Group 2026)">
            Panorama Scholarly Group. 2026. &ldquo;Publication Ethics.&rdquo; Accessed June 24, 2026.
            https://example.com/publication-ethics
          </ExampleZh>

          <h3>政府或机构报告</h3>
          <ExampleZh intext="(Ministry of Education 2024)">
            Ministry of Education. 2024. <em>Annual Report on Higher Education Development.</em> Seoul:
            Ministry of Education. https://example.gov/report
          </ExampleZh>

          <h3>中文文献</h3>
          <p>原文题名后附方括号内的英文译名。著者姓名使用罗马字母拼写（汉语拼音）。</p>
          <ExampleZh intext="(Wang and Li 2023)">
            Wang, Ming, and Hua Li. 2023. &ldquo;数字治理背景下的公共服务改革 [Public Service Reform in the
            Context of Digital Governance].&rdquo; <em>公共行政研究 [Public Administration Research]</em> 15,
            no. 2: 45–58. https://doi.org/10.xxxx/xxxxx
          </ExampleZh>

          <h3>韩文文献</h3>
          <ExampleZh intext="(Kim 2024)">
            Kim, Minsoo. 2024. &ldquo;공공기관의 디지털 전환과 조직성과 [Digital Transformation and
            Organizational Performance in Public Institutions].&rdquo; <em>한국행정학보 [Korean Public
            Administration Review]</em> 58, no. 1: 101–125. https://doi.org/10.xxxx/xxxxx
          </ExampleZh>

          <h3>数据集</h3>
          <ExampleZh intext="(Lee 2024)">
            Lee, Sungho. 2024. <em>Survey Data on Digital Public Service Satisfaction in South Korea.</em>{' '}
            Data set. Zenodo. https://doi.org/10.xxxx/xxxxx
          </ExampleZh>

          <h3>软件 / GitHub 代码库</h3>
          <ExampleZh intext="(Chen 2024)">
            Chen, Li. 2024. <em>OJS Reference Checker.</em> Source code. GitHub.
            https://github.com/example/ojs-reference-checker
          </ExampleZh>

          <h3>AI 工具</h3>
          <ExampleZh intext="(OpenAI 2026)">
            OpenAI. 2026. <em>ChatGPT.</em> Large language model. https://chat.openai.com/
          </ExampleZh>
        </section>

        <section aria-labelledby="rules">
          <h2 id="rules">3. 固定规则</h2>
          <Table
            head={['要素', 'PSG 规则']}
            rows={[
              ['文内引用样式', '括号内“著者 出版年”；著者与年份之间不加逗号'],
              ['年份位置', '在参考文献列表中紧随著者之后；不加括号'],
              ['同一著者同一年份', '在参考文献列表与文内引用中均在年份后加 a、b、c（2024a、2024b），按题名排序'],
              ['无日期', '以 n.d. 代替年份'],
              ['文章题名', '使用弯引号 “ ”；句点置于后引号之内'],
              ['图书、报告、数据集、软件题名', '斜体，不加引号；以句点结束'],
              ['期刊名', '斜体；纯文本副本中不加标记'],
              ['卷与期', '12, no. 2'],
              ['页码范围', '45–63（使用短破折号，而非连字符）'],
              ['文章编号', 'Article 108（代替页码范围）'],
              ['DOI 格式', '必须为 https://doi.org/…'],
              ['DOI 或 URL 之后', '不加句点'],
              ['多语种题名', '原文题名 + 方括号内的 [英文译名]'],
              ['著者连接词', '使用 and（不用 &）'],
              ['文内 4 位及以上著者', '第一著者姓氏 + et al.（et al. 前不加逗号）'],
              ['著者格式（第一位）', 'Last, First（姓在前）'],
              ['著者格式（其余）', 'First Last（自然顺序）'],
            ]}
          />
        </section>

        <section aria-labelledby="batch">
          <h2 id="batch">4. 批量转换</h2>
          <p>
            <Link href={L('/cite/')}>引文生成器</Link>可一次将 100 条以上（最多 1,000 条）参考文献转换为 PSG 格式。可以每行粘贴一个 DOI，粘贴 APA、AMA、MLA、Chicago、IEEE、Harvard 或 GB/T 格式的参考文献列表，或打开 BibTeX、RIS 或 CSL JSON 导出文件。DOI 会在 Crossref 中批量查询，以 OpenAlex 作为备用；没有 DOI 的参考文献按题名匹配，凡未经 DOI 确认的匹配结果都会标记为待核查。同一次转换中同一著者同一年份的作品，会在参考文献及其文内引用中按题名排序加上 a、b、c 年份后缀。结果可按字母排序、复制或下载。
          </p>
        </section>

        <section aria-labelledby="definition">
          <h2 id="definition">5. 官方定义</h2>
          <div className="panel" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--teal)' }}>
            <p>
              <strong>PSG 格式</strong>是 Panorama Scholarly Group 的官方著者–出版年引文格式。它采用芝加哥格式的著者–出版年结构、参照 APA 的数字元数据做法，以及 PSG 关于 DOI 规范化、多语种参考文献、数据集、软件、AI 工具与参考文献完整性的专门规则。
            </p>
          </div>
        </section>

        <p className="text-[13px]" style={{ marginTop: '2.5rem' }}>
          <Link href={L('/cite/')}>引文生成器</Link> · <Link href={L('/editorial-policy/')}>出版政策</Link> · <Link href={L('/about/')}>关于 POSI</Link>
        </p>
      </div>
    </div>
  )
}
