// /coi/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { PSG_JOURNALS, getCoreCollection } from '@/lib/data'
import { PageHeader } from '@/components/db'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const EN_META = {
  title: 'Conflict of interest',
  description: 'Panorama Scholarly Group publishes POSI and also publishes journals. This disclosure lists those journals and the safeguards that apply.',
  alternates: { canonical: '/coi/' },
}

function En() {
  const psg = PSG_JOURNALS.slice().sort((a, b) => a.title.localeCompare(b.title))
  const core = getCoreCollection().length

  return (
    <div className="pb-12">
      <PageHeader title="Conflict of interest" crumbs={[{ label: 'POSI', href: '/' }, { label: 'About', href: '/about/' }, { label: 'Conflict of interest' }]}>
        <p className="max-w-[68ch]">
          Panorama Scholarly Group Ltd. publishes POSI and also publishes academic journals. {psg.length} of
          the {core} Core Collection journals are published by Panorama Scholarly Group.
        </p>
      </PageHeader>

      <div className="doc">
        <section aria-labelledby="safeguards">
          <h2 id="safeguards">Safeguards</h2>
          <ul>
            <li>Journals published by Panorama Scholarly Group are evaluated under the same PQF criteria as every other journal, with no adjusted weighting.</li>
            <li>Ranks, percentiles and quartiles are produced by versioned calculation code from registry data. No one can change a published result by hand.</li>
            <li>Every evaluation rests on public evidence that anyone can check against the journal’s website and its Crossref and OpenAlex records.</li>
            <li>This relationship is disclosed on the about page and here, and the affected journals are listed below.</li>
          </ul>
          <p>
            Readers should take this relationship into account when interpreting results for these journals, and
            should not rely on POSI results alone when choosing where to publish.
          </p>
        </section>

        <section aria-labelledby="journals">
          <h2 id="journals">Journals published by Panorama Scholarly Group</h2>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>Journal</th><th>ISSN</th></tr></thead>
              <tbody>
                {psg.map(j => (
                  <tr key={j.id}>
                    <td><Link href={`/journal/${j.journal_code}/`} className="hover:underline" style={{ color: 'var(--teal)' }}>{j.title}</Link></td>
                    <td className="font-mono text-[12.5px] whitespace-nowrap">{j.issn_online ?? j.issn_print ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="concerns">
          <h2 id="concerns">Raising a concern</h2>
          <p>
            Concerns about the evaluation of any journal can be sent to{' '}
            <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>. They are handled under the appeals
            process in the <Link href="/editorial-policy/#appeals">editorial policy</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}

export function coiMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/coi/', locale) }
}

export function CoiView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: '利益冲突声明',
  description: 'Panorama Scholarly Group 既出版 POSI，也出版学术期刊。本声明列出这些期刊及所适用的保障措施。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

function Zh() {
  const psg = PSG_JOURNALS.slice().sort((a, b) => a.title.localeCompare(b.title))
  const core = getCoreCollection().length

  return (
    <div className="pb-12">
      <PageHeader locale="zh-Hans" title="利益冲突声明" crumbs={[{ label: 'POSI', href: L('/') }, { label: '关于', href: L('/about/') }, { label: '利益冲突声明' }]}>
        <p className="max-w-[68ch]">
          Panorama Scholarly Group Ltd. 既出版 POSI，也出版学术期刊。在 {core} 本核心合集期刊中，有 {psg.length} 本由 Panorama Scholarly Group 出版。
        </p>
      </PageHeader>

      <div className="doc">
        <section aria-labelledby="safeguards">
          <h2 id="safeguards">保障措施</h2>
          <ul>
            <li>Panorama Scholarly Group 出版的期刊与其他所有期刊一样，按相同的 PQF 标准评估，不作任何权重调整。</li>
            <li>排名、百分位与分区均由带版本号的计算代码依据登记机构数据生成，任何人都无法手工更改已发布的结果。</li>
            <li>每项评估都基于公开证据，任何人都可以对照期刊网站及其 Crossref 与 OpenAlex 记录进行核查。</li>
            <li>此关系已在“关于”页面及本页披露，相关期刊列于下表。</li>
          </ul>
          <p>
            读者在解读这些期刊的结果时应考虑这一关系，选择投稿期刊时也不应仅依赖 POSI 的结果。
          </p>
        </section>

        <section aria-labelledby="journals">
          <h2 id="journals">Panorama Scholarly Group 出版的期刊</h2>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>期刊</th><th>ISSN</th></tr></thead>
              <tbody>
                {psg.map(j => (
                  <tr key={j.id}>
                    <td><Link href={L(`/journal/${j.journal_code}/`)} className="hover:underline" style={{ color: 'var(--teal)' }}>{j.title}</Link></td>
                    <td className="font-mono text-[12.5px] whitespace-nowrap">{j.issn_online ?? j.issn_print ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="concerns">
          <h2 id="concerns">提出疑虑</h2>
          <p>
            对任何期刊评估的疑虑，可发送至 <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>，并按
            <Link href={L('/editorial-policy/#appeals')}>编辑政策</Link>中的申诉程序处理。
          </p>
        </section>
      </div>
    </div>
  )
}
