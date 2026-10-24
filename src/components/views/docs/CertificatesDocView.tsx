// /docs/certificates/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { PageHeader } from '@/components/db'
import { MAX_DOIS } from '@/lib/certificate'
import { ZONES_VERSION } from '@/lib/zones'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const EN_META = {
  title: 'How certificates work',
  description: 'What a POSI certificate of indexing states, how its numbers are derived, and how it is verified without a server.',
  alternates: { canonical: '/docs/certificates/' },
}

function En() {
  return (
    <div className="pb-10 max-w-[820px]">
      <PageHeader title="How certificates work" crumbs={[{ label: 'Docs', href: '/docs/' }, { label: 'Certificates' }]}>
        <p>
          A certificate of indexing states that specific publications are indexed in the Panorama Open Scholarly Index,
          and whether each one appeared in a Core Collection journal. <Link href="/certificate/" className="link">Issue one here</Link>.
          It is free and immediate.
        </p>
      </PageHeader>

      <div className="prose-doc">
        <h2 style={{ marginTop: 0 }}>What POSI indexes</h2>
        <p>
          POSI indexes every journal with DOIs registered at Crossref or DataCite, or a source record in OpenAlex. Each
          DOI is checked at the agency that registered it, as named by doi.org. A publication is indexed when Crossref
          holds its DOI as a journal article under a journal ISSN; when DataCite, or Zenodo for a Zenodo DOI, holds it as
          a journal article that is part of a journal with an ISSN; or, failing those, when OpenAlex records it with a
          journal as its source. Books, chapters, datasets and preprints are not journal publications and are not
          certified, and neither is a journal article whose record names no journal ISSN.
        </p>
        <p>
          Google Scholar has no public API and does not allow automated queries, so it cannot be part of the check. The
          check results link each publication to a Google Scholar search, so you can confirm it is listed there by hand.
        </p>
        <p>
          Within the index, journals that applied for certification and passed the PQF editorial evaluation form the{' '}
          <Link href="/core-collection/">Core Collection</Link>. The certificate names each publication&apos;s journal
          status: <strong>Core Collection</strong> or <strong>Indexed</strong>.
        </p>

        <h2>What the certificate contains</h2>
        <ul>
          <li>A certificate number, the date of issue and the data snapshot the check ran against.</li>
          <li>The requester, affiliation and purpose, exactly as typed by the person issuing it. These are not verified.</li>
          <li>For each indexed publication: title, authors, journal, volume, issue, pages, year, DOI, ISSN, the registry it was indexed through, an accession number, the journal status and the registry citation count on the date of issue.</li>
          <li>A QR code and address for verification.</li>
        </ul>
        <p>Up to {MAX_DOIS} DOIs can be checked at once. DOIs that are not indexed are counted but not listed. Certificates are issued in English.</p>

        <h2>How the numbers are made</h2>
        <p>
          The <strong>certificate number</strong> (<code>PC-XXXX-XXXX-XXXX</code>) is the first 12 hexadecimal digits of
          SHA-256 over <code>POSI-CERT-2|date of issue|snapshot|DOIs</code>, with DOIs lower-cased and sorted. The{' '}
          <strong>accession number</strong> (<code>POSI-A-XXXXX-XXXXX</code>) is the first 10 hexadecimal digits of
          SHA-256 over the lower-cased DOI, so a publication keeps the same accession number whatever happens to its
          journal. Both are deterministic and can be recomputed by anyone; the code is in <code>src/lib/certificate.ts</code>.
        </p>

        <h2>How verification works</h2>
        <p>Verification does not depend on a register of issued certificates. It re-derives each certificate from its contents:</p>
        <ul>
          <li>The certificate number is recomputed from the date, snapshot and DOI list in the link. A mismatch means the certificate was altered.</li>
          <li>Every DOI is re-checked against Crossref, DataCite, Zenodo, OpenAlex and the current POSI index. Changes since issue, such as a journal leaving the Core Collection, are reported.</li>
        </ul>
        <p>
          Because the facts are checked again every time, a certificate claiming a publication is indexed when it is not
          fails verification, whoever produced it. Printed names and purposes are not part of the link and are not
          verified; relying parties should confirm identity separately.
        </p>

        <h2 id="zone-certificates">Zone certificates</h2>
        <p>
          A <Link href="/certificate/zone/">zone certificate</Link> (POSI 分区证书) states a journal&apos;s{' '}
          <Link href="/methodology/#zones">POSI Zone</Link> in the current Citation Ranking: the zone of its PNCI
          percentile within its PSC subject category (Zone 1: top 5%; Zone 2: top 5–20%; Zone 3: top 20–50%; Zone 4:
          lower 50%). It is available for every journal with an <strong>official</strong> zone (an official ranking in a
          category of at least 50 ranked journals), from the journal&apos;s profile page, and needs no application.
        </p>
        <ul>
          <li>The category, the zone, the citation rank, category size, percentile and Citation Quartile.</li>
          <li>The journal&apos;s title, publisher, ISSNs and POSI ID, its PNCI, and the ranking snapshot, data snapshot and zone rule (<code>{ZONES_VERSION}</code>) it was read from.</li>
        </ul>
        <p>
          The <strong>certificate number</strong> (<code>PZ-XXXX-XXXX-XXXX</code>) is the first 12 hexadecimal digits
          of SHA-256 over <code>POSI-ZONE-CERT-2|zone rule|date of issue|POSI ID|edition year|category|zone</code>.
          Verification recomputes it from the journal&apos;s current ranking record. Ranks are deliberately left out, so a
          certificate stays valid while its zone holds and stops verifying when the zone changes or the edition year
          moves on, with the next annual edition each December. The code is in <code>src/lib/zone-certificate.ts</code>.
        </p>
        <p>
          Certificates issued before 28 September 2026 stated zones of the retired PCS-based trial
          (<code>POSI-ZONES-1.0</code>, <code>POSI-ZONE-CERT-1</code>). That ranking has been withdrawn, so they no longer
          verify.
        </p>

        <h2>Appropriate use</h2>
        <p>
          A certificate records indexing status or ranking position. It is not an assessment of the quality of a publication or journal. See{' '}
          <Link href="/responsible-use/">responsible use</Link>.
        </p>
      </div>
    </div>
  )
}

export function certificatesDocMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/docs/certificates/', locale) }
}

export function CertificatesDocView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: '证书说明',
  description: 'POSI 收录证书载明的内容、编号的生成方式，以及无需服务器即可完成验证的方法。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

function Zh() {
  return (
    <div className="pb-10 max-w-[820px]">
      <PageHeader locale="zh-Hans" title="证书说明" crumbs={[{ label: '文档', href: L('/docs/') }, { label: '证书' }]}>
        <p>
          收录证书证明特定文献已被 Panorama Open Scholarly Index 收录，并注明每篇文献是否发表于核心合集期刊。<Link href={L('/certificate/')} className="link">在此出具证书</Link>，免费且即时生成。
        </p>
      </PageHeader>

      <div className="prose-doc">
        <h2 style={{ marginTop: 0 }}>POSI 收录哪些内容</h2>
        <p>
          POSI 收录所有在 Crossref 或 DataCite 注册了 DOI、或在 OpenAlex 中有来源记录的期刊。每个 DOI 都会在 doi.org 所指明的注册机构处核查。满足以下条件之一的文献即视为已收录：Crossref 将其 DOI 登记为某期刊 ISSN 下的期刊文章；DataCite（或对 Zenodo DOI 而言的 Zenodo）将其登记为属于某个有 ISSN 期刊的期刊文章；或在前述均不满足时，OpenAlex 记录其来源为某期刊。图书、章节、数据集与预印本不属于期刊文献，不予认证；记录中未注明期刊 ISSN 的期刊文章也不予认证。
        </p>
        <p>
          Google Scholar 没有公开 API，也不允许自动查询，因此无法纳入核查。核查结果会为每篇文献提供 Google Scholar 检索链接，您可以手动确认其是否被收录。
        </p>
        <p>
          在收录范围内，申请认证并通过 PQF 编辑评估的期刊构成<Link href={L('/core-collection/')}>核心合集</Link>。证书会注明每篇文献所载期刊的状态：<strong>Core Collection</strong>（核心合集）或 <strong>Indexed</strong>（收录）。
        </p>

        <h2>证书包含的内容</h2>
        <ul>
          <li>证书编号、出具日期，以及核查所依据的数据快照。</li>
          <li>申请人、所属机构与用途，完全按出具人输入的内容显示，未经核实。</li>
          <li>每篇已收录文献的题名、作者、期刊、卷、期、页码、年份、DOI、ISSN、收录所依据的注册机构、登记号、期刊状态，以及出具当日注册机构记录的被引次数。</li>
          <li>用于验证的二维码与网址。</li>
        </ul>
        <p>一次最多可核查 {MAX_DOIS} 个 DOI。未被收录的 DOI 只计数，不列出。证书以英文出具。</p>

        <h2>编号如何生成</h2>
        <p>
          <strong>证书编号</strong>（<code>PC-XXXX-XXXX-XXXX</code>）取 <code>POSI-CERT-2|出具日期|快照|DOI 列表</code> 的 SHA-256 值的前 12 位十六进制数字，其中 DOI 转为小写并排序。<strong>登记号</strong>（<code>POSI-A-XXXXX-XXXXX</code>）取小写 DOI 的 SHA-256 值的前 10 位十六进制数字，因此无论其期刊状态如何变化，文献的登记号保持不变。两者均为确定性计算，任何人都可以重新计算；代码见 <code>src/lib/certificate.ts</code>。
        </p>

        <h2>验证方式</h2>
        <p>验证不依赖已出具证书的登记册，而是依据证书内容重新推导：</p>
        <ul>
          <li>依据链接中的日期、快照与 DOI 列表重新计算证书编号。编号不一致即表示证书被篡改。</li>
          <li>每个 DOI 都会对照 Crossref、DataCite、Zenodo、OpenAlex 及当前 POSI 索引重新核查。出具后的变化（例如期刊退出核心合集）会一并报告。</li>
        </ul>
        <p>
          由于每次都会重新核查事实，凡是声称某文献已收录而实际未收录的证书，无论由谁制作，都无法通过验证。打印的姓名与用途不包含在链接中，也不经核实；依赖证书的一方应另行核实身份。
        </p>

        <h2 id="zone-certificates">POSI 分区证书</h2>
        <p>
          <Link href={L('/certificate/zone/')}>POSI 分区证书</Link>（zone certificate）证明期刊在当前引文排名中的 <Link href={L('/methodology/#zones')}>POSI Zone</Link>，即其 PNCI 百分位在所属 PSC 学科类别内所处的分区（Zone 1：前 5%；Zone 2：前 5%–20%；Zone 3：前 20%–50%；Zone 4：后 50%）。凡拥有<strong>正式</strong> Zone（在至少有 50 本已排名期刊的类别中获得正式排名）的期刊，均可在期刊概况页面出具，无需申请。
        </p>
        <ul>
          <li>类别、Zone、引文排名、类别规模、百分位与引文分区。</li>
          <li>期刊刊名、出版商、ISSN 与 POSI ID、其 PNCI，以及所依据的排名快照、数据快照与分区规则（<code>{ZONES_VERSION}</code>）。</li>
        </ul>
        <p>
          <strong>证书编号</strong>（<code>PZ-XXXX-XXXX-XXXX</code>）取 <code>POSI-ZONE-CERT-2|分区规则|出具日期|POSI ID|版次年份|类别|Zone</code> 的 SHA-256 值的前 12 位十六进制数字。验证时依据期刊当前的排名记录重新计算。编号刻意不包含名次，因此只要 Zone 不变，证书就保持有效；Zone 发生变化，或版次年份随每年 12 月的新年度版次更替时，证书即不再通过验证。代码见 <code>src/lib/zone-certificate.ts</code>。
        </p>
        <p>
          2026 年 9 月 28 日之前出具的证书载明的是已停用的、基于 PCS 的试行分区（<code>POSI-ZONES-1.0</code>、<code>POSI-ZONE-CERT-1</code>）。该排名已撤回，因此这些证书不再通过验证。
        </p>

        <h2>适当使用</h2>
        <p>
          证书记录的是收录状态或排名位置，并非对文献或期刊质量的评估。详见<Link href={L('/responsible-use/')}>负责任使用</Link>。
        </p>
      </div>
    </div>
  )
}
