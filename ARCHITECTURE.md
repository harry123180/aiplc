# AIPLC - 自有品牌 PLC 模擬器架構規劃

## 目標
基於 Velxio 開源版，開發自有品牌的 PLC 模擬器產品：
- **C 語言開發**（非 Ladder/ST，方便 LLM 生成程式碼）
- STM32-based 控制器硬體模擬
- AI Agent：電氣線路指導 + C 程式自動生成
- 授權：待取得 Velxio 商業授權

---

## 核心設計決策：為什麼用 C 語言

```
傳統 PLC 程式語言           本專案選擇
┌─────────────┐            ┌──────────────────────────┐
│ Ladder (LD) │            │                          │
│ ST          │  ──捨棄──→ │  C 語言（STM32duino/HAL）  │
│ FBD         │            │                          │
│ IL / SFC    │            └──────────────────────────┘
└─────────────┘

理由：
  1. LLM（Claude/GPT）生成 C 的品質遠超 Ladder/ST
  2. Velxio 已有完整 C 編譯鏈（STM32duino + arduino-cli）
  3. QEMU STM32 worker 直接跑 C 編譯出的 ELF
  4. 不需要自己寫 Ladder 編輯器或 ST 解譯器 → 省掉最大的開發量
  5. 學習門檻：懂 C 的人比懂 Ladder 的人多
  6. 現成的 Arduino/STM32 生態系可以直接用
```

---

## 一、架構總覽（C 語言版）

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite + TS)               │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌────────────┐  │
│  │ Canvas   │  │ Monaco   │  │ Component │  │ AI Chat    │  │
│  │ (接線圖) │  │ (C 編輯) │  │ Picker    │  │ Panel      │  │
│  │          │  │          │  │ (工控元件) │  │ (Agent UI) │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └─────┬──────┘  │
│       │              │              │              │         │
│  ┌────┴──────────────┴──────────────┴──────────────┴───────┐ │
│  │              Zustand Store (useSimulatorStore)           │ │
│  │  boards[] | components[] | wires[] | ioMapping[]        │ │
│  └────┬──────────┬──────────────┬────────────────────┬─────┘ │
│       │          │              │                    │       │
│  ┌────┴────┐ ┌───┴────┐ ┌──────┴──────┐  ┌──────────┴────┐ │
│  │ STM32   │ │ Part   │ │Interconnect │  │    SPICE      │ │
│  │ Bridge  │ │Registry│ │(PLC↔I/O)    │  │  (電路模擬)   │ │
│  │ (WS)    │ │(工控)  │ │             │  │  (ngspice)    │ │
│  └────┬────┘ └────────┘ └─────────────┘  └───────────────┘ │
└───────┼──────────────────────────────────────────────────────┘
        │ WebSocket
┌───────┴──────────────────────────────────────────────────────┐
│                   Backend (FastAPI + Python)                   │
│                                                               │
│  ┌────────────┐  ┌───────────┐  ┌──────────┐  ┌───────────┐  │
│  │ C Compiler │  │ QEMU      │  │ I2C/SPI  │  │ AI Agent  │  │
│  │ (STM32duino│  │ STM32     │  │ Slaves   │  │ (Claude   │  │
│  │  /arm-gcc) │  │ Worker    │  │(sensors) │  │  API)     │  │
│  └────────────┘  └───────────┘  └──────────┘  └───────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### 與原版 Velxio 的關鍵差異

| 面向 | Velxio 原版 | AIPLC |
|------|------------|-------|
| 目標用戶 | Arduino/嵌入式 Maker | 工控/PLC 學習者 & 工程師 |
| 程式語言 | Arduino C++ / MicroPython | **C（STM32duino 或 HAL）** |
| 開發板 | 19 種（Uno, Pico, ESP32...） | **1-3 種自訂品牌 PLC 模組** |
| 元件庫 | 48+ 電子元件 | **工控元件（DI/DO、電磁閥、VFD...）** |
| 模擬引擎 | avr8js + rp2040js + QEMU | **只用 QEMU STM32（libqemu-arm）** |
| 編輯器 | Monaco（Arduino sketch） | **Monaco（C + PLC HAL API 自動完成）** |
| AI 功能 | 無 | **接線指導 + 程式生成 Agent** |
| 編譯器 | arduino-cli + ESP-IDF | **arduino-cli（STM32duino core）** |

---

## 二、Velxio 模組複用地圖（C 語言路線）

### ✅ 直接沿用（核心省力點）

| 模組 | 路徑 | 說明 |
|------|------|------|
| **C 編譯管線** | `backend/app/services/arduino_cli.py` | STM32duino FQBN 已支援，直接編譯 C → ELF |
| **QEMU STM32 Worker** | `backend/app/services/stm32_worker.py` | libqemu-arm 載入 ELF，GPIO/UART/I2C 事件回傳 |
| **STM32 Lib Manager** | `backend/app/services/stm32_lib_manager.py` | subprocess 管理、UART 緩衝、事件派發 |
| **STM32 Bridge** | `frontend/src/simulation/Stm32Bridge.ts` | WebSocket 前後端通訊，GPIO/Serial 回調 |
| **Monaco Editor** | 已整合 | C 語言語法高亮已內建 |
| **Canvas + Wire** | `components/simulator/` | SVG 畫布、正交佈線、waypoint 編輯 |
| **PinManager** | `simulation/PinManager.ts` | GPIO 狀態追蹤 |
| **I2CBusManager** | `simulation/I2CBusManager.ts` | I2C 匯流排 + 虛擬裝置 |
| **SPICE 引擎** | `simulation/spice/` | ngspice WASM 電路模擬 |
| **WebSocket 協議** | `api/routes/simulation.py` | JSON envelope，STM32 message types 已定義 |
| **Docker 部署** | `Dockerfile.standalone` | 已含 STM32duino core 安裝 |
| **Serial Monitor** | `SerialMonitor.tsx` | printf 除錯輸出 |
| **專案格式** | `utils/vlxFile.ts` | JSON 序列化 boards+components+wires+code |

### 🔧 需要改裝

| 模組 | 改什麼 |
|------|--------|
| **BoardKind** | 去掉 Arduino/ESP32/Pi，加入自訂 PLC 型號 |
| **Board SVG** | 畫 PLC CPU 模組和 I/O 模組的外觀 |
| **元件庫 metadata** | 替換為工控元件（按鈕、指示燈、電磁閥、VFD...） |
| **Part Registry** | 新增工控元件的模擬邏輯 |
| **Interconnect** | 改為 PLC CPU ↔ I/O 模組的匯流排通訊 |
| **Store** | 加 I/O 映射表（C 變數 ↔ 實體腳位） |
| **主題/品牌** | Logo、配色、Landing Page |

### ❌ 可以直接刪除

| 模組 | 原因 |
|------|------|
| AVRSimulator / avr8js | 不需要 Arduino Uno 模擬 |
| RP2040Simulator / rp2040js | 不需要 Pico 模擬 |
| ESP32 Bridge / ESP32 Worker | 不需要 ESP32 |
| RaspberryPi3 Bridge | 不需要 Pi |
| MicroPython Loader | 不需要 Python |
| Wokwi Elements (大部分) | 替換為工控元件 |
| Classroom / Auth overlay | 不需要（自己做） |
| ESP-IDF Compiler | 不需要 |

---

## 三、PLC C 語言 HAL API 設計

使用者在 Monaco 裡寫的 C 程式碼會用到這套 API，AI Agent 也會生成這套 API 的程式碼。

```c
// ═══════════════════════════════════════
// AIPLC HAL — PLC Hardware Abstraction Layer
// 基於 STM32duino，封裝為 PLC 風格 API
// ═══════════════════════════════════════

#include "aiplc.h"

// ── 數位 I/O ──────────────────────────
bool DI_Read(int channel);           // 讀取數位輸入（0-15）
void DO_Write(int channel, bool v);  // 寫入數位輸出（0-15）
void DO_Toggle(int channel);         // 切換數位輸出

// ── 類比 I/O ──────────────────────────
uint16_t AI_Read(int channel);       // 讀取類比輸入 0-4095（12-bit）
float AI_ReadVoltage(int channel);   // 讀取電壓 0.0-10.0V
float AI_ReadCurrent(int channel);   // 讀取電流 4.0-20.0mA
void AO_Write(int channel, uint16_t val);  // 寫入類比輸出 0-4095
void AO_WriteVoltage(int channel, float v); // 寫入電壓 0.0-10.0V

// ── 計時器 ────────────────────────────
void Timer_Start(int id, uint32_t ms);  // 啟動計時器
bool Timer_Done(int id);                // 計時器到時？
void Timer_Reset(int id);               // 重置計時器
uint32_t Timer_Elapsed(int id);         // 已經過的毫秒

// ── 計數器 ────────────────────────────
void Counter_Reset(int id);
void Counter_Up(int id);
void Counter_Down(int id);
int32_t Counter_Value(int id);
bool Counter_Done(int id, int32_t preset);

// ── 串列通訊 ─────────────────────────
void Serial_Print(const char* fmt, ...);    // printf 到 Serial Monitor
void Modbus_Init(uint8_t slaveAddr, long baud);
void Modbus_WriteCoil(uint16_t addr, bool val);
bool Modbus_ReadCoil(uint16_t addr);

// ── PLC 掃描週期 ─────────────────────
// 使用者不需要寫 setup/loop，框架會處理
void PLC_Init(void);    // 使用者實作：初始化
void PLC_Scan(void);    // 使用者實作：每個掃描週期執行一次（~10ms）

// ═══════════════════════════════════════
// 範例：三相馬達正反轉控制
// ═══════════════════════════════════════
//
//  DI0: 啟動按鈕    DO0: 正轉接觸器 (KM1)
//  DI1: 停止按鈕    DO1: 反轉接觸器 (KM2)
//  DI2: 正轉選擇    DO2: 運轉指示燈
//  DI3: 反轉選擇    DO3: 故障指示燈
//  DI4: 過載保護

void PLC_Init() {
    Serial_Print("Motor Control Ready\n");
}

void PLC_Scan() {
    bool start   = DI_Read(0);
    bool stop    = DI_Read(1);
    bool fwd_sel = DI_Read(2);
    bool rev_sel = DI_Read(3);
    bool overload = DI_Read(4);

    static bool running = false;
    static bool forward = true;

    // 過載或停止 → 立即停機
    if (overload || stop) {
        running = false;
        DO_Write(0, false);  // KM1 off
        DO_Write(1, false);  // KM2 off
        DO_Write(3, overload); // 故障燈
    }
    // 啟動
    else if (start && !running) {
        forward = fwd_sel && !rev_sel;
        running = true;
        DO_Write(0, forward);   // KM1
        DO_Write(1, !forward);  // KM2
    }

    DO_Write(2, running);  // 運轉指示燈
}
```

### 編譯流程

```
使用者寫 C code (Monaco)
    │
    ▼
前端 POST /api/compile
    │  files: [{name: "plc_program.c", content: "..."}]
    │  board_fqbn: "STMicroelectronics:stm32:GenF4:pnum=GENERIC_F405RGTX"
    ▼
後端 arduino-cli compile
    │  自動注入 aiplc.h（PLC HAL 標頭檔）
    │  自動注入 main.cpp（呼叫 PLC_Init + PLC_Scan loop）
    ▼
產出 ELF binary
    │
    ▼
WebSocket → stm32_worker.py → libqemu-arm
    │  QEMU 載入 ELF，開始模擬 STM32F405
    │  GPIO 事件回傳前端
    ▼
前端更新 Canvas 元件狀態
    （指示燈亮、馬達轉、電磁閥動作...）
```

**關鍵：aiplc.h 是整個系統的膠水層**
- 使用者只看到 `DI_Read()` / `DO_Write()` 等 PLC 風格 API
- 底層映射到 STM32 HAL 的 `HAL_GPIO_ReadPin()` / `HAL_GPIO_WritePin()`
- AI Agent 只需要知道這套 API 就能生成正確的程式碼

---

## 四、AI Agent 設計

### Agent 1：電氣線路指導

```
使用者輸入：「我要控制一個三相馬達正反轉，有啟動停止按鈕和過載保護」

Agent 輸出（結構化 JSON）：
{
  "components": [
    {"id": "plc-cpu", "type": "plc-f405", "x": 300, "y": 100},
    {"id": "btn-start", "type": "plc-pushbutton-no", "x": 50, "y": 100},
    {"id": "btn-stop", "type": "plc-pushbutton-nc", "x": 50, "y": 160},
    {"id": "sel-fwd", "type": "plc-selector-2pos", "x": 50, "y": 220},
    {"id": "sel-rev", "type": "plc-selector-2pos", "x": 50, "y": 280},
    {"id": "relay-ol", "type": "plc-thermal-overload", "x": 50, "y": 340},
    {"id": "km1", "type": "plc-contactor-3phase", "x": 550, "y": 100},
    {"id": "km2", "type": "plc-contactor-3phase", "x": 550, "y": 220},
    {"id": "motor", "type": "plc-motor-3phase", "x": 700, "y": 160},
    {"id": "lamp-run", "type": "plc-indicator-green", "x": 550, "y": 340},
    {"id": "lamp-fault", "type": "plc-indicator-red", "x": 620, "y": 340}
  ],
  "wires": [
    {"from": "btn-start.NO", "to": "plc-cpu.DI0"},
    {"from": "btn-stop.NC", "to": "plc-cpu.DI1"},
    {"from": "sel-fwd.COM", "to": "plc-cpu.DI2"},
    {"from": "sel-rev.COM", "to": "plc-cpu.DI3"},
    {"from": "relay-ol.NC", "to": "plc-cpu.DI4"},
    {"from": "plc-cpu.DO0", "to": "km1.COIL+"},
    {"from": "plc-cpu.DO1", "to": "km2.COIL+"},
    {"from": "plc-cpu.DO2", "to": "lamp-run.A"},
    {"from": "plc-cpu.DO3", "to": "lamp-fault.A"},
    {"from": "km1.L1", "to": "motor.U"},
    {"from": "km1.L2", "to": "motor.V"},
    {"from": "km1.L3", "to": "motor.W"}
  ],
  "ioMapping": {
    "DI0": "啟動按鈕 (NO)",
    "DI1": "停止按鈕 (NC)",
    "DI2": "正轉選擇",
    "DI3": "反轉選擇",
    "DI4": "過載保護 (NC)",
    "DO0": "正轉接觸器 KM1",
    "DO1": "反轉接觸器 KM2",
    "DO2": "運轉指示燈",
    "DO3": "故障指示燈"
  },
  "safety_notes": [
    "KM1 和 KM2 不可同時動作（機械互鎖 + 電氣互鎖）",
    "過載保護必須串接在主迴路中",
    "急停按鈕建議使用 NC 接點（斷線安全）"
  ]
}
```

前端解析這個 JSON → 自動建立 components[] + wires[] → Canvas 顯示完整接線圖。

### Agent 2：C 程式生成

```
輸入：上面的 ioMapping + 使用者描述
       「馬達啟動延遲5秒後正轉，正反轉切換需要先停止等2秒」

輸出：完整的 C 程式碼（使用 AIPLC HAL API）

→ 自動載入到 Monaco Editor
→ 使用者按 Run → 編譯 → QEMU 模擬
→ Canvas 上的元件跟著動
```

### Agent 系統 Prompt 設計重點

```
你是 AIPLC 電氣工程 AI 助手。

可用的 PLC HAL API：
  DI_Read(ch), DO_Write(ch, val), AI_Read(ch), AO_Write(ch, val)
  Timer_Start(id, ms), Timer_Done(id), Timer_Reset(id)
  Counter_Reset(id), Counter_Up(id), Counter_Value(id)
  Serial_Print(fmt, ...)

可用的元件類型：
  [從 component-metadata.json 動態注入]

接線規則：
  - DI 接 NO/NC 接點（24VDC sink/source）
  - DO 接繼電器/接觸器線圈或指示燈
  - AI 接 4-20mA 或 0-10V 感測器
  - AO 接 VFD 速度指令或比例閥

安全規則：
  - 急停必須使用硬接線（不經過 PLC）
  - 互鎖必須同時有電氣互鎖和機械互鎖
  - 過載保護必須在主迴路
```

---

## 五、開發階段（C 語言路線 — 大幅簡化）

### Phase 1：最小可用版（2-3 週）
```
□ Fork Velxio，刪除 AVR/RP2040/ESP32/Pi 相關程式碼
□ 保留 STM32 全鏈路（編譯 + QEMU + Bridge）
□ 換品牌（AIPLC logo、工控配色）
□ 定義 PLC BoardKind（1 個自訂 CPU 模組）
□ 畫 PLC CPU 模組 SVG + Web Component
□ 建立 5 個基本工控元件：
    - 按鈕（NO/NC）
    - 指示燈（紅/黃/綠）
    - 繼電器
□ 寫 aiplc.h（PLC HAL 標頭檔）
□ 寫 main.cpp wrapper（呼叫 PLC_Init + PLC_Scan）
□ Monaco Editor 加 aiplc.h 的自動完成
□ 驗證：寫 C → 編譯 → QEMU 跑 → GPIO 控制指示燈
□ 部署到 aiplc.qianpro.shop
```

### Phase 2：工控元件庫 + I/O 模組（2-3 週）
```
□ DI/DO 擴充模組（8/16 點）Web Component
□ AI/AO 擴充模組（4 通道）
□ 近接開關（PNP/NPN）
□ 電磁閥（2位3通、2位5通）
□ 接觸器（3相）
□ 馬達（單相/三相，含旋轉動畫）
□ 熱過載繼電器
□ 急停按鈕
□ I/O 映射面板（DI0="啟動按鈕" 的對照表 UI）
□ 類比信號模擬（SPICE 整合）
```

### Phase 3：AI Agent（2-3 週）
```
□ 後端 Claude API proxy（/api/agent/chat）
□ 前端 AI Chat Panel（側邊欄）
□ 接線指導 Agent：描述需求 → JSON → 自動放置元件 + 接線
□ 程式生成 Agent：描述邏輯 → C code → 載入 Monaco
□ 錯誤檢查 Agent：分析接線 → 安全建議
□ Agent 記憶 I/O 映射表，跨對話保持上下文
```

### Phase 4：進階（持續迭代）
```
□ 編譯 libqemu-arm（完整 STM32 GPIO 模擬）
□ Modbus RTU/TCP 模擬
□ VFD 變頻器元件 + SPICE 模型
□ HMI 面板設計器
□ 專案範本庫（馬達控制、溫控、流水線...）
□ 多用戶 + 教室功能
□ 手機版 RWD
```

---

## 六、檔案對應速查表

| AIPLC 需求 | Velxio 對應檔案 | 動作 |
|---|---|---|
| PLC 型號定義 | `frontend/src/types/board.ts` | 改 BoardKind 為 `'aiplc-f405'` |
| PLC 外觀 | `frontend/src/components/velxio-components/` | 新增 `AiplcF405Element.ts` |
| 工控元件 metadata | `scripts/component-overrides.json` | 替換為 PLC 元件定義 |
| 工控元件模擬 | `frontend/src/simulation/parts/` | 新增 `PlcParts.ts` |
| 接線系統 | `components/simulator/WireLayer.tsx` | 保留，改配色 |
| 畫布 | `components/simulator/SimulatorCanvas.tsx` | 保留 |
| 狀態管理 | `store/useSimulatorStore.ts` | 改裝（去掉 Arduino 邏輯） |
| C 編譯 | `backend/app/services/arduino_cli.py` | 沿用（STM32duino FQBN） |
| QEMU STM32 | `backend/app/services/stm32_lib_manager.py` | 沿用 |
| STM32 Worker | `backend/app/services/stm32_worker.py` | 沿用 |
| WebSocket | `backend/app/api/routes/simulation.py` | 沿用 STM32 message types |
| I2C/SPI Slaves | `backend/app/services/esp32_i2c_slaves.py` | 沿用 pattern |
| Serial Monitor | `frontend/src/components/SerialMonitor.tsx` | 保留（C 的 printf 輸出） |
| 專案格式 | `frontend/src/utils/vlxFile.ts` | 改副檔名 `.aiplc` |
| **PLC HAL API** | 新建 `backend/app/templates/aiplc.h` | **新增** |
| **main wrapper** | 新建 `backend/app/templates/main.cpp` | **新增** |
| **AI Agent** | 新建 `backend/app/api/routes/agent.py` | **新增** |
| **AI Chat UI** | 新建 `frontend/src/components/AiChatPanel.tsx` | **新增** |
