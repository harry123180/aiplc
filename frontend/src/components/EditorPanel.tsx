import Editor from '@monaco-editor/react'
import type { OnMount } from '@monaco-editor/react'
import { useRef } from 'react'
import type { IDisposable, languages, editor, Position, CancellationToken } from 'monaco-editor'
import useAppStore from '../store/useAppStore'

const handleEditorDidMount: OnMount = (editor, monaco) => {
  // ---------- aiplc.h function completions ----------
  const aiplcFunctions = [
    // Digital I/O
    {
      label: 'DI_Read',
      detail: 'bool DI_Read(int channel)',
      documentation: '讀取數位輸入（0-15），回傳 bool',
      insertText: 'DI_Read(${1:channel})',
    },
    {
      label: 'DO_Write',
      detail: 'void DO_Write(int channel, bool value)',
      documentation: '寫入數位輸出（0-15）',
      insertText: 'DO_Write(${1:channel}, ${2:value})',
    },
    {
      label: 'DO_Toggle',
      detail: 'void DO_Toggle(int channel)',
      documentation: '切換數位輸出',
      insertText: 'DO_Toggle(${1:channel})',
    },
    // Analog Input
    {
      label: 'AI_Read',
      detail: 'int AI_Read(int channel)',
      documentation: '讀取類比輸入，回傳 0-4095（12-bit）',
      insertText: 'AI_Read(${1:channel})',
    },
    {
      label: 'AI_ReadVoltage',
      detail: 'float AI_ReadVoltage(int channel)',
      documentation: '讀取類比輸入電壓，回傳 0.0-10.0V',
      insertText: 'AI_ReadVoltage(${1:channel})',
    },
    {
      label: 'AI_ReadCurrent',
      detail: 'float AI_ReadCurrent(int channel)',
      documentation: '讀取類比輸入電流，回傳 4.0-20.0mA',
      insertText: 'AI_ReadCurrent(${1:channel})',
    },
    // Analog Output
    {
      label: 'AO_Write',
      detail: 'void AO_Write(int channel, uint16_t value)',
      documentation: '寫入類比輸出 0-4095',
      insertText: 'AO_Write(${1:channel}, ${2:value})',
    },
    {
      label: 'AO_WriteVoltage',
      detail: 'void AO_WriteVoltage(int channel, float voltage)',
      documentation: '以電壓值寫入類比輸出',
      insertText: 'AO_WriteVoltage(${1:channel}, ${2:voltage})',
    },
    // Timer
    {
      label: 'Timer_Start',
      detail: 'void Timer_Start(int id, uint32_t ms)',
      documentation: '啟動計時器',
      insertText: 'Timer_Start(${1:id}, ${2:ms})',
    },
    {
      label: 'Timer_Done',
      detail: 'bool Timer_Done(int id)',
      documentation: '計時器是否到時，回傳 bool',
      insertText: 'Timer_Done(${1:id})',
    },
    {
      label: 'Timer_Reset',
      detail: 'void Timer_Reset(int id)',
      documentation: '重置計時器',
      insertText: 'Timer_Reset(${1:id})',
    },
    {
      label: 'Timer_Elapsed',
      detail: 'uint32_t Timer_Elapsed(int id)',
      documentation: '取得已經過的毫秒數',
      insertText: 'Timer_Elapsed(${1:id})',
    },
    // Counter
    {
      label: 'Counter_Reset',
      detail: 'void Counter_Reset(int id)',
      documentation: '重置計數器',
      insertText: 'Counter_Reset(${1:id})',
    },
    {
      label: 'Counter_Up',
      detail: 'void Counter_Up(int id)',
      documentation: '計數器加一',
      insertText: 'Counter_Up(${1:id})',
    },
    {
      label: 'Counter_Down',
      detail: 'void Counter_Down(int id)',
      documentation: '計數器減一',
      insertText: 'Counter_Down(${1:id})',
    },
    {
      label: 'Counter_Value',
      detail: 'int32_t Counter_Value(int id)',
      documentation: '取得計數器值',
      insertText: 'Counter_Value(${1:id})',
    },
    {
      label: 'Counter_Done',
      detail: 'bool Counter_Done(int id, int32_t preset)',
      documentation: '計數器是否達到預設值',
      insertText: 'Counter_Done(${1:id}, ${2:preset})',
    },
    // Serial / Modbus
    {
      label: 'Serial_Print',
      detail: 'void Serial_Print(const char* fmt, ...)',
      documentation: '輸出除錯訊息到 Serial Monitor',
      insertText: 'Serial_Print("${1:msg}"${2})',
    },
    {
      label: 'Modbus_Init',
      detail: 'void Modbus_Init(uint8_t slaveAddr, long baud)',
      documentation: '初始化 Modbus 通訊',
      insertText: 'Modbus_Init(${1:slaveAddr}, ${2:baud})',
    },
    // User-implemented callbacks
    {
      label: 'PLC_Init',
      detail: 'void PLC_Init(void)',
      documentation: '使用者實作：初始化（開機執行一次）',
      insertText: 'PLC_Init()',
    },
    {
      label: 'PLC_Scan',
      detail: 'void PLC_Scan(void)',
      documentation: '使用者實作：掃描週期（每 ~10ms 執行一次）',
      insertText: 'PLC_Scan()',
    },
  ]

  // ---------- common C / aiplc types ----------
  const aiplcTypes = [
    { label: 'bool', documentation: '布林型別（true / false）' },
    { label: 'uint8_t', documentation: '無號 8-bit 整數（0-255）' },
    { label: 'uint16_t', documentation: '無號 16-bit 整數（0-65535）' },
    { label: 'int32_t', documentation: '有號 32-bit 整數' },
    { label: 'uint32_t', documentation: '無號 32-bit 整數' },
  ]

  // ---------- code snippets ----------
  const aiplcSnippets = [
    {
      label: 'plcinit',
      detail: 'PLC_Init 範本',
      documentation: '產生 PLC_Init 初始化函式範本',
      insertText: [
        'void PLC_Init(void) {',
        '\t// 初始化數位輸出',
        '\tDO_Write(${1:0}, false);',
        '\t// 初始化計時器',
        '\tTimer_Reset(${2:0});',
        '\t// 初始化計數器',
        '\tCounter_Reset(${3:0});',
        '\tSerial_Print("PLC Init done");',
        '}',
      ].join('\n'),
    },
    {
      label: 'plcscan',
      detail: 'PLC_Scan 範本',
      documentation: '產生 PLC_Scan 掃描週期函式範本',
      insertText: [
        'void PLC_Scan(void) {',
        '\t// 讀取輸入',
        '\tbool input = DI_Read(${1:0});',
        '\t',
        '\t// 處理邏輯',
        '\tif (input) {',
        '\t\tDO_Write(${2:0}, true);',
        '\t}',
        '}',
      ].join('\n'),
    },
    {
      label: 'motorcontrol',
      detail: '馬達正反轉控制範本',
      documentation: '產生馬達正轉/反轉互鎖控制範本',
      insertText: [
        '// 馬達正反轉控制（互鎖）',
        'bool btn_fwd = DI_Read(${1:0});  // 正轉按鈕',
        'bool btn_rev = DI_Read(${2:1});  // 反轉按鈕',
        'bool btn_stop = DI_Read(${3:2}); // 停止按鈕',
        '',
        'if (btn_stop) {',
        '\tDO_Write(${4:0}, false); // 正轉輸出 OFF',
        '\tDO_Write(${5:1}, false); // 反轉輸出 OFF',
        '} else if (btn_fwd && !btn_rev) {',
        '\tDO_Write(${4:0}, true);  // 正轉 ON',
        '\tDO_Write(${5:1}, false); // 反轉 OFF（互鎖）',
        '} else if (btn_rev && !btn_fwd) {',
        '\tDO_Write(${4:0}, false); // 正轉 OFF（互鎖）',
        '\tDO_Write(${5:1}, true);  // 反轉 ON',
        '}',
      ].join('\n'),
    },
    {
      label: 'timerdelay',
      detail: '計時器延時模式範本',
      documentation: '產生 Timer 延時觸發模式範本（TON）',
      insertText: [
        '// 計時器延時模式（TON）',
        'if (DI_Read(${1:0})) {',
        '\tTimer_Start(${2:0}, ${3:1000}); // 延時 ${3:1000} ms',
        '} else {',
        '\tTimer_Reset(${2:0});',
        '}',
        '',
        'if (Timer_Done(${2:0})) {',
        '\tDO_Write(${4:0}, true); // 延時到達，輸出 ON',
        '}',
      ].join('\n'),
    },
  ]

  const provideCompletionItems = (model: editor.ITextModel, position: Position, _context: languages.CompletionContext, _token: CancellationToken): languages.ProviderResult<languages.CompletionList> => {
    const word = model.getWordUntilPosition(position)
    const range = new monaco.Range(
      position.lineNumber,
      word.startColumn,
      position.lineNumber,
      word.endColumn,
    )

    const functionSuggestions = aiplcFunctions.map((fn) => ({
      label: fn.label,
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: fn.insertText,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: fn.documentation,
      detail: fn.detail,
      range,
    }))

    const typeSuggestions = aiplcTypes.map((t) => ({
      label: t.label,
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: t.label,
      documentation: t.documentation,
      detail: 'aiplc type',
      range,
    }))

    const snippetSuggestions = aiplcSnippets.map((s) => ({
      label: s.label,
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: s.insertText,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: s.documentation,
      detail: s.detail,
      range,
    }))

    return { suggestions: [...functionSuggestions, ...typeSuggestions, ...snippetSuggestions] }
  }

  // Register and store disposable so we can clean up if needed
  const disposable = monaco.languages.registerCompletionItemProvider('c', {
    provideCompletionItems,
  })

  // Store disposable on the editor instance for potential cleanup
  ;(editor as unknown as Record<string, IDisposable>).__aiplcCompletionDisposable = disposable
}

export default function EditorPanel() {
  const { code, setCode } = useAppStore()
  const disposableRef = useRef<IDisposable | null>(null)

  const onMount: OnMount = (editor, monaco) => {
    // Dispose previous provider if component re-mounts
    if (disposableRef.current) {
      disposableRef.current.dispose()
      disposableRef.current = null
    }

    handleEditorDidMount(editor, monaco)

    // Keep reference to the disposable for cleanup
    disposableRef.current = (editor as unknown as Record<string, IDisposable>).__aiplcCompletionDisposable ?? null
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center px-4 h-9 text-xs font-medium border-b shrink-0"
        style={{
          color: 'var(--code-text, #d6e2f5)',
          borderColor: 'var(--qp-border, #e5e7eb)',
          background: 'var(--code-bg, #0b1a30)',
        }}
      >
        main.c
      </div>
      <div className="flex-1 min-h-0" style={{ background: 'var(--code-bg, #0b1a30)' }}>
        <Editor
          height="100%"
          language="c"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value ?? '')}
          onMount={onMount}
          options={{
            fontSize: 14,
            fontFamily: "var(--qp-font-mono, 'JetBrains Mono'), 'Fira Code', Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            bracketPairColorization: { enabled: true },
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'off',
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
          }}
        />
      </div>
    </div>
  )
}
