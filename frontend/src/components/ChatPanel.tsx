import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, ChevronDown, ChevronRight, Wrench, Bot, User } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import type { ChatMessage } from '../store/useAppStore'

function MessageBubble({ message }: { message: ChatMessage }) {
  const { toggleMessageCollapse } = useAppStore()

  if (message.role === 'tool') {
    return (
      <div className="flex justify-start mb-3">
        <div
          className="max-w-[85%] rounded-lg overflow-hidden"
          style={{
            border: '1px solid var(--color-green)',
            borderRadius: 'var(--radius)',
          }}
        >
          <button
            onClick={() => toggleMessageCollapse(message.id)}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium
                       cursor-pointer border-none text-left"
            style={{
              background: '#E8F5E9',
              color: 'var(--color-text)',
            }}
          >
            <Wrench size={14} style={{ color: 'var(--color-green)' }} />
            <span className="flex-1">{message.toolName ?? 'Tool Call'}</span>
            {message.isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>
          {!message.isCollapsed && (
            <div
              className="px-3 py-2 text-xs font-mono whitespace-pre-wrap"
              style={{
                background: '#F9FBF9',
                color: 'var(--color-text-secondary)',
                borderTop: '1px solid var(--color-green)',
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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className="flex items-start gap-2 max-w-[85%]">
        {!isUser && (
          <div
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <Bot size={14} style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        )}
        <div
          className="px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            background: isUser ? 'var(--color-blue)' : 'var(--color-bg)',
            color: isUser ? '#FFFFFF' : 'var(--color-text)',
            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            border: isUser ? 'none' : '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {message.content}
        </div>
        {isUser && (
          <div
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
            style={{ background: 'var(--color-blue)' }}
          >
            <User size={14} style={{ color: '#FFFFFF' }} />
          </div>
        )}
      </div>
    </div>
  )
}

/** Parse a raw SSE chunk into individual events. */
function parseSSE(raw: string): Array<{ event: string; data: string }> {
  const events: Array<{ event: string; data: string }> = []
  const blocks = raw.split(/\n\n/)
  for (const block of blocks) {
    if (!block.trim()) continue
    let event = 'message'
    let data = ''
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) data += (data ? '\n' : '') + line.slice(5).trim()
    }
    if (data) events.push({ event, data })
  }
  return events
}

export default function ChatPanel() {
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
                  result: unknown
                }
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

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE blocks (separated by double newline)
        const lastDoubleNewline = buffer.lastIndexOf('\n\n')
        if (lastDoubleNewline === -1) continue

        const complete = buffer.slice(0, lastDoubleNewline + 2)
        buffer = buffer.slice(lastDoubleNewline + 2)

        processEvents(parseSSE(complete))
      }

      // Process any remaining data left in the buffer after the stream ends
      if (buffer.trim()) {
        processEvents(parseSSE(buffer))
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

  const sendDisabled = isStreaming || !input.trim()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center px-4 h-9 text-xs font-medium border-b shrink-0"
        style={{
          color: 'var(--color-text-secondary)',
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface)',
        }}
      >
        <Bot size={14} className="mr-1.5" />
        AI Chat
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ background: 'var(--color-surface)' }}
            >
              <Bot size={24} style={{ color: 'var(--color-blue)' }} />
            </div>
            <p
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--color-text)' }}
            >
              AI PLC Assistant
            </p>
            <p
              className="text-xs max-w-[200px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Ask me to generate, explain, or debug your PLC code.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && (
          <div className="flex justify-start mb-3">
            <div className="flex items-center gap-2 px-3 py-2 text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Loader2 size={14} className="animate-spin" />
              <span>AI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="shrink-0 p-3 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div
          className="flex items-end gap-2 rounded-xl p-1"
          style={{
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="輸入訊息..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent border-none outline-none px-3 py-2 text-sm"
            style={{
              color: 'var(--color-text)',
              fontFamily: "'Inter', sans-serif",
              maxHeight: '120px',
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
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                       transition-colors cursor-pointer border-none"
            style={{
              background: sendDisabled ? 'var(--color-border)' : 'var(--color-blue)',
              opacity: sendDisabled ? 0.5 : 1,
            }}
          >
            {isStreaming ? (
              <Loader2 size={14} className="animate-spin" style={{ color: '#FFFFFF' }} />
            ) : (
              <Send size={14} style={{ color: '#FFFFFF' }} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
