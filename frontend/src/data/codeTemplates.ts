export interface CodeTemplate {
  id: string
  name: string
  description: string
  code: string
}

export const CODE_TEMPLATES: CodeTemplate[] = [
  {
    id: 'blank',
    name: '空白專案',
    description: '只有基本框架',
    code: `#include "aiplc.h"\n\nvoid PLC_Init() {\n    Serial_Print("AIPLC Ready\\n");\n}\n\nvoid PLC_Scan() {\n    // 在這裡寫控制邏輯\n}\n`,
  },
  {
    id: 'button-led',
    name: '按鈕控制 LED',
    description: 'DI0 按鈕控制 DO0 指示燈',
    code: `#include "aiplc.h"\n\nvoid PLC_Init() {\n    Serial_Print("Button-LED Control Ready\\n");\n}\n\nvoid PLC_Scan() {\n    bool button = DI_Read(0);\n    DO_Write(0, button);\n}\n`,
  },
  {
    id: 'motor-fwd-rev',
    name: '馬達正反轉',
    description: '含互鎖、急停、過載保護',
    code: `#include "aiplc.h"\n\nvoid PLC_Init() {\n    Serial_Print("Motor Control Ready\\n");\n}\n\nvoid PLC_Scan() {\n    bool fwd_btn = DI_Read(0);\n    bool rev_btn = DI_Read(1);\n    bool stop_btn = !DI_Read(2);  // NC\n    bool overload = !DI_Read(3);  // NC\n    \n    static bool fwd = false, rev = false;\n    \n    if (stop_btn || overload) { fwd = false; rev = false; }\n    if (fwd_btn && !rev) fwd = true;\n    if (rev_btn && !fwd) rev = true;\n    \n    DO_Write(0, fwd);   // KM1\n    DO_Write(1, rev);   // KM2\n    DO_Write(2, fwd);   // 正轉燈\n    DO_Write(3, rev);   // 反轉燈\n    DO_Write(4, overload); // 故障燈\n}\n`,
  },
  {
    id: 'timer-delay',
    name: '延遲啟動',
    description: '按下按鈕 3 秒後啟動',
    code: `#include "aiplc.h"\n\nvoid PLC_Init() {\n    Serial_Print("Timer Delay Ready\\n");\n}\n\nvoid PLC_Scan() {\n    bool start = DI_Read(0);\n    \n    if (start) {\n        Timer_Start(0, 3000);  // 3 秒延遲\n    }\n    \n    DO_Write(0, Timer_Done(0));\n    \n    if (!start) {\n        Timer_Reset(0);\n    }\n}\n`,
  },
  {
    id: 'counter',
    name: '計數器',
    description: '計數 10 次後動作',
    code: `#include "aiplc.h"\n\nvoid PLC_Init() {\n    Serial_Print("Counter Ready\\n");\n    Counter_Reset(0);\n}\n\nvoid PLC_Scan() {\n    static bool prev = false;\n    bool btn = DI_Read(0);\n    \n    // 上升沿計數\n    if (btn && !prev) Counter_Up(0);\n    prev = btn;\n    \n    // 到 10 次輸出\n    DO_Write(0, Counter_Done(0, 10));\n    Serial_Print("Count: %d\\n", Counter_Value(0));\n    \n    // 重置\n    if (DI_Read(1)) Counter_Reset(0);\n}\n`,
  },
]

export function getTemplate(id: string): CodeTemplate | undefined {
  return CODE_TEMPLATES.find(t => t.id === id)
}
