import { Suspense } from 'react'
import { WorkViewer } from '@/components/views/WorkViewer'

export const metadata = {
  title: '文献',
  description: '文献详情：作者、摘要、期刊、引用次数与现成的引文格式。',
}

export default function WorkPage() {
  return (
    <div className="wrap">
      <Suspense fallback={null}>
        <WorkViewer />
      </Suspense>
    </div>
  )
}
