'use client'

// Verifies a zone certificate: recomputes its number from the date of issue
// and the journal's current ranking record. ?c=<number>&d=<date>&issn=<ISSN>.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, WarningCircle } from '@phosphor-icons/react/dist/ssr'
import { getJournalProfile, journalHref, type JournalProfile } from '@/lib/journal-profile'
import { placements, zoneCertificateCode, ZONE_SHARE } from '@/lib/zone-certificate'
import { fmt, Note } from './db'
import { useLocale } from '@/i18n/LocaleProvider'
import { localizedHref } from '@/i18n/alternates'
import type { Locale } from '@/i18n/config'
import { subjectName } from '@/i18n/format'
import type { Zone } from '@/lib/zones'

// The certificate itself is English; the page that verifies it follows the visitor's language (decided 2026-10-24).
const en = {
  incomplete: 'This verification address is incomplete. Open it from the QR code on the certificate, or copy the full address printed under it.',
  loadError: 'The journal record could not be loaded. Check your connection and reload the page.',
  validTitle: 'Valid certificate',
  validBody: 'The certificate number matches its date of issue and the journal\u2019s zones in the current ranking edition.',
  mismatchTitle: 'Does not match the current ranking',
  mismatchBody: 'The certificate number does not match the journal\u2019s current zone. Either the zone has changed since the date of issue (a new Citation Ranking edition is published each December), the certificate was issued under the retired PCS-based zone trial (before 28 September 2026), or the certificate has been altered. The current zone is shown below; a new certificate can be issued from the journal\u2019s profile.',
  noJournal: 'No indexed journal matches the ISSN in this address.',
  number: 'Certificate number', issued: 'Issued', journal: 'Journal', zoneToday: 'Zone today',
  share: ZONE_SHARE as Record<Zone, string>,
  inA: ' in ', rank: 'rank',
  noZone: 'No official zone in the current Citation Ranking edition',
  footer: 'The certificate number is recomputed from the date of issue and the journal\u2019s current zones, so a certificate stays valid while its zones hold, whatever the rank movements within a zone. ',
  how: 'How zone certificates work', end: '.',
}
const WORDS: Record<Locale, typeof en> = {
  en,
  'zh-Hans': {
    incomplete: '此验证地址不完整。请扫描证书上的二维码打开，或复制印在二维码下方的完整地址。',
    loadError: '无法加载期刊记录。请检查网络连接后刷新页面。',
    validTitle: '证书有效',
    validBody: '证书编号与其出具日期及期刊在当前排名版本中的 Zone 相符。',
    mismatchTitle: '与当前排名不符',
    mismatchBody: '证书编号与期刊当前的 Zone 不符。可能是自出具之日起 Zone 已发生变化（引文排名每年 12 月发布新版），证书出具于已停用的基于 PCS 的 Zone 试行阶段（2026 年 9 月 28 日之前），或证书已被改动。下方显示期刊当前的 Zone；可在期刊概况页面重新出具证书。',
    noJournal: '没有已收录期刊与此地址中的 ISSN 相符。',
    number: '证书编号', issued: '出具日期', journal: '期刊', zoneToday: '当前 Zone',
    share: { 1: '前 5%', 2: '前 5%–20%', 3: '前 20%–50%', 4: '后 50%' },
    inA: '，类别：', rank: '排名',
    noZone: '在当前引文排名版本中没有正式 Zone',
    footer: '证书编号根据出具日期和期刊当前的 Zone 重新计算，因此只要 Zone 不变，无论期刊在 Zone 内的排名如何变动，证书都保持有效。',
    how: 'Zone 证书说明', end: '。',
  },
}

interface Result { key: string; profile: JournalProfile | null; expected: string | null; error?: boolean }

export function ZoneCertificateVerifier() {
  const locale = useLocale()
  const t = WORDS[locale]
  const href = (p: string) => localizedHref(locale, p)
  const sp = useSearchParams()
  const code = (sp.get('c') ?? '').trim().toUpperCase()
  const issued = sp.get('d') ?? ''
  const issn = sp.get('issn') ?? ''
  const key = sp.toString()
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    if (!code || !issued || !issn) return
    const ctrl = new AbortController()
    getJournalProfile(issn, ctrl.signal)
      .then(async profile => {
        const expected = profile ? await zoneCertificateCode(issued, profile) : null
        if (!ctrl.signal.aborted) setResult({ key, profile, expected })
      })
      .catch(e => { if (e.name !== 'AbortError') setResult({ key, profile: null, expected: null, error: true }) })
    return () => ctrl.abort()
  }, [key, code, issued, issn])

  if (!code || !issued || !issn) {
    return <Note tone="warn">{t.incomplete}</Note>
  }
  const current = result?.key === key ? result : null
  if (!current) {
    return (
      <div className="rounded-[2px] p-5 animate-pulse max-w-[860px]" style={{ background: 'var(--surface-2)' }} aria-busy="true">
        <div className="h-5 w-56 rounded-[2px]" style={{ background: 'var(--surface-3)' }} />
        <div className="h-4 w-80 rounded-[2px] mt-2" style={{ background: 'var(--surface-3)' }} />
      </div>
    )
  }
  if (current.error) return <Note tone="warn">{t.loadError}</Note>

  const j = current.profile
  const valid = !!current.expected && current.expected === code
  const zones = j ? placements(j) : []
  const m = valid
    ? { Icon: CheckCircle, color: 'var(--verified)', bg: 'var(--verified-soft)', title: t.validTitle, body: t.validBody }
    : { Icon: WarningCircle, color: 'var(--check)', bg: 'var(--check-soft)', title: t.mismatchTitle, body: j ? t.mismatchBody : t.noJournal }

  return (
    <div className="space-y-6 max-w-[860px]">
      <div className="rounded-[2px] p-5 flex gap-4 items-start" style={{ background: m.bg, border: '1px solid var(--line)' }} role="status">
        <m.Icon className="h-7 w-7 shrink-0" style={{ color: m.color }} />
        <div>
          <p className="text-[18px] font-semibold" style={{ color: m.color }}>{m.title}</p>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--ink-2)' }}>{m.body}</p>
        </div>
      </div>

      <dl className="panel p-5 grid gap-x-8 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)] text-[14px]">
        <dt style={{ color: 'var(--muted)' }}>{t.number}</dt>
        <dd className="font-mono font-medium">{code}</dd>
        <dt style={{ color: 'var(--muted)' }}>{t.issued}</dt>
        <dd className="font-mono">{issued}</dd>
        {j && <>
          <dt style={{ color: 'var(--muted)' }}>{t.journal}</dt>
          <dd><Link href={href(journalHref(j.k))} className="link">{j.t}</Link> <span className="font-mono text-[12.5px]" style={{ color: 'var(--muted)' }}>{j.pid}</span></dd>
          <dt style={{ color: 'var(--muted)' }}>ISSN</dt>
          <dd className="font-mono">{j.is.join(', ')}</dd>
          <dt style={{ color: 'var(--muted)' }}>{t.zoneToday}</dt>
          <dd>
            {zones.length ? (
              <ul className="space-y-0.5">
                {zones.map(p => (
                  <li key={p.scope}>
                    <strong>Zone {p.zone}</strong> ({t.share[p.zone]}){t.inA}{zoneCategory(locale, j, p.label)}
                    <span className="font-mono text-[12.5px]" style={{ color: 'var(--muted)' }}> · {t.rank} {fmt(p.rank)} / {fmt(p.size)}{j.ev?.y ? ` · ${j.ev.y}` : ''}</span>
                  </li>
                ))}
              </ul>
            ) : <span style={{ color: 'var(--muted)' }}>{t.noZone}</span>}
          </dd>
        </>}
      </dl>

      <p className="text-[13px] leading-relaxed max-w-[75ch]" style={{ color: 'var(--muted)' }}>
        {t.footer}<Link href={href('/docs/certificates/#zone-certificates')} className="link">{t.how}</Link>{t.end}
      </p>
    </div>
  )
}

/** "P5.01 Philosophy", with the category's name in the page's language. */
function zoneCategory(locale: Locale, j: JournalProfile, english: string): string {
  const code = j.ev?.cat
  return code ? `${code} ${subjectName(locale, code, english.slice(code.length).trim())}`.trim() : english
}
