import { AjrEarlyStageView, ajrEarlyStageMetadata } from '@/components/views/docs/AjrEarlyStageView'

export const metadata = ajrEarlyStageMetadata('en')

export default function Page() {
  return <AjrEarlyStageView locale="en" />
}
