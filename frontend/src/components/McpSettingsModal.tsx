import { useState } from 'react'
import { X, Server, Key } from 'lucide-react'
import useAppStore from '../store/useAppStore'

export default function McpSettingsModal() {
  const { mcpSettings, setMcpSettings, isMcpModalOpen, setMcpModalOpen } =
    useAppStore()

  const [serverUrl, setServerUrl] = useState(mcpSettings.serverUrl)
  const [apiKey, setApiKey] = useState(mcpSettings.apiKey)

  if (!isMcpModalOpen) return null

  const handleSave = () => {
    setMcpSettings({ serverUrl, apiKey })
    setMcpModalOpen(false)
  }

  const handleClose = () => {
    setServerUrl(mcpSettings.serverUrl)
    setApiKey(mcpSettings.apiKey)
    setMcpModalOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.4)' }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md mx-4"
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
          <h2
            className="text-base font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            MCP Settings
          </h2>
          <button
            onClick={handleClose}
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

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Server URL */}
          <div>
            <label
              className="flex items-center gap-1.5 text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text)' }}
            >
              <Server size={14} style={{ color: 'var(--color-blue)' }} />
              Server URL
            </label>
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://localhost:3000"
              className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontFamily: "'Inter', sans-serif",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-blue)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            />
          </div>

          {/* API Key */}
          <div>
            <label
              className="flex items-center gap-1.5 text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text)' }}
            >
              <Key size={14} style={{ color: 'var(--color-yellow)' }} />
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontFamily: "'Inter', sans-serif",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-blue)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-6 py-4"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            onClick={handleClose}
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
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg cursor-pointer
                       transition-colors border-none"
            style={{ background: 'var(--color-blue)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
