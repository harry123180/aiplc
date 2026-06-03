import { useEffect } from 'react'
import { X, XCircle, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import type { DrcIssue } from '../store/useAppStore'

interface DrcVerificationModalProps {
  onClose: () => void
  onRunAnyway: () => void // only enabled if zero errors
}

export default function DrcVerificationModal({
  onClose,
  onRunAnyway,
}: DrcVerificationModalProps) {
  const drcResults = useAppStore((s) => s.drcResults)
  const setHighlights = useAppStore((s) => s.setHighlights)

  // Escape key closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!drcResults) return null

  const errors = drcResults.issues.filter((i) => i.severity === 'error')
  const warnings = drcResults.issues.filter((i) => i.severity === 'warning')
  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0
  const allPassed = !hasErrors && !hasWarnings

  const handleIssueClick = (issue: DrcIssue) => {
    setHighlights(issue.componentIds ?? [], issue.wireIds ?? [])
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4"
        style={{
          background: 'var(--color-bg)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} style={{ color: 'var(--color-blue)' }} />
            <h2
              className="text-base font-semibold"
              style={{ color: 'var(--color-text)' }}
            >
              Circuit Verification
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-surface)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <X size={18} style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>

        {/* Summary */}
        <div className="px-6 pt-4 pb-2">
          {allPassed && (
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
              style={{ background: '#E8F5E9', color: '#2E7D32' }}
            >
              <CheckCircle size={18} />
              <span className="text-sm font-medium">
                &#10003; &#x96FB;&#x8DEF;&#x6AA2;&#x67E5;&#x901A;&#x904E;
              </span>
            </div>
          )}
          {hasErrors && (
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
              style={{ background: '#FFEBEE', color: '#C62828' }}
            >
              <XCircle size={18} />
              <span className="text-sm font-medium">
                &#10005; {'發現'} {errors.length} {'個錯誤'}
                {hasWarnings && (
                  <span>
                    {'，'}{warnings.length} {'個警告'}
                  </span>
                )}
              </span>
            </div>
          )}
          {!hasErrors && hasWarnings && (
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
              style={{ background: '#FFF8E1', color: '#F57F17' }}
            >
              <AlertTriangle size={18} />
              <span className="text-sm font-medium">
                &#9888; {'發現'} {warnings.length} {'個警告'}
              </span>
            </div>
          )}
        </div>

        {/* Issue list */}
        {drcResults.issues.length > 0 && (
          <div
            className="px-6 py-2"
            style={{ maxHeight: '300px', overflowY: 'auto' }}
          >
            <div className="space-y-2">
              {drcResults.issues.map((issue, idx) => {
                const isError = issue.severity === 'error'
                return (
                  <div
                    key={`${issue.code}-${idx}`}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                    style={{
                      borderLeft: `3px solid ${isError ? 'var(--color-red)' : 'var(--color-yellow)'}`,
                      background: isError ? '#FFF5F5' : '#FFFDE7',
                    }}
                    onClick={() => handleIssueClick(issue)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isError
                        ? '#FFEBEE'
                        : '#FFF9C4'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isError
                        ? '#FFF5F5'
                        : '#FFFDE7'
                    }}
                  >
                    {isError ? (
                      <XCircle
                        size={16}
                        style={{
                          color: 'var(--color-red)',
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      />
                    ) : (
                      <AlertTriangle
                        size={16}
                        style={{
                          color: 'var(--color-yellow)',
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      />
                    )}
                    <span
                      className="text-sm"
                      style={{ color: 'var(--color-text)', lineHeight: 1.4 }}
                    >
                      {issue.message}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-6 py-4"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          {hasErrors && (
            <>
              <span
                className="text-sm mr-auto"
                style={{ color: 'var(--color-red)' }}
              >
                {'修正錯誤後再執行'}
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg cursor-pointer
                           transition-colors border"
                style={{
                  color: 'var(--color-text-secondary)',
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-surface)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--color-bg)'
                }}
              >
                {'關閉'}
              </button>
            </>
          )}

          {!hasErrors && hasWarnings && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg cursor-pointer
                           transition-colors border"
                style={{
                  color: 'var(--color-text-secondary)',
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-surface)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--color-bg)'
                }}
              >
                {'取消'}
              </button>
              <button
                onClick={onRunAnyway}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg cursor-pointer
                           transition-colors border-none"
                style={{ background: 'var(--color-yellow)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                {'仍然執行'}
              </button>
            </>
          )}

          {allPassed && (
            <button
              onClick={onRunAnyway}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg cursor-pointer
                         transition-colors border-none"
              style={{ background: 'var(--color-green)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              {'執行'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
