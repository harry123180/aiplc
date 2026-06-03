import Editor from '@monaco-editor/react'
import useAppStore from '../store/useAppStore'

export default function EditorPanel() {
  const { code, setCode } = useAppStore()

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center px-4 h-9 text-xs font-medium border-b shrink-0"
        style={{
          color: 'var(--color-text-secondary)',
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface)',
        }}
      >
        main.c
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language="c"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value ?? '')}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            bracketPairColorization: { enabled: true },
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'off',
          }}
        />
      </div>
    </div>
  )
}
