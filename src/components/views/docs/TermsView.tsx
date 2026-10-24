// /terms/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { PageHeader } from '@/components/db'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const EN_META = {
  title: 'Terms of use',
  description: 'Terms governing use of the Panorama Open Scholarly Index at posi.panorama-sg.com.',
  alternates: { canonical: '/terms/' },
}

function En() {
  return (
    <div className="pb-12">
      <PageHeader title="Terms of use" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Legal' }, { label: 'Terms of use' }]}>
        <p className="max-w-[68ch]">
          These terms govern use of posi.panorama-sg.com (&ldquo;POSI&rdquo;), published by Panorama Scholarly Group
          Ltd., Hong Kong SAR (&ldquo;we&rdquo;). By using POSI you agree to them.
        </p>
      </PageHeader>

      <div className="doc">
        <section aria-labelledby="service">
          <h2 id="service">1. The service</h2>
          <p>
            POSI is a citation index and journal directory. Its content combines metadata from Crossref and
            OpenAlex with POSI’s own classification, evaluation and rankings, produced under the published{' '}
            <Link href="/methodology/">methodology</Link> and <Link href="/editorial-policy/">editorial policy</Link>.
          </p>
        </section>

        <section aria-labelledby="license">
          <h2 id="license">2. Data and software licences</h2>
          <p>
            POSI data is licensed under CC BY 4.0: you may reuse and redistribute it with attribution to POSI.
            Third-party metadata keeps its original licence. The POSI software is licensed under the MIT License.
            The POSI name and logo are not licensed for use that suggests endorsement.
          </p>
        </section>

        <section aria-labelledby="use">
          <h2 id="use">3. Use of rankings and certificates</h2>
          <p>
            The <Link href="/responsible-use/">responsible use</Link> guidance forms part of these terms. A
            certificate of indexing states that a publication appeared in a journal indexed by POSI on the date of
            issue; it may be checked by anyone at <Link href="/certificate/verify/">certificate verification</Link>.
            Altering a certificate, or presenting indexing as Core Collection certification when it is not, is not
            permitted.
          </p>
        </section>

        <section aria-labelledby="warranty">
          <h2 id="warranty">4. No warranty</h2>
          <p>
            POSI is provided &ldquo;as is&rdquo;. We work to keep records accurate and correct errors promptly, but we
            do not warrant that any record, score or ranking is complete, current or free of error. Registry data is
            shown as the registry provides it.
          </p>
        </section>

        <section aria-labelledby="liability">
          <h2 id="liability">5. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, Panorama Scholarly Group Ltd. is not liable for any loss arising
            from reliance on POSI data, rankings or certificates.
          </p>
        </section>

        <section aria-labelledby="links">
          <h2 id="links">6. External sites</h2>
          <p>
            POSI links to journal websites, DOI resolvers and other services. We are not responsible for their
            content or availability.
          </p>
        </section>

        <section aria-labelledby="law">
          <h2 id="law">7. Governing law and changes</h2>
          <p>
            These terms are governed by the laws of Hong Kong SAR. Changes are published on this page. Questions
            can be sent to <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>.
          </p>
        </section>
      </div>
    </div>
  )
}

export function termsMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/terms/', locale) }
}

export function TermsView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: '使用条款',
  description: '使用 posi.panorama-sg.com 上的 Panorama Open Scholarly Index 所适用的条款。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

function Zh() {
  return (
    <div className="pb-12">
      <PageHeader locale="zh-Hans" title="使用条款" crumbs={[{ label: 'POSI', href: L('/') }, { label: '法律信息' }, { label: '使用条款' }]}>
        <p className="max-w-[68ch]">
          本条款适用于对 posi.panorama-sg.com（“POSI”）的使用，该网站由香港特别行政区的 Panorama Scholarly Group Ltd.（“我们”）出版。使用 POSI 即表示您同意本条款。
        </p>
      </PageHeader>

      <div className="doc">
        <p className="panel p-4 text-[13.5px]" style={{ color: 'var(--ink-2)' }}>
          本译文仅供参考。中文译文与<Link href="/terms/">英文版本</Link>如有任何不一致，以英文版本为准。
        </p>

        <section aria-labelledby="service">
          <h2 id="service">1. 服务</h2>
          <p>
            POSI 是引文索引与期刊目录。其内容将来自 Crossref 与 OpenAlex 的元数据，与 POSI 依据已公布的<Link href={L('/methodology/')}>评价方法</Link>及<Link href={L('/editorial-policy/')}>编辑政策</Link>生成的分类、评估与排名相结合。
          </p>
        </section>

        <section aria-labelledby="license">
          <h2 id="license">2. 数据与软件许可</h2>
          <p>
            POSI 数据以 CC BY 4.0 许可发布：您可以在注明 POSI 的前提下再利用和再分发。第三方元数据保留其原始许可。POSI 软件以 MIT 许可证发布。POSI 名称与标志不得以暗示获得认可的方式使用。
          </p>
        </section>

        <section aria-labelledby="use">
          <h2 id="use">3. 排名与证书的使用</h2>
          <p>
            <Link href={L('/responsible-use/')}>负责任使用</Link>指南构成本条款的一部分。收录证书证明某文献在出具之日发表于 POSI 收录的期刊；任何人都可以通过<Link href={L('/certificate/verify/')}>证书验证</Link>进行核查。不得篡改证书，也不得将收录冒充为核心合集认证。
          </p>
        </section>

        <section aria-labelledby="warranty">
          <h2 id="warranty">4. 不作保证</h2>
          <p>
            POSI 按“现状”提供。我们致力于保持记录准确并及时更正错误，但不保证任何记录、得分或排名完整、最新或没有错误。注册机构数据按注册机构所提供的原样显示。
          </p>
        </section>

        <section aria-labelledby="liability">
          <h2 id="liability">5. 责任限制</h2>
          <p>
            在法律允许的最大范围内，Panorama Scholarly Group Ltd. 对因依赖 POSI 数据、排名或证书而产生的任何损失概不负责。
          </p>
        </section>

        <section aria-labelledby="links">
          <h2 id="links">6. 外部网站</h2>
          <p>
            POSI 链接至期刊网站、DOI 解析服务及其他服务。我们对其内容或可用性不承担责任。
          </p>
        </section>

        <section aria-labelledby="law">
          <h2 id="law">7. 适用法律与条款变更</h2>
          <p>
            本条款受香港特别行政区法律管辖。条款变更将在本页公布。如有疑问，请发送邮件至 <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>。
          </p>
        </section>
      </div>
    </div>
  )
}
