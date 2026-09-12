// One segment of the homepage's Observation → Early Stage → Mature
// lifecycle timeline. Horizontal on desktop, stacked vertically on mobile
// (§27 of the Stage 1 brief) — the connector between segments flips
// orientation with the same breakpoint rather than needing a second
// desktop/mobile-specific markup tree.
import { CaretRight, CaretDown } from '@phosphor-icons/react/dist/ssr'

export function LifecycleStage({
  stage,
  window,
  methodology,
  status,
  accent,
  showConnector,
}: {
  stage: string
  window: string
  methodology?: string
  status: string
  accent: string
  showConnector: boolean
}) {
  return (
    // md:flex-1 so the three stages actually split the row evenly instead
    // of each sizing to its own content width and leaving a gap of the
    // section's own background color after the last stage (a real layout
    // bug, not a screenshot-timing artifact — caught by real-browser QA).
    <div className="flex flex-col md:flex-row md:flex-1 md:items-center">
      <div className="flex-1 p-6" style={{ background: 'var(--posi-surface)' }}>
        <p className="text-sm font-bold uppercase tracking-[0.08em]" style={{ color: accent }}>
          {stage}
        </p>
        <p className="text-xs mt-1.5" style={{ color: 'var(--posi-muted)' }}>
          {window}
        </p>
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {methodology && (
            <span
              className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
              style={{ color: accent, border: `1px solid ${accent}` }}
            >
              {methodology}
            </span>
          )}
          <span className="text-[10px] font-mono" style={{ color: 'var(--posi-text)' }}>
            {status}
          </span>
        </div>
      </div>
      {showConnector && (
        <>
          <div className="hidden md:flex items-center justify-center shrink-0 w-8" style={{ color: 'var(--posi-border)' }} aria-hidden="true">
            <CaretRight className="h-4 w-4" />
          </div>
          <div className="flex md:hidden items-center justify-center shrink-0 h-6" style={{ color: 'var(--posi-border)' }} aria-hidden="true">
            <CaretDown className="h-4 w-4" />
          </div>
        </>
      )}
    </div>
  )
}
