import { AnnouncementsView, announcementsMetadata } from '@/components/views/docs/AnnouncementsView'

export const metadata = announcementsMetadata('en')

export default function AnnouncementsPage() {
  return <AnnouncementsView locale="en" />
}
