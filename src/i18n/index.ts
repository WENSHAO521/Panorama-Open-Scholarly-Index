import { en } from './messages/en.ts'
import type { Locale } from './config.ts'

export type Messages = typeof en

const MESSAGES: Record<Locale, Messages> = { en }

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale]
}

/** The part of the messages that client components read, passed through LocaleProvider. */
export type ClientMessages = Pick<Messages, 'common' | 'header' | 'nav' | 'docs'>

export function clientMessages(m: Messages): ClientMessages {
  return { common: m.common, header: m.header, nav: m.nav, docs: m.docs }
}
