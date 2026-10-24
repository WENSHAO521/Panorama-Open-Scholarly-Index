import { JournalRecordView, journalRecordMetadata, journalRecordParams } from '@/components/views/JournalRecordView'

export const dynamicParams = false

export function generateStaticParams() {
  return journalRecordParams('en')
}

export async function generateMetadata(props: { params: Promise<{ code: string }> }) {
  return journalRecordMetadata((await props.params).code, 'en')
}

export default async function Page(props: { params: Promise<{ code: string }> }) {
  return <JournalRecordView code={(await props.params).code} locale="en" />
}
