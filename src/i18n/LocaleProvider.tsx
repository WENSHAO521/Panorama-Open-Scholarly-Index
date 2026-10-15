'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { type Locale } from './config.ts'
import type { ClientMessages } from './index.ts'

interface Value { locale: Locale; messages: ClientMessages }

const LocaleContext = createContext<Value | null>(null)

/** Gives client components the language of the page and the part of its messages they read. */
export function LocaleProvider({ locale, messages, children }: { locale: Locale; messages: ClientMessages; children: ReactNode }) {
  return <LocaleContext.Provider value={{ locale, messages }}>{children}</LocaleContext.Provider>
}

function useValue(): Value {
  const v = useContext(LocaleContext)
  if (!v) throw new Error('LocaleProvider is missing: a root layout wraps its pages in RootShell')
  return v
}

export function useLocale(): Locale { return useValue().locale }
export function useMessages(): ClientMessages { return useValue().messages }
