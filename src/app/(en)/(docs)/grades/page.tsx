import { GradesView, gradesMetadata } from '@/components/views/docs/GradesView'

export const metadata = gradesMetadata('en')

export default function Page() {
  return <GradesView locale="en" />
}
