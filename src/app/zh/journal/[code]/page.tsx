import { JournalRecordView, journalRecordMetadata, journalRecordParams } from '@/components/views/JournalRecordView'

export const dynamicParams = false

export function generateStaticParams() {
  return journalRecordParams('zh-Hans')
}

export async function generateMetadata(props: { params: Promise<{ code: string }> }) {
  return journalRecordMetadata((await props.params).code, 'zh-Hans')
}

export default async function Page(props: { params: Promise<{ code: string }> }) {
  return <JournalRecordView code={(await props.params).code} locale="zh-Hans" />
}
