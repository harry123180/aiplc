import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Send,
  Loader2,
  ChevronDown,
  ChevronRight,
  Wrench,
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  PanelRight,
  Lightbulb,
} from 'lucide-react'
import useAppStore from '../store/useAppStore'
import type { ChatMessage, CanvasComponent } from '../store/useAppStore'

/* ─── Props accepted from ChatDock ──────────────────────── */
interface ChatPanelProps {
  onClose?: () => void
  onToggleFullscreen?: () => void
  onCollapse?: (() => void) | undefined
  fullscreen?: boolean
}

/**
 * Apply an MCP tool result to the Canvas/Editor Zustand store.
 * Called when a `tool_result` SSE event arrives so that canvas operations
 * made by the AI agent are reflected in the UI — not just shown as chat cards.
 */
function applyToolResult(toolName: string, result: Record<string, unknown>) {
  if (!result || typeof result !== 'object') return

  const store = useAppStore.getState()

  switch (toolName) {
    case 'canvas_add_component': {
      if (result.success && result.component_id) {
        store.addCanvasComponent({
          id: result.component_id as string,
          type: (result.component_type as string) || 'unknown',
          x: (result.x as number) ?? 100,
          y: (result.y as number) ?? 100,
          properties: (result.properties as Record<string, unknown>) || {},
        })
      }
      break
    }
    case 'canvas_add_wire': {
      if (result.success && result.wire_id) {
        store.addCanvasWire({
          id: result.wire_id as string,
          fromComponent: (result.from_component as string) || '',
          fromPin: (result.from_pin as string) || '',
          toComponent: (result.to_component as string) || '',
          toPin: (result.to_pin as string) || '',
        })
      }
      break
    }
    case 'canvas_remove': {
      if (result.success && result.element_id) {
        const elementId = result.element_id as string
        if (result.element_type === 'wire') {
          store.removeCanvasWire(elementId)
        } else if (result.element_type === 'component') {
          store.removeCanvasComponent(elementId)
        } else {
          // Fallback: try both
          store.removeCanvasComponent(elementId)
          store.removeCanvasWire(elementId)
        }
      }
      break
    }
    case 'editor_set_code': {
      if (result.success && typeof result.code === 'string') {
        store.setCode(result.code)
      }
      break
    }
    default:
      // Other tools (component_list, component_info, io_mapping_*, etc.)
      // are read-only or don't need frontend state changes.
      break
  }
}

/* ─── Context-aware suggestion chips ───────────────────── */
function getSuggestions(components: CanvasComponent[], code: string, messages: ChatMessage[]): string[] {
  // No conversation yet → starter suggestions
  if (messages.length === 0) {
    return ['設計馬達控制迴路', '幫我放置元件', '解釋 PLC 掃描週期', '生成範例程式']
  }

  // Has components but no code → suggest code generation
  if (components.length > 0 && code.includes('// 在這裡寫控制邏輯')) {
    return ['根據線路圖生成程式碼', '檢查接線', '解釋元件功能']
  }

  // Has code and components → suggest verification
  if (components.length > 0 && !code.includes('// 在這裡寫控制邏輯')) {
    return ['檢查電路', '優化程式碼', '新增功能', '解釋控制邏輯']
  }

  // Default
  return ['放置元件', '生成程式碼', '檢查電路', '解釋邏輯']
}

/* ─── Message bubble ────────────────────────────────────── */
function MessageBubble({ message, maxWidth }: { message: ChatMessage; maxWidth?: string }) {
  const { toggleMessageCollapse } = useAppStore()

  if (message.role === 'tool') {
    return (
      <div style={{ display: 'flex', marginBottom: 10 }}>
        <div
          className="tool-card"
          style={{
            border: '1px solid #bcd2f5',
            borderRadius: 'var(--qp-r-md)',
            overflow: 'hidden',
            maxWidth: maxWidth ?? '90%',
            borderLeft: '3px solid var(--qp-success)',
          }}
        >
          <button
            onClick={() => toggleMessageCollapse(message.id)}
            className="tc-head"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 11px',
              fontSize: 12,
              fontWeight: 600,
              background: 'var(--qp-bg-tint)',
              color: 'var(--qp-primary)',
              cursor: 'pointer',
              border: 'none',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <Wrench size={13} style={{ color: 'var(--qp-primary)' }} />
            <span style={{ flex: 1 }}>{message.toolName ?? 'Tool Call'}</span>
            {message.isCollapsed ? (
              <ChevronRight size={13} style={{ color: 'var(--qp-primary)' }} />
            ) : (
              <ChevronDown size={13} style={{ color: 'var(--qp-primary)' }} />
            )}
          </button>
          {!message.isCollapsed && (
            <div
              className="tc-body"
              style={{
                padding: '8px 11px',
                fontFamily: 'var(--qp-font-mono)',
                fontSize: 11,
                color: 'var(--qp-text-muted)',
                background: '#fbfdff',
                borderTop: '1px solid #e0eafc',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
              }}
            >
              {message.content}
            </div>
          )}
        </div>
      </div>
    )
  }

  const isUser = message.role === 'user'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        gap: 8,
        marginBottom: 12,
      }}
    >
      {!isUser && (
        <div
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--qp-bg-tint)',
            border: '1px solid #cfe0f5',
          }}
        >
          <Sparkles size={15} style={{ color: 'var(--qp-primary)' }} />
        </div>
      )}
      <div
        className={isUser ? 'bubble-user' : 'bubble-ai'}
        style={{
          whiteSpace: 'pre-wrap',
          background: isUser ? 'var(--qp-primary)' : 'var(--qp-surface)',
          color: isUser ? '#fff' : 'var(--qp-text)',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          border: isUser ? 'none' : '1px solid var(--qp-border)',
          padding: '9px 13px',
          fontSize: 13,
          lineHeight: 1.55,
          maxWidth: maxWidth ?? '85%',
          boxShadow: 'var(--qp-shadow-sm)',
        }}
      >
        {message.content}
      </div>
    </div>
  )
}

/** Parse a raw SSE chunk into individual events.
 *  Handles both \n\n and \r\n\r\n as block delimiters (sse-starlette may use either). */
function parseSSE(raw: string): Array<{ event: string; data: string }> {
  const events: Array<{ event: string; data: string }> = []
  // Split on double newline — supports \n\n, \r\n\r\n, and mixed
  const blocks = raw.split(/\r?\n\r?\n/)
  for (const block of blocks) {
    if (!block.trim()) continue
    let event = 'message'
    let data = ''
    // Split lines within a block — supports both \n and \r\n
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) data += (data ? '\n' : '') + line.slice(5).trim()
    }
    if (data) events.push({ event, data })
  }
  return events
}

export default function ChatPanel({
  onClose,
  onToggleFullscreen,
  onCollapse,
  fullscreen = false,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const {
    messages,
    addMessage,
    updateLastAssistantMessage,
    isStreaming,
    setStreaming,
    components,
    wires,
    code,
  } = useAppStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    addMessage({ role: 'user', content: text })
    setInput('')

    // Build message history for the API (only user/assistant roles)
    const history = [
      ...useAppStore.getState().messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content })),
    ]

    // Add empty assistant message that we will stream into
    addMessage({ role: 'assistant', content: '' })
    setStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          canvas_state: {
            components,
            wires,
            code,
          },
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errText = await response.text()
        updateLastAssistantMessage(`Error: ${response.status} - ${errText}`)
        setStreaming(false)
        return
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      /** Process parsed SSE events, with try/catch around each JSON.parse. */
      const processEvents = (events: Array<{ event: string; data: string }>) => {
        for (const evt of events) {
          try {
            switch (evt.event) {
              case 'content': {
                const parsed = JSON.parse(evt.data) as { content: string }
                console.log(`[AIPLC SSE] content event: "${parsed.content.slice(0, 80)}"`)
                updateLastAssistantMessage(parsed.content)
                break
              }
              case 'tool_calls': {
                const calls = JSON.parse(evt.data) as Array<{
                  id: string
                  function: { name: string; arguments: string }
                }>
                for (const call of calls) {
                  addMessage({
                    role: 'tool',
                    content: call.function.arguments,
                    toolName: `Calling: ${call.function.name}`,
                    toolCallId: call.id,
                    isCollapsed: false,
                  })
                }
                break
              }
              case 'tool_result': {
                const result = JSON.parse(evt.data) as {
                  tool_call_id: string
                  name: string
                  result: Record<string, unknown>
                }
                // Apply the tool result to the Canvas/Editor store
                applyToolResult(result.name, result.result)
                // Also show it in the chat as a collapsible card
                addMessage({
                  role: 'tool',
                  content: JSON.stringify(result.result, null, 2),
                  toolName: `Result: ${result.name}`,
                  toolCallId: result.tool_call_id,
                  isCollapsed: true,
                })
                break
              }
              case 'error': {
                const err = JSON.parse(evt.data) as { error: string }
                updateLastAssistantMessage(`\n\nError: ${err.error}`)
                break
              }
              case 'done': {
                // Streaming complete
                break
              }
            }
          } catch (parseErr) {
            console.warn('Failed to parse SSE event:', evt, parseErr)
          }
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        console.log(`[AIPLC SSE] chunk received, length=${chunk.length}, buffer length=${buffer.length}`)

        // Process complete SSE blocks (separated by double newline).
        // Support both \n\n and \r\n\r\n as block delimiters.
        const lastDoubleNewline = Math.max(
          buffer.lastIndexOf('\n\n'),
          buffer.lastIndexOf('\r\n\r\n'),
        )
        if (lastDoubleNewline === -1) continue

        // Find the actual end of the delimiter (could be 2 or 4 chars)
        const delimiterEnd =
          buffer.indexOf('\r\n\r\n', lastDoubleNewline) === lastDoubleNewline
            ? lastDoubleNewline + 4
            : lastDoubleNewline + 2

        const complete = buffer.slice(0, delimiterEnd)
        buffer = buffer.slice(delimiterEnd)

        const events = parseSSE(complete)
        console.log(`[AIPLC SSE] parsed ${events.length} event(s)`)
        processEvents(events)
      }

      // Process any remaining data left in the buffer after the stream ends
      if (buffer.trim()) {
        const events = parseSSE(buffer)
        console.log(`[AIPLC SSE] final buffer: parsed ${events.length} event(s)`)
        processEvents(events)
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        updateLastAssistantMessage('\n\n(cancelled)')
      } else {
        updateLastAssistantMessage(
          `\n\nConnection error: ${err instanceof Error ? err.message : String(err)}`
        )
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [
    input,
    isStreaming,
    addMessage,
    updateLastAssistantMessage,
    setStreaming,
    components,
    wires,
    code,
  ])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestions = useMemo(
    () => getSuggestions(components, code, messages),
    [components.length, code, messages.length]
  )

  const sendDisabled = isStreaming || !input.trim()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--qp-bg-alt)',
      }}
    >
      {/* ── Header ───────────────────────────────────── */}
      <div
        className="panel-head"
        style={{
          background: 'var(--qp-navy-800)',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--qp-border)',
          height: 42,
          padding: '0 12px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: 'var(--qp-grad-cta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={13} color="#fff" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span
              className="qp-eyebrow"
              style={{ fontSize: 9 }}
            >
              AI ASSISTANT
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              PLC 設計助手
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {onCollapse && (
            <button
              className="qp-icon-btn"
              style={{
                width: 28,
                height: 28,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--qp-text-dim)',
              }}
              onClick={onCollapse}
              title="縮起 AI Chat"
            >
              <PanelRight size={15} />
            </button>
          )}
          {onToggleFullscreen && (
            <button
              className="qp-icon-btn"
              style={{
                width: 28,
                height: 28,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--qp-text-dim)',
              }}
              onClick={onToggleFullscreen}
              title={fullscreen ? '退出全螢幕' : '全螢幕'}
            >
              {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          )}
          {onClose && (
            <button
              className="qp-icon-btn"
              style={{
                width: 28,
                height: 28,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--qp-text-dim)',
              }}
              onClick={onClose}
              title="關閉 AI Chat"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          minHeight: 0,
        }}
      >
        <div style={{ maxWidth: fullscreen ? 760 : '100%', margin: '0 auto' }}>
          {messages.length === 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: 200,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'var(--qp-grad-cta)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                  boxShadow: 'var(--qp-shadow-sm)',
                }}
              >
                <Sparkles size={24} color="#fff" />
              </div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--qp-text)',
                  marginBottom: 4,
                }}
              >
                PLC 設計助手
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--qp-text-muted)',
                  maxWidth: 220,
                }}
              >
                描述你的控制需求，或請 AI 修改線路與程式...
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              maxWidth={fullscreen ? '80%' : '85%'}
            />
          ))}

          {isStreaming && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  color: 'var(--qp-text-muted)',
                }}
              >
                <Loader2
                  size={14}
                  style={{ animation: 'qp-spin 1s linear infinite' }}
                />
                <span>AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input area ───────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          padding: '10px 14px',
          borderTop: '1px solid var(--qp-border)',
          background: 'var(--qp-bg)',
        }}
      >
        {/* Suggestion chips */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 9, flexWrap: 'wrap' }}>
          {suggestions.map((s) => (
            <button
              key={s}
              className="qp-chip"
              onClick={() => setInput(s)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 11px',
                borderRadius: 'var(--qp-r-pill)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                border: '1px solid var(--qp-border)',
                background: 'var(--qp-bg)',
                color: 'var(--qp-text-body)',
                transition: 'all var(--qp-dur-fast) var(--qp-ease)',
              }}
            >
              <Lightbulb size={12} style={{ color: 'var(--qp-primary-light)' }} />
              {s}
            </button>
          ))}
        </div>

        {/* Text input + send */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            padding: 6,
            borderRadius: 'var(--qp-r-lg)',
            border: '1.5px solid var(--qp-border)',
            background: 'var(--qp-surface)',
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你的控制需求，或請 AI 修改線路與程式..."
            rows={1}
            disabled={isStreaming}
            style={{
              flex: 1,
              resize: 'none',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'var(--qp-font-sans)',
              fontSize: 13,
              color: 'var(--qp-text)',
              padding: '6px 8px',
              maxHeight: 120,
              minHeight: 32,
              cursor: 'text',
            }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={handleSend}
            disabled={sendDisabled}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 'var(--qp-r-sm)',
              border: 'none',
              background: sendDisabled ? 'var(--qp-border)' : 'var(--qp-primary)',
              borderColor: 'transparent',
              cursor: sendDisabled ? 'default' : 'pointer',
              transition: 'background var(--qp-dur-fast) var(--qp-ease)',
              opacity: sendDisabled ? 0.6 : 1,
            }}
          >
            {isStreaming ? (
              <Loader2
                size={15}
                color="#fff"
                style={{ animation: 'qp-spin 1s linear infinite' }}
              />
            ) : (
              <Send size={15} color="#fff" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
