import { AnnouncementsView, announcementsMetadata } from '@/components/views/docs/AnnouncementsView'

export const metadata = announcementsMetadata('zh-Hans')

export default function AnnouncementsPage() {
  return <AnnouncementsView locale="zh-Hans" />
}
