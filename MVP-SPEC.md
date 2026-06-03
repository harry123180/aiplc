# AIPLC MVP 規格書

> 2026-06-03 需求採訪確認

---

## 目標用戶

| 用戶 | 需求重點 |
|------|---------|
| 工控初學者 / 學生 | 簡單引導、範例豐富、AI 手把手教學 |
| 工控工程師 | 快速原型驗證、AI 加速開發 |
| 課程教學 | 老師教學用、作業範本、未來擴充課堂管理 |

---

## 技術架構

```
┌─ Frontend（全新 React + Vite + TS）──────────────────────┐
│                                                          │
│  ┌────────────────┐  ┌──────────────────────────────┐    │
│  │  Monaco Editor  │  │  AI Chat Panel               │    │
│  │  (C code)       │  │  ├ 接線指導                   │    │
│  │  + aiplc.h      │  │  ├ C 程式生成                 │    │
│  │    autocomplete │  │  ├ 錯誤檢查                   │    │
│  │                 │  │  └ MCP tool calls             │    │
│  └────────┬────────┘  └──────────────┬───────────────┘    │
│           │                          │                    │
│  ┌────────┴──────────────────────────┴───────────────┐    │
│  │              Canvas（線路圖 + 模擬執行）           │    │
│  │  元件拖拉 | 接線 | GPIO 狀態即時更新               │    │
│  └───────────────────────┬───────────────────────────┘    │
│                          │                                │
│  ┌───────────────────────┴───────────────────────────┐    │
│  │  Zustand Store                                     │    │
│  │  boards[] | components[] | wires[] | ioMapping[]   │    │
│  └───────────────────────┬───────────────────────────┘    │
└──────────────────────────┼────────────────────────────────┘
                           │ WebSocket + REST
┌──────────────────────────┴────────────────────────────────┐
│  Backend（FastAPI + Python）                               │
│                                                            │
│  POST /api/compile     C → ELF（STM32duino / arm-gcc）     │
│  WS   /api/simulate    QEMU STM32 worker（libqemu-arm）    │
│  POST /api/agent/chat  LiteLLM proxy → ai.qianpro.shop    │
│  MCP  /api/mcp/*       MCP Server（操作 Canvas/Editor）     │
└────────────────────────────────────────────────────────────┘
```

---

## 核心決策

### 1. 程式語言：C（非 Ladder / ST）
- LLM 生成 C 的品質遠超 Ladder / ST
- Velxio 已有完整 C 編譯 + STM32 QEMU 鏈路
- 不需自建 Ladder 編輯器或 ST 解譯器

### 2. LLM 整合：LiteLLM proxy
- Endpoint: `ai.qianpro.shop`（已部署，需 API key）
- 內網可走: `http://tsic-m8s 或 DGX/5090 的 LiteLLM port`
- 統一介面支援多模型

### 3. MCP 整合：後端 MCP Server（全功能）

| MCP Tool | 功能 |
|----------|------|
| `canvas_add_component` | 在 Canvas 放置元件（指定類型、位置） |
| `canvas_add_wire` | 連接兩個元件的腳位 |
| `canvas_remove` | 移除元件或線路 |
| `canvas_get_state` | 讀取目前線路圖狀態（元件 + 接線） |
| `editor_set_code` | 寫入 / 覆蓋 Monaco Editor 的 C code |
| `editor_get_code` | 讀取目前 Editor 的程式碼 |
| `component_list` | 查詢可用元件清單（名稱、腳位、描述） |
| `component_info` | 查詢特定元件的詳細腳位定義 |
| `io_mapping_set` | 設定 I/O 映射表（DI0="啟動按鈕"） |
| `io_mapping_get` | 讀取目前的 I/O 映射表 |
| `compile_and_run` | 編譯目前程式碼並啟動 QEMU 模擬 |
| `simulation_stop` | 停止模擬 |

### 4. 前端：全新 React + Vite
- 不 fork Velxio，從零建立（從 Velxio 抄需要的元件）
- UI 風格：Google Slides 風 — 純白底、左對齊、Material 四色（藍 #4285F4、紅 #EA4335、黃 #FBBC04、綠 #34A853）
- 字型：Google Sans / Inter

### 5. 認證：MVP 不需要登入

### 6. 上線策略：直接上線，bug 用 Gitea issue 追蹤

---

## 部署資訊

| 服務 | URL | Port | 位置 |
|------|-----|------|------|
| AIPLC MVP | aiplc.qianpro.shop | 3120 | tsic-m8s Docker |
| Velxio 參考 | velxio.qianpro.shop | 3110 | tsic-m8s Docker |
| LiteLLM | ai.qianpro.shop | — | DGX/5090 (待確認) |
| Git Repo | tsic-m8s:3000/harry123180/aiplc | — | tsic-m8s Gitea |
| CF Tunnel | qianpro-tunnel (3306d6d6) | — | tsic-m8s cloudflared |

---

## UI 佈局

```
┌─────────────────────────────────────────────────────────────┐
│  AIPLC                                    [Settings] [Run]  │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│  Monaco Editor       │  AI Chat                             │
│  (C code)            │  ┌──────────────────────────────┐    │
│                      │  │ User: 幫我做一個馬達正反轉   │    │
│  #include "aiplc.h"  │  │ 控制，有啟動停止按鈕         │    │
│                      │  │                              │    │
│  void PLC_Scan() {   │  │ Agent: 好的，我來配置...     │    │
│    bool start = ...  │  │ [calling canvas_add_comp...] │    │
│    ...               │  │ [calling editor_set_code...] │    │
│  }                   │  │                              │    │
│                      │  │ ✅ 已放置 5 個元件並接線     │    │
│                      │  │ ✅ 程式碼已生成              │    │
│                      │  │ 按 Run 開始模擬              │    │
│                      │  └──────────────────────────────┘    │
│                      │  [輸入訊息...]            [Send]     │
├──────────────────────┴──────────────────────────────────────┤
│                                                             │
│  Canvas（線路圖 + 模擬狀態）                                │
│  ┌─────┐    ┌─────────┐    ┌─────────┐    ┌──────┐        │
│  │ BTN │────│ PLC CPU │────│ Contactor│────│Motor │        │
│  │START│    │ F405    │    │  KM1     │    │ 3-ph │        │
│  └─────┘    └─────────┘    └─────────┘    └──────┘        │
│                                                             │
│  Serial Monitor: Motor Control Ready                        │
│                  Forward running...                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 工控元件庫（MVP 第一批）

| 元件 | 類型 | 腳位 |
|------|------|------|
| PLC CPU F405 | 板子 | DI0-DI7, DO0-DO7, AI0-AI3, AO0-AO1, VCC, GND |
| 按鈕 NO | 輸入 | COM, NO |
| 按鈕 NC | 輸入 | COM, NC |
| 指示燈 | 輸出 | A, K（紅/黃/綠可選色） |
| 繼電器 | 輸出 | COIL+, COIL-, COM, NO, NC |
| 接觸器 3相 | 輸出 | COIL+, COIL-, L1, L2, L3, T1, T2, T3 |
| 馬達 3相 | 負載 | U, V, W |
| 熱過載繼電器 | 保護 | L1-L3, T1-T3, NC, NO |
| 急停按鈕 | 安全 | NC1, NC2 |
| 近接開關 PNP | 感測 | +V, OUT, GND |

---

## PLC HAL API（aiplc.h）

```c
// 數位 I/O
bool DI_Read(int channel);           // 讀取數位輸入 0-15
void DO_Write(int channel, bool v);  // 寫入數位輸出 0-15

// 類比 I/O
uint16_t AI_Read(int channel);       // 讀取類比輸入 0-4095
void AO_Write(int channel, uint16_t val);

// 計時器
void Timer_Start(int id, uint32_t ms);
bool Timer_Done(int id);
void Timer_Reset(int id);

// 計數器
void Counter_Reset(int id);
void Counter_Up(int id);
int32_t Counter_Value(int id);

// 通訊
void Serial_Print(const char* fmt, ...);

// 使用者實作
void PLC_Init(void);   // 初始化（開機執行一次）
void PLC_Scan(void);   // 掃描週期（每 ~10ms 執行一次）
```
