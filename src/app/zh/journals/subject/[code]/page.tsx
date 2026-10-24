import { SubjectJournalsView, subjectJournalsMetadata, subjectJournalsParams } from '@/components/views/SubjectJournalsView'

export const dynamicParams = false

export function generateStaticParams() {
  return subjectJournalsParams()
}

export async function generateMetadata(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  return subjectJournalsMetadata(code, 'zh-Hans')
}

export default async function SubjectJournalsPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params
  return <SubjectJournalsView code={code} locale="zh-Hans" />
}
