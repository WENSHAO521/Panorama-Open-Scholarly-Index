import { DocsSidebar } from '@/components/DocsSidebar'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap pt-6 lg:pt-10 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-10">
      <DocsSidebar />
      <div className="docs-content min-w-0">{children}</div>
    </div>
  )
}
