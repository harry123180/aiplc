import { useState, useRef, useEffect } from 'react'
import { Send, ChevronDown, ChevronRight, Wrench, Bot, User } from 'lucide-react'
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

export default function ChatPanel() {
  const [input, setInput] = useState('')
  const { messages, addMessage } = useAppStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return

    addMessage({ role: 'user', content: text })
    setInput('')

    // Simulate assistant response
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content:
          'I can help you with your PLC program. What would you like to do?',
      })
    }, 600)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

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
            placeholder="Type a message..."
            rows={1}
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
            disabled={!input.trim()}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                       transition-colors cursor-pointer border-none"
            style={{
              background: input.trim() ? 'var(--color-blue)' : 'var(--color-border)',
              opacity: input.trim() ? 1 : 0.5,
            }}
          >
            <Send size={14} style={{ color: '#FFFFFF' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
