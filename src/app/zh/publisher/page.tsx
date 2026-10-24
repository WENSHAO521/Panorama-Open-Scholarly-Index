import { Suspense } from 'react'
import { PublisherViewer } from '@/components/views/PublisherViewer'

export const metadata = {
  title: '出版商',
  description: '在 POSI 中有收录期刊的出版商，由公开数据分片在浏览器中生成。',
  robots: { index: false },
}

export default function PublisherViewerPage() {
  return (
    <div className="wrap">
      <Suspense fallback={null}>
        <PublisherViewer />
      </Suspense>
    </div>
  )
}
