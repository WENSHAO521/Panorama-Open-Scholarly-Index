import { HomePage } from '@/components/HomePage'
import { RedirectToSavedLocale } from '@/components/I18n'
import { homeMetadata } from '@/lib/i18n/metadata'

export const metadata = homeMetadata('en')

export default function Page() {
  return (
    <>
      <RedirectToSavedLocale page="/" />
      <HomePage locale="en" />
    </>
  )
}
