// /privacy/ in every language it is published in: the English page (En) and its Simplified Chinese translation (Zh).
import Link from 'next/link'
import { PageHeader } from '@/components/db'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import { localizedHref, pageAlternates } from '@/i18n/alternates'

const EN_META = {
  title: 'Privacy policy',
  description: 'How posi.panorama-sg.com handles personal data: cookieless visit statistics, hosting, registry requests made from your browser, email, your rights and how to contact POSI.',
  alternates: { canonical: '/privacy/' },
}

const td = 'text-[13.5px] align-top'

function En() {
  return (
    <div className="pb-12">
      <PageHeader title="Privacy policy" crumbs={[{ label: 'POSI', href: '/' }, { label: 'Legal' }, { label: 'Privacy policy' }]}>
        <p className="max-w-[68ch]">
          This policy explains what personal data is processed when you use posi.panorama-sg.com (&ldquo;POSI&rdquo;),
          why, for how long, who else receives it, and the rights you have. Last updated 23 October 2026.
        </p>
      </PageHeader>

      <div className="doc">
        <section aria-labelledby="controller">
          <h2 id="controller">1. Who is responsible</h2>
          <p>
            POSI is published by Panorama Scholarly Group Ltd., Hong Kong SAR (&ldquo;we&rdquo;, &ldquo;us&rdquo;), which
            is the data user under the Hong Kong Personal Data (Privacy) Ordinance (Cap. 486) and the controller for the
            purposes of the EU and UK General Data Protection Regulation. Privacy enquiries:{' '}
            <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>.
          </p>
        </section>

        <section aria-labelledby="summary">
          <h2 id="summary">2. In short</h2>
          <ul>
            <li>You can use all of POSI without an account, and we do not ask who you are.</li>
            <li>POSI sets no cookies of its own and runs no advertising, cross-site tracking or visitor profiling.</li>
            <li>We count visits with Cloudflare Web Analytics, which is cookieless and records no search terms.</li>
            <li>Publication searches go from your browser directly to public scholarly registries, not through POSI.</li>
            <li>We do not sell, rent or trade personal data.</li>
          </ul>
        </section>

        <section aria-labelledby="data">
          <h2 id="data">3. What we process and why</h2>

          <h3>3.1 Visit statistics</h3>
          <p>
            POSI uses Cloudflare Web Analytics to understand which pages are used and how quickly they load. When a
            page opens, a small script sends the page path, the referring page, the browser and operating system
            type, the screen size, the country derived from the connection, and page-load timings. It sets no
            cookies, uses no local storage, does not fingerprint your device and does not follow you across other
            sites. The query part of a page address, where your search terms appear, is not sent. We see the results
            only as aggregated counts; we do not use them to identify anyone.
          </p>

          <h3>3.2 Hosting and security</h3>
          <p>
            POSI is served by Cloudflare. To deliver pages and protect the site against abuse, Cloudflare processes
            standard connection data such as IP address, requested address, time, and browser type. Where it needs to
            distinguish people from automated traffic, Cloudflare may set a strictly necessary security cookie. POSI
            itself keeps no server logs.
          </p>

          <h3>3.3 Information kept in your browser</h3>
          <p>
            Two things are stored on your own device and are never sent to us: your light or dark theme choice
            (local storage, until you clear it), and recent publication search results (session storage, deleted when
            you close the tab) so that the same request is not repeated.
          </p>

          <h3>3.4 Requests your browser makes to scholarly registries</h3>
          <p>
            Publication search, publication pages, citation export and certificate checks send your query directly
            from your browser to public services, not through POSI. Each of them receives the query and your IP
            address and handles them under its own privacy policy:
          </p>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>Service</th><th>Used for</th></tr></thead>
              <tbody>
                <tr><td className={td}>OpenAlex (api.openalex.org)</td><td className={td}>Publication search and details, certificate checks</td></tr>
                <tr><td className={td}>Crossref (api.crossref.org)</td><td className={td}>DOI metadata and search, and fallback when OpenAlex cannot answer</td></tr>
                <tr><td className={td}>DataCite (api.datacite.org), Zenodo (zenodo.org)</td><td className={td}>DOIs registered outside Crossref</td></tr>
                <tr><td className={td}>doi.org</td><td className={td}>Finding which agency registered a DOI</td></tr>
                <tr><td className={td}>Open Library (openlibrary.org), Google Books (googleapis.com)</td><td className={td}>Book details when you cite by ISBN</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            Journal search, journal profiles, rankings and the methodology pages are served by POSI and contact none
            of these services.
          </p>

          <h3>3.5 Information you send us</h3>
          <p>
            Certification applications, corrections and other enquiries reach us by email at posi@panorama-sg.com;
            POSI has no web forms that store what you write. We use your name, email address, affiliation and
            message only to handle your request and, for editorial matters, to keep a record of the decision made.
          </p>
          <p>
            The name, affiliation and purpose you type when issuing a certificate are placed on the certificate in
            your browser and are not sent to us.
          </p>

          <h3>3.6 Bibliographic metadata</h3>
          <p>
            Author names, ORCID iDs and affiliations shown with publications come from metadata that publishers have
            made public through Crossref and OpenAlex. POSI displays it to describe the scholarly record. To correct
            it, contact the publisher or the registry; see <Link href="/docs/data/#corrections">data sources and access</Link>.
            You may also write to us and we will point you to the right source.
          </p>
        </section>

        <section aria-labelledby="basis">
          <h2 id="basis">4. Legal basis</h2>
          <p>
            Where the GDPR applies, we rely on our legitimate interests in operating, securing and improving a
            public scholarly index (sections 3.1, 3.2 and 3.6), and on taking the steps you ask for when you write to
            us (section 3.5). Storage on your device (section 3.3) is limited to what is strictly necessary for the
            feature you use. Personal data is collected only for these purposes and is not used for any other.
          </p>
        </section>

        <section aria-labelledby="retention">
          <h2 id="retention">5. How long we keep it</h2>
          <ul>
            <li>Visit statistics: kept by Cloudflare in aggregated form for a limited period under its retention rules.</li>
            <li>Connection and security data: kept by Cloudflare only as long as needed to deliver and protect the service.</li>
            <li>Email: for as long as your request is open, and afterwards only where it documents an editorial decision.</li>
            <li>Browser storage: under your control; clearing your browser data removes it.</li>
          </ul>
        </section>

        <section aria-labelledby="recipients">
          <h2 id="recipients">6. Who receives it</h2>
          <p>
            Cloudflare, Inc. acts as our service provider for hosting, security and visit statistics, under its data
            processing terms. Our email provider stores the messages you send us. We disclose personal data
            otherwise only where the law requires it. The registries in section 3.4 receive requests from your
            browser directly, as independent providers.
          </p>
        </section>

        <section aria-labelledby="transfers">
          <h2 id="transfers">7. International transfers</h2>
          <p>
            Cloudflare runs a global network, so data may be processed outside Hong Kong and outside your own country.
            Where the GDPR applies, such transfers rely on Cloudflare&rsquo;s certification under the EU&ndash;US Data
            Privacy Framework or on the European Commission&rsquo;s standard contractual clauses.
          </p>
        </section>

        <section aria-labelledby="rights">
          <h2 id="rights">8. Your rights</h2>
          <p>
            You may ask whether we hold personal data about you, ask for a copy, and ask us to correct it. Where the
            GDPR applies you may also ask us to erase or restrict it, object to processing based on our legitimate
            interests, and receive data you gave us in a portable form. Write to{' '}
            <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>; we reply within 40 days, the period set by the
            Hong Kong Ordinance, and sooner where the GDPR requires one month. Because POSI does not identify
            visitors, we usually hold no data about you beyond what you have emailed us.
          </p>
          <p>
            You may also complain to the Office of the Privacy Commissioner for Personal Data, Hong Kong, or to the data
            protection authority where you live or work.
          </p>
        </section>

        <section aria-labelledby="security">
          <h2 id="security">9. Security</h2>
          <p>
            POSI is a static site served only over HTTPS, with a content security policy that limits which outside
            services a page may contact. It has no user database to breach.
          </p>
        </section>

        <section aria-labelledby="children">
          <h2 id="children">10. Children</h2>
          <p>
            POSI is a research tool for adults and is not directed at children. We do not knowingly collect personal
            data from children.
          </p>
        </section>

        <section aria-labelledby="changes">
          <h2 id="changes">11. Changes to this policy</h2>
          <p>
            We publish any change on this page and update the date at the top. A change that affects how your data is
            used is also announced in <Link href="/announcements/">News</Link>.
          </p>
        </section>

        <section aria-labelledby="contact">
          <h2 id="contact">12. Contact</h2>
          <p>
            Panorama Scholarly Group Ltd., Hong Kong SAR &middot;{' '}
            <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>
          </p>
        </section>
      </div>
    </div>
  )
}

export function privacyMetadata(locale: Locale): Metadata {
  const m = locale === 'zh-Hans' ? ZH_META : EN_META
  return { title: m.title, description: m.description, alternates: pageAlternates('/privacy/', locale) }
}

export function PrivacyView({ locale }: { locale: Locale }) {
  return locale === 'zh-Hans' ? <Zh /> : <En />
}

const ZH_META = {
  title: '隐私政策',
  description: 'posi.panorama-sg.com 如何处理个人数据：无 Cookie 的访问统计、托管服务、您的浏览器向注册机构发出的请求、电子邮件、您的权利，以及如何联系 POSI。',
}

const L = (p: string) => localizedHref('zh-Hans', p)

function Zh() {
  return (
    <div className="pb-12">
      <PageHeader locale="zh-Hans" title="隐私政策" crumbs={[{ label: 'POSI', href: L('/') }, { label: '法律信息' }, { label: '隐私政策' }]}>
        <p className="max-w-[68ch]">
          本政策说明您使用 posi.panorama-sg.com（“POSI”）时会处理哪些个人数据、处理的原因与期限、还有谁会接收这些数据，以及您享有的权利。最后更新于 2026 年 10 月 23 日。
        </p>
      </PageHeader>

      <div className="doc">
        <p className="panel p-4 text-[13.5px]" style={{ color: 'var(--ink-2)' }}>
          本译文仅供参考。中文译文与<Link href="/privacy/">英文版本</Link>如有任何不一致，以英文版本为准。
        </p>

        <section aria-labelledby="controller">
          <h2 id="controller">1. 责任方</h2>
          <p>
            POSI 由香港特别行政区的 Panorama Scholarly Group Ltd.（“我们”）出版。根据香港《个人资料（私隐）条例》（第 486 章），我们是资料使用者；就欧盟及英国《通用数据保护条例》（GDPR）而言，我们是数据控制者。隐私问题请联系：<a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>。
          </p>
        </section>

        <section aria-labelledby="summary">
          <h2 id="summary">2. 概要</h2>
          <ul>
            <li>您无需注册账户即可使用 POSI 的全部功能，我们也不会询问您的身份。</li>
            <li>POSI 不设置任何自有 Cookie，不投放广告，也不进行跨站追踪或访客画像。</li>
            <li>我们使用 Cloudflare Web Analytics 统计访问量，该服务不使用 Cookie，也不记录检索词。</li>
            <li>文献检索由您的浏览器直接发送至公开的学术注册机构，不经过 POSI。</li>
            <li>我们不出售、出租或交易个人数据。</li>
          </ul>
        </section>

        <section aria-labelledby="data">
          <h2 id="data">3. 我们处理哪些数据及原因</h2>

          <h3>3.1 访问统计</h3>
          <p>
            POSI 使用 Cloudflare Web Analytics 了解哪些页面被使用以及页面加载速度。页面打开时，一个小脚本会发送页面路径、来源页面、浏览器与操作系统类型、屏幕尺寸、依据网络连接推断的国家/地区，以及页面加载耗时。它不设置 Cookie，不使用本地存储，不对您的设备进行指纹识别，也不会在其他网站上追踪您。页面地址中包含检索词的查询部分不会被发送。我们只能看到汇总后的计数，不会用其识别任何人。
          </p>

          <h3>3.2 托管与安全</h3>
          <p>
            POSI 由 Cloudflare 提供服务。为传送页面并防止网站被滥用，Cloudflare 会处理标准的连接数据，例如 IP 地址、请求地址、时间与浏览器类型。在需要区分真人与自动化流量时，Cloudflare 可能会设置一个严格必要的安全 Cookie。POSI 本身不保存服务器日志。
          </p>

          <h3>3.3 保存在您浏览器中的信息</h3>
          <p>
            有两类信息保存在您自己的设备上，从不发送给我们：您选择的浅色或深色主题（本地存储，直至您清除为止），以及最近的文献检索结果（会话存储，关闭标签页即删除），以免重复发出相同请求。
          </p>

          <h3>3.4 您的浏览器向学术注册机构发出的请求</h3>
          <p>
            文献检索、文献页面、引文导出与证书核查会由您的浏览器直接将查询发送至公开服务，不经过 POSI。这些服务都会收到查询内容及您的 IP 地址，并按其各自的隐私政策处理：
          </p>
          <div className="panel overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>服务</th><th>用途</th></tr></thead>
              <tbody>
                <tr><td className={td}>OpenAlex（api.openalex.org）</td><td className={td}>文献检索与详情、证书核查</td></tr>
                <tr><td className={td}>Crossref（api.crossref.org）</td><td className={td}>DOI 元数据与检索，以及 OpenAlex 无法提供结果时的备用来源</td></tr>
                <tr><td className={td}>DataCite（api.datacite.org）、Zenodo（zenodo.org）</td><td className={td}>在 Crossref 以外注册的 DOI</td></tr>
                <tr><td className={td}>doi.org</td><td className={td}>查明 DOI 的注册机构</td></tr>
                <tr><td className={td}>Open Library（openlibrary.org）、Google Books（googleapis.com）</td><td className={td}>按 ISBN 引用时获取图书信息</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            期刊检索、期刊概况、排名与评价方法页面均由 POSI 提供，不会联系上述任何服务。
          </p>

          <h3>3.5 您发送给我们的信息</h3>
          <p>
            认证申请、更正及其他咨询均通过电子邮件 posi@panorama-sg.com 发送给我们；POSI 没有会保存您所填写内容的网页表单。我们仅将您的姓名、电子邮件地址、所属机构与留言用于处理您的请求，涉及编辑事务时，也用于保存所作决定的记录。
          </p>
          <p>
            您在出具证书时输入的姓名、所属机构与用途，仅在您的浏览器中写入证书，不会发送给我们。
          </p>

          <h3>3.6 书目元数据</h3>
          <p>
            与文献一同显示的作者姓名、ORCID iD 与所属机构，来自出版商通过 Crossref 与 OpenAlex 公开的元数据。POSI 显示这些信息以描述学术记录。如需更正，请联系出版商或注册机构，详见<Link href={L('/docs/data/#corrections')}>数据来源与获取</Link>。您也可以写信给我们，我们会告诉您应联系的来源。
          </p>
        </section>

        <section aria-labelledby="basis">
          <h2 id="basis">4. 法律依据</h2>
          <p>
            在适用 GDPR 的情况下，我们依据的是运营、保护和改进公开学术索引的正当利益（第 3.1、3.2 和 3.6 节），以及在您写信给我们时按您的要求采取相应步骤（第 3.5 节）。在您设备上的存储（第 3.3 节）仅限于您所使用功能严格必要的范围。个人数据仅为上述目的收集，不作其他用途。
          </p>
        </section>

        <section aria-labelledby="retention">
          <h2 id="retention">5. 保存期限</h2>
          <ul>
            <li>访问统计：由 Cloudflare 按其保存规则以汇总形式保存一段有限时间。</li>
            <li>连接与安全数据：Cloudflare 仅在传送与保护服务所需的期限内保存。</li>
            <li>电子邮件：在您的请求处理期间保存；此后仅在其记录编辑决定时保存。</li>
            <li>浏览器存储：由您控制，清除浏览器数据即可删除。</li>
          </ul>
        </section>

        <section aria-labelledby="recipients">
          <h2 id="recipients">6. 数据接收方</h2>
          <p>
            Cloudflare, Inc. 依据其数据处理条款，作为我们的服务提供商提供托管、安全与访问统计服务。我们的电子邮件服务商保存您发送给我们的邮件。除此之外，我们仅在法律要求时披露个人数据。第 3.4 节所列的注册机构作为独立服务提供方，直接接收来自您浏览器的请求。
          </p>
        </section>

        <section aria-labelledby="transfers">
          <h2 id="transfers">7. 跨境传输</h2>
          <p>
            Cloudflare 运营全球网络，因此数据可能在香港以外及您所在国家/地区以外处理。在适用 GDPR 的情况下，此类传输依据 Cloudflare 在欧盟–美国数据隐私框架下的认证，或欧盟委员会的标准合同条款。
          </p>
        </section>

        <section aria-labelledby="rights">
          <h2 id="rights">8. 您的权利</h2>
          <p>
            您可以询问我们是否持有您的个人数据，要求获取副本，并要求我们更正。在适用 GDPR 的情况下，您还可以要求我们删除或限制处理您的数据，反对基于我们正当利益的处理，并以可携带的形式获取您提供给我们的数据。请写信至 <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>；我们会在香港条例规定的 40 日内答复，在 GDPR 要求一个月内答复的情况下则更早答复。由于 POSI 不识别访客身份，除您通过电子邮件发送给我们的内容外，我们通常不持有关于您的任何数据。
          </p>
          <p>
            您也可以向香港个人资料私隐专员公署，或向您居住或工作所在地的数据保护机构投诉。
          </p>
        </section>

        <section aria-labelledby="security">
          <h2 id="security">9. 安全</h2>
          <p>
            POSI 是仅通过 HTTPS 提供服务的静态网站，并设有内容安全策略，限制页面可以联系的外部服务。网站没有可被攻破的用户数据库。
          </p>
        </section>

        <section aria-labelledby="children">
          <h2 id="children">10. 儿童</h2>
          <p>
            POSI 是面向成年人的研究工具，并非针对儿童。我们不会在知情的情况下收集儿童的个人数据。
          </p>
        </section>

        <section aria-labelledby="changes">
          <h2 id="changes">11. 政策变更</h2>
          <p>
            任何变更都会在本页公布，并更新页首日期。影响您数据使用方式的变更也会在<Link href={L('/announcements/')}>新闻动态</Link>中公告。
          </p>
        </section>

        <section aria-labelledby="contact">
          <h2 id="contact">12. 联系方式</h2>
          <p>
            Panorama Scholarly Group Ltd.，香港特别行政区 &middot;{' '}
            <a href="mailto:posi@panorama-sg.com">posi@panorama-sg.com</a>
          </p>
        </section>
      </div>
    </div>
  )
}
