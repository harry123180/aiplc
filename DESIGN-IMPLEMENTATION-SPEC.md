# AIPLC Editor Redesign — Implementation Specification

> Generated from the Claude Design handoff prototypes in `design-files/aiplc/project/aiplc-editor/`.
> This document maps every design element to the AIPLC (Velxio) codebase and provides
> a concrete, file-by-file implementation plan.

---

## Table of Contents

1. [Design System / Tokens](#1-design-system--tokens)
2. [Layout Architecture (Directions A / B / C)](#2-layout-architecture)
3. [Component Inventory](#3-component-inventory)
4. [Workspace Explorer](#4-workspace-explorer)
5. [Component Library (Circuit side)](#5-component-library-circuit-side)
6. [Chat Dock Behavior](#6-chat-dock-behavior)
7. [File-by-File Implementation Plan](#7-file-by-file-implementation-plan)

---

## 1. Design System / Tokens

The design introduces the **QianPro Industrial Blue** design system. All values are extracted
from `qp-app.css` and must replace or extend the current Velxio dark theme tokens.

### 1.1 Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--qp-primary` | `#1a4fa0` | Brand primary, buttons, active states |
| `--qp-primary-dark` | `#0f3070` | Hover on primary buttons |
| `--qp-primary-light` | `#2d6be4` | Eyebrow labels, links, focus rings |
| `--qp-accent` | `#00c2ff` | Accent highlights, live-dot indicators, energized wires |
| **Navy (dark chrome)** | | |
| `--qp-navy-900` | `#0a1628` | Activity rail background (Direction B) |
| `--qp-navy-800` | `#0d1f3c` | PLC CPU body fill, gradient start |
| `--qp-navy-700` | `#1a3a6e` | Midtone blue |
| `--qp-navy-600` | `#0f2a5a` | Dark chrome |
| **Neutrals** | | |
| `--qp-text` | `#1a1a2e` | Default body text |
| `--qp-text-strong` | `#0d1f3c` | Headings, strong text |
| `--qp-text-body` | `#374151` | Body copy |
| `--qp-text-muted` | `#6b7280` | Secondary labels, rail buttons |
| `--qp-text-dim` | `#9ca3af` | Tertiary/disabled text |
| **Backgrounds** | | |
| `--qp-bg` | `#ffffff` | Panel backgrounds, cards |
| `--qp-bg-alt` | `#f8fafc` | Explorer/library side panels, chat body |
| `--qp-bg-tint` | `#f0f5ff` | Active/hover tint states |
| **Borders** | | |
| `--qp-border` | `#e5e7eb` | Standard borders |
| `--qp-border-strong` | `#d4dae3` | Stronger borders, dashed outlines |
| **Semantic** | | |
| `--qp-error` | `#e53e3e` | Error states, stop button, E-STOP |
| `--qp-warn` | `#f59e0b` | Warnings, relay on-state |
| `--qp-success` | `#22c55e` | Success, run button, motor running |

### 1.2 Gradients

| Token | Value | Usage |
|---|---|---|
| `--qp-grad-cta` | `linear-gradient(135deg, #0d1f3c, #1a4fa0)` | Brand mark background, chat rail icon |
| `--qp-grad-accent` | `linear-gradient(90deg, #00c2ff, #4d9fff)` | Accent gradient (unused in MVP) |
| `--qp-grad-seam` | `linear-gradient(90deg, #1a4fa0, #00c2ff)` | Active file tab top seam (2px) |

### 1.3 Shadows

| Token | Value | Usage |
|---|---|---|
| `--qp-shadow-sm` | `0 2px 16px rgba(10,22,40,0.06)` | Cards, buttons, brand mark |
| `--qp-shadow` | `0 4px 24px rgba(10,22,40,0.08)` | Elevated panels |
| `--qp-shadow-md` | `0 12px 40px rgba(10,22,40,0.14)` | Modals, fullscreen chat |
| `--qp-shadow-glow` | `0 4px 20px rgba(45,107,228,0.4)` | Primary button hover |

### 1.4 Border Radii

| Token | Value | Usage |
|---|---|---|
| `--qp-r-xs` | `6px` | Tiny rounding |
| `--qp-r-sm` | `8px` | Icon buttons, search inputs, rail buttons |
| `--qp-r-md` | `10px` | Standard buttons, segmented control |
| `--qp-r-lg` | `12px` | Chat input container |
| `--qp-r-xl` | `14px` | Larger cards |
| `--qp-r-2xl` | `16px` | Chat bubbles, Direction C rounded panels |
| `--qp-r-pill` | `100px` | Pills, chips, status indicators, brand pill |

### 1.5 Typography

| Token | Value | Usage |
|---|---|---|
| `--qp-font-sans` | `'Inter', 'Noto Sans TC', -apple-system, BlinkMacSystemFont, sans-serif` | UI labels, buttons |
| `--qp-font-zh` | `'Noto Sans TC', 'Inter', sans-serif` | Chinese text fallback |
| `--qp-font-mono` | `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace` | Code editor, pin labels, terminal |
| `--qp-track-label` | `0.15em` | Eyebrow label letter-spacing |

Key font sizes observed:
- Eyebrow labels: `10px`, weight 700, uppercase, letter-spacing `0.15em`
- Panel headers: `12px`, weight 600
- Body text: `13px`, weight 400-500
- Brand "AIPLC": `15px`, weight 700
- Subtitle "千鉑科技": `8.5px`, weight 700, letter-spacing `0.14em`
- Code editor: `13px` (regular), `12px` (compact)
- Code line height: `1.7` (regular), `1.55` (compact)

### 1.6 Motion / Animation

| Token | Value | Usage |
|---|---|---|
| `--qp-ease` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard easing |
| `--qp-dur-fast` | `150ms` | Button hovers, quick transitions |
| `--qp-dur-base` | `200ms` | Standard transitions |
| `--qp-dur-slow` | `320ms` | Fade-in, panel slide |

Named animations:
- `qp-blink` — 1.2s opacity pulse for live indicators
- `qp-pulse-ring` — success-colored ring pulse
- `qp-flow` — stroke-dashoffset animation for energized wires
- `qp-spin` — 360deg rotation for motor indicator
- `qp-fade-in` — opacity + translateY(4px) for panel content entry

### 1.7 Code Editor Theme Tokens

| Token | Value | Usage |
|---|---|---|
| `--code-bg` | `#0b1a30` | Editor background |
| `--code-bg-2` | `#0d2038` | Tab bar background |
| `--code-gutter` | `#5b6b86` | Line numbers |
| `--code-line` | `rgba(255,255,255,0.05)` | Current line highlight |
| `--code-text` | `#d6e2f5` | Default code text |
| `--code-kw` | `#5b9bff` | Keywords (void, bool, if...) |
| `--code-fn` | `#00c2ff` | HAL functions (DI_Read, DO_Write...) |
| `--code-type` | `#6fd3c4` | Types |
| `--code-str` | `#7fd88f` | Strings |
| `--code-num` | `#c7a9ff` | Numbers |
| `--code-com` | `#5b7090` | Comments |
| `--code-punc` | `#9fb2cc` | Punctuation |

### 1.8 Density System

Three density levels, controlled via `data-density` attribute on the app root:

| Density | `--pad-y` | `--row-h` | `--gap` |
|---|---|---|---|
| `compact` | `4px` | `30px` | `6px` |
| `regular` | `7px` | `36px` | `8px` |
| `comfy` | `10px` | `42px` | `12px` |

### 1.9 Scrollbar Styling

- Light chrome: thumb `#c2cbd8`, hover `#9aa6b8`, 9px width, 5px radius, 2px transparent border
- Code/dark surfaces: thumb `#2a3f5e`, same geometry

---

## 2. Layout Architecture

The design offers **three layout directions** (A, B, C) as options the user can switch between.
A floating "Presenter" bar at the bottom allows switching (dev-only in prototype, becomes a
settings option in production).

### 2.1 Direction A — Classic Workbench

```
┌──────────────────────────────────────────────────────────┐
│  Header (h=58px)                                         │
│  [Brand] | [Undo][Redo] ... [Code|Split|Circuit] ... [Settings] [Check][Run][AI] │
├──────────────────────────────────────────────────────────┤
│  ┌─────────┬──────────────────────┬──────┬──────────┐   │
│  │Workspace│  Code Editor         │resize│ Circuit  │   │
│  │Explorer │  (dark bg)           │handle│ Canvas   │   │
│  │(232px)  │                      │(6px) │          │   │
│  │         │                      │      │          │   │
│  ├─────────┴──────────────────────┴──────┴──────────┤   │
│  │  Bottom Dock (Console/Errors/Serial)             │   │
│  └──────────────────────────────────────────────────┘   │
│                                        ┌────────────┐   │
│                              Optional: │  AI Chat   │   │
│                                        │  (right)   │   │
│                                        └────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**Header**: 58px tall, white background, `box-shadow: var(--qp-shadow-sm)`, z-index 20.
- Left: Brand mark (30x30 gradient icon + "AIPLC" / "千鉑科技" text)
- Left center: Undo/Redo icon buttons (32x32, border, `--qp-r-sm`)
- Center: Segmented control (Code/Split/Circuit)
- Right: Settings icon button, then RunControls group (Check button, Run/Stop button, AI toggle button)

**Work area**: Fills remaining height. Contains:
- WorkspaceExplorer (code-side left panel, 232px default, collapsible to 48px rail)
- Code/Split/Circuit content based on segmented control
- AI Chat dock (right/bottom/float, push layout)

**View modes**:
- `code`: Explorer + full-width CodeEditor
- `split`: Explorer (auto-collapses to rail) + Code (48% width) + resize handle + Circuit (rest)
- `circuit`: Full-width CircuitCanvas (with ComponentLibrary panel)

### 2.2 Direction B — Activity Rail

```
┌──────────────────────────────────────────────────────────┐
│ ┌────┬──────────────────────────────────────────────┐    │
│ │Rail│  Breadcrumb header (h=48px)                  │    │
│ │60px│  [專案 > motor_fwd_rev / main.c] ... [Seg] [Run] │
│ │    ├──────────────────────────────────────────────┤    │
│ │ 🔧 │                                              │    │
│ │ 📝 │  Work Area (same as Direction A)             │    │
│ │ ⊞  │                                              │    │
│ │ 📊 │                                              │    │
│ │ I/O│                                              │    │
│ │    │                                              │    │
│ │ ── │                                              │    │
│ │ AI │                                              │    │
│ │ ⚙️ │                                              │    │
│ └────┴──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

**Activity Rail**: 60px wide, `--qp-navy-900` background, dark theme.
- Top: Compact brand mark (icon only, dark variant)
- Items: Files, Code, Split, Circuit, I/O (each 52px tall, `rail-btn` class)
- Active indicator: 3px left border, `--qp-accent` color, rounded right corners
- Bottom: AI toggle, Settings
- Rail text: 9px, weight 600

**Header**: 48px tall, contains breadcrumb path + segmented control + RunControls.

**Work area**: Same WorkArea component as Direction A, just without the outer header.

### 2.3 Direction C — Focus Stage

```
┌──────────────────────────────────────────────────────────┐
│                 ┌───────────────────────┐                │
│  [Brand pill]   │ [Code|Split|Circuit]  │    [AI][Settings]  │
│  (floating)     │ [Check] [Run]         │    (floating)  │
│                 └───────────────────────┘                │
│  ┌──────────────────────────────────┐  ┌────────────┐   │
│  │                                  │  │            │   │
│  │  Work Area (rounded, shadowed)   │  │  AI Chat   │   │
│  │  borderRadius: 16px             │  │  (rounded) │   │
│  │  border + shadow                 │  │            │   │
│  │                                  │  │            │   │
│  └──────────────────────────────────┘  └────────────┘   │
│                                                          │
│  bg: var(--qp-bg-alt)                                    │
└──────────────────────────────────────────────────────────┘
```

**Stage style**: Background `--qp-bg-alt`, content area inset 14px padding.

**Floating elements** use glassmorphism:
- `background: rgba(255,255,255,0.82)`
- `backdrop-filter: blur(12px)`
- `border: 1px solid rgba(255,255,255,0.6)`
- `box-shadow: var(--qp-shadow)`
- `border-radius: var(--qp-r-pill)` for top bar elements

Three floating bars:
1. **Brand pill** (top-left): Brand mark in pill shape
2. **Command pill** (top-center): Segmented control + divider + Check icon + Run button
3. **Action pill** (top-right): AI toggle button + Settings icon

**Work area**: `border-radius: var(--qp-r-2xl)`, `overflow: hidden`, `border: 1px solid var(--qp-border)`, `box-shadow: var(--qp-shadow)`.

**Chat panel** (when right-docked): Also rounded + shadowed, placed in its own padded container.

### 2.4 Segmented Control (Code / Split / Circuit)

The `<Segmented>` component renders three options:

| View | Icon | Label (zh) | Label (en) |
|---|---|---|---|
| `code` | `code` (angle brackets) | 程式碼 | Code |
| `split` | `split` (two rectangles) | 並排 | Split |
| `circuit` | `circuit` (IC symbol) | 線路圖 | Circuit |

Styling (`.qp-seg`):
- Container: inline-flex, 3px padding, `--qp-r-md` radius, `--qp-bg-alt` background, 1px border
- Buttons: 28px height, 13px horizontal padding, 12.5px font, 600 weight, 7px radius
- Active: white background, `--qp-primary` text, `--qp-shadow-sm`
- On dark surfaces (`.on-dark`): semi-transparent white backgrounds

When simulation is running: the Circuit button shows a blinking dot (`live-dot` class, `--qp-accent` color).

**Behavior on simulation start**: Automatically switches to `circuit` view, opens bottom dock, selects `serial` tab.

### 2.5 AI Chat Push-Layout

The chat dock does NOT overlay content — it **pushes** the work area:

**Right position** (default):
- Chat panel width: 380px default, resizable 300-620px via `resize-x` handle (6px wide, col-resize cursor)
- Blue hover highlight: `rgba(45,107,228,0.25)` on drag handle
- Can collapse to a 46px rail (`ChatRail` component): gradient icon + vertical "AI 助手" label + chevron
- Can go fullscreen (modal overlay with backdrop blur)

**Bottom position**:
- Chat height: 300px default, resizable 220-560px via `resize-y` handle
- Same resize highlight color
- Cannot collapse to rail in bottom mode

**Float position**:
- 372x540px floating panel, absolute positioned bottom-right (18px inset)
- Rounded (`--qp-r-2xl`), shadowed (`--qp-shadow-md`), bordered
- Max height: `calc(100% - 36px)`

**Fullscreen mode** (from any position):
- Fixed overlay, `inset: 0`, z-index 8000
- Backdrop: `rgba(10,22,40,0.45)` + `blur(3px)`
- Chat panel: `max-width: 960px`, full height, centered, rounded + shadowed

---

## 3. Component Inventory

### 3.1 Brand Mark (`Brand`)
- **Location**: `workspace.jsx` lines 8-22
- **Appearance**: 30x30 rounded square (8px radius) with `--qp-grad-cta` gradient background. QianPro logo SVG inside (20x20, white via `filter: brightness(0) invert(1)`). Next to it: "AIPLC" (15px, 700 weight) and "千鉑科技" (8.5px, 700 weight, `0.14em` tracking).
- **Variants**: `dark` (white text), `compact` (icon only, no text)
- **Map to**: `velxio/frontend/src/components/layout/AppHeader.tsx` — replace Velxio brand with AIPLC brand

### 3.2 Icon Button (`.qp-icon-btn`)
- **Size**: 32x32, `--qp-r-sm` radius, 1px border `--qp-border`, white bg
- **States**: hover (tint bg, primary text, stronger border), active (tint bg, primary color, blue border `#bcd2f5`), disabled (0.4 opacity)
- **Map to**: New shared component `velxio/frontend/src/components/ui/IconButton.tsx`

### 3.3 Standard Button (`.qp-btn`)
- **Base**: 34px height, 14px horizontal padding, `--qp-r-md` radius, 13px/600 weight
- **Variants**: 
  - Default: white bg, body text, border
  - Primary (`.qp-btn-primary`): `--qp-primary` bg, white text; hover lifts 1px + glow shadow
  - Run (`.qp-btn-run`): `--qp-success` green bg; hover darker green + green glow
  - Stop (`.qp-btn-stop`): `--qp-error` red bg; hover darker red
- **Map to**: Extend `velxio/frontend/src/components/ui/Button.tsx`

### 3.4 Segmented Control (`Segmented`)
- Already described in section 2.4
- **Map to**: New component `velxio/frontend/src/components/ui/SegmentedControl.tsx`

### 3.5 Run Controls (`RunControls`)
- **Location**: `workspace.jsx` lines 46-63
- **Contents**: "檢查" (Check/DRC) button + Run/Stop toggle button + AI toggle button
- **Run button**: Green when idle ("執行"), red when running ("停止模擬")
- **AI button**: Primary style when chat is open, outline when closed
- **Map to**: `velxio/frontend/src/components/editor/EditorToolbar.tsx` — redesign toolbar

### 3.6 Chip / Pill (`.qp-chip`)
- Pill-shaped (100px radius), 12px/500 weight, 4px/11px padding, border + bg
- Used for suggestion buttons in chat, status indicators in bottom dock
- **Map to**: New component `velxio/frontend/src/components/ui/Chip.tsx`

### 3.7 Status Pill (`.status-pill`)
- Pill-shaped, 11px/600 weight, used with `live-dot` for runtime status
- Examples: "Serial 有輸出" (green bg), "QEMU 模擬執行中" (cyan bg), "模擬就緒" (green)
- **Map to**: New component `velxio/frontend/src/components/ui/StatusPill.tsx`

### 3.8 Panel Header (`.panel-head`)
- 38px height, 12px horizontal padding, 1px bottom border, white bg
- 12px/600 weight, muted text color
- Contains optional colored dot (8x8 circle), icons, action buttons
- **Map to**: New component `velxio/frontend/src/components/ui/PanelHeader.tsx`

### 3.9 File Tab (`.file-tab`)
- Full height of parent header, 14px horizontal padding, right border
- 12.5px/600 weight, contains icon + filename + unsaved dot (7px cyan circle)
- Active tab has 2px top gradient seam (`--qp-grad-seam`)
- **Map to**: `velxio/frontend/src/components/editor/FileTabs.tsx` — restyle

### 3.10 Dock Tab (`.dock-tab`)
- 32px height, 14px padding, 12px/600 weight
- 2px transparent bottom border; active: primary color + primary bottom border
- Can show badge (warning count pill)
- **Map to**: `velxio/frontend/src/components/editor/CompilationConsole.tsx` — restyle as BottomDock

### 3.11 Chat Bubbles
- **User** (`.bubble-user`): `--qp-primary` bg, white text, `14px 14px 4px 14px` radius, 13px/1.55 line height, max 85% width
- **AI** (`.bubble-ai`): white bg, border, `14px 14px 14px 4px` radius, 13px/1.6 line height, max 88% width, small shadow
- **Tool call card** (`.tool-card`): bordered, `--qp-r-md` radius, collapsible header (tint bg, primary text) + mono body (`11px`, `#fbfdff` bg)
- **Map to**: New `velxio/frontend/src/components/chat/ChatMessage.tsx`

### 3.12 Chat Panel (`ChatMock`)
- **Header**: Panel header with 22x22 gradient icon + "AI ASSISTANT" eyebrow + "千鉑助手" title + collapse/expand/close buttons
- **Body**: Scrollable message list, max-width 760px in fullscreen
- **Footer**: Suggestion chips row + textarea input (12px radius container, 1.5px border, `--qp-bg-alt`) + send button (34x34, primary bg when text present, border bg when empty)
- **Map to**: New `velxio/frontend/src/components/chat/ChatDock.tsx`

### 3.13 Terminal / Console (`.terminal`)
- `--qp-font-mono`, 12.5px, 1.7 line height, `--code-bg` background, `#cfe0f5` text
- Timestamp class `.ts`: `#5b7090`; `.ok`: green; `.info`: cyan; `.warn`: `#ffce6b`
- **Map to**: `velxio/frontend/src/components/simulator/SerialMonitor.tsx` and `CompilationConsole.tsx` — restyle

### 3.14 Resize Handles
- **Horizontal** (`.resize-x`): 6px wide, col-resize cursor, transparent bg, hover/dragging blue highlight
- **Vertical** (`.resize-y`): 6px tall, row-resize cursor, same blue highlight
- z-index 5
- **Map to**: Utility component `velxio/frontend/src/components/ui/ResizeHandle.tsx`

### 3.15 Eyebrow Label (`.qp-eyebrow`)
- 10px, 700 weight, uppercase, `0.15em` letter-spacing, `--qp-primary-light` color
- Used for section headers: "WORKSPACE", "元件庫 · 48", "AI ASSISTANT"
- **Map to**: CSS utility class in new design tokens

### 3.16 Icon Set
- 30+ icons defined as SVG path data in `mock-ui.jsx` (lines 7-48)
- Stroke-based, 24x24 viewBox, configurable size/color/strokeWidth
- Icons: `code`, `split`, `circuit`, `play`, `stop`, `shield`, `chat`, `settings`, `undo`, `redo`, `x`, `expand`, `shrink`, `chevDown`, `chevRight`, `chevLeft`, `send`, `bot`, `user`, `wrench`, `plus`, `zoomIn`, `zoomOut`, `fit`, `files`, `terminal`, `alert`, `monitor`, `panelRight`, `panelBottom`, `sparkles`, `rotate`, `trash`, `sliders`, `search`, `save`, `cpu`, `io`, `refresh`, `lightbulb`, `book`, `dots`
- **Map to**: New `velxio/frontend/src/components/ui/Icon.tsx` using lucide-react (already stroke-based, same visual language)

---

## 4. Workspace Explorer

### 4.1 Overview

The Workspace Explorer is a **code-side left panel** that mirrors the circuit-side Component Library.
It has two tabs: **Files** (file tree) and **Outline** (subroutine/symbol list).

### 4.2 Panel Structure

**Expanded state** (`.ws-panel`, 232px width):
```
┌─────────────────────────────────┐
│ WORKSPACE              [<]     │  ← Eyebrow + collapse button
│ 🔲 motor_fwd_rev    [PLC]     │  ← Project name + badge
│ ┌─────────┬─────────┐         │
│ │ 📁 檔案 │ 📋 副程式 │         │  ← Tab switcher
│ └─────────┴─────────┘         │
├─────────────────────────────────┤
│  File tree / Outline content   │  ← Scrollable body
│  ...                           │
└─────────────────────────────────┘
```

**Collapsed state** (`.ws-rail`, 48px width):
- Expand chevron button (32x32)
- Files icon button (36x36)
- Outline icon button (36x36)
- Search icon button (36x36)
- All are `.ws-rail-btn`: no border, transparent bg, hover tint + primary color

### 4.3 File Tree Tab

Each file/folder row (`.ws-row`):
- 30px height, left padding based on depth (`12px + depth * 14px`)
- Icon (14px, colored by file type: `.c` = blue `#2d6be4`, `.h` = purple `#7c3aed`, `.cfg` = amber `#f59e0b`)
- Name text: 13px, `--qp-text-body`, ellipsis overflow
- Active file: `--qp-bg-tint` bg, primary color text, 600 weight, 2px left box-shadow inset (`--qp-primary`)
- Unsaved dot: 7px cyan circle (`--qp-accent`)

Folder rows have chevron toggle + folder icon.

**"Add file" button** (`.ws-add`): Dashed border, 30px height, "新增檔案" label, hover turns primary + tint bg.

### 4.4 Outline Tab

**Search bar** (`.ws-search`): 32px height, 1.5px border, 8px radius, search icon + input. Focus: primary-light border.

**Section labels** (`.ws-osec`): 10px, 700 weight, uppercase, `--qp-text-dim`, e.g., "main.c · 函式與副程式", "變數與定義".

**Symbol rows** (`.ws-sym`): 32px height, 14px horizontal padding.
- Badge (`.ws-badge`): 19x19 square, 5px radius, mono font, colored by kind:
  - Function (`fn`): `ƒ` in `#2d6be4` on `#eaf1fd`
  - Subroutine (`sbr`): `⊂` in `#0077a3` on `#e6f7fd`
  - Variable (`var`): `x` in `#15803d` on `#eafaf0`
  - Define (`def`): `#` in `#b45309` on `#fff7ed`
- Name: 12.5px mono font, ellipsis
- Signature: 10.5px mono, dim color
- Active: tint bg + 2px left primary inset shadow

### 4.5 Auto-collapse Behavior

When `view` switches to `split`, the workspace explorer auto-collapses to its rail to save space.
When switching to `code`, it expands back.

### 4.6 Map to Existing Files

- **Modify**: `velxio/frontend/src/components/editor/FileExplorer.tsx` — completely redesign to match
- **New**: `velxio/frontend/src/components/editor/SymbolOutline.tsx` — outline/subroutine panel
- **Modify**: `velxio/frontend/src/pages/EditorPage.tsx` — integrate new panel, auto-collapse logic

---

## 5. Component Library (Circuit side)

### 5.1 Overview

The Component Library is a **dockable panel on the left side of the circuit canvas**.
It replaces the current `ComponentPickerModal` with an always-visible, searchable catalog.

### 5.2 Panel Structure

**Expanded state** (`.lib-panel`, 224px width):
```
┌─────────────────────────────────┐
│ 元件庫 · 48           [<]     │  ← Eyebrow + count + collapse
│ 🔍 搜尋元件…                   │  ← Search input
│ ┌───────┬────────┐             │
│ │  全部  │ 💡常用  │             │  ← Filter tabs (all / favorites)
│ └───────┴────────┘             │
├─────────────────────────────────┤
│ ▼ 🔧 控制器              (5)  │  ← Category group header
│   [icon] PLC CPU F405          │  ← Component item
│          26 pin                │
│   [icon] PLC CPU F407          │
│          34 pin                │
│ ▼ 📥 輸入元件            (6)  │
│   ...                          │
│ ► 📤 輸出元件            (6)  │  ← Collapsed group
│ ► 🛡 保護 / 安全         (5)  │
│ ...                            │
├─────────────────────────────────┤
│ ➕ 點擊或拖曳至畫布放置         │  ← Footer
└─────────────────────────────────┘
```

**Collapsed state** (`.lib-rail`, 48px width):
- Expand chevron (32x32)
- Category icon buttons (36x36 each) for quick access
- Click any icon: expands panel + opens that category

### 5.3 Component Catalog

9 categories with 48 total items (in prototype):

| Category | Icon | Items | Color |
|---|---|---|---|
| 控制器 (Controllers) | `cpu` | PLC CPU F405, F407, DI/DO/AI-AO modules | `#1a4fa0` |
| 輸入元件 (Inputs) | `io` | Buttons NO/NC, switches, limit switches | `#64748b` |
| 輸出元件 (Outputs) | `lightbulb` | LEDs, buzzer, relays, contactors, solenoids, 7-seg | `#22c55e` / `#f59e0b` |
| 保護/安全 (Safety) | `shield` | E-STOP, thermal relay, breaker, fuse, safety door | `#e53e3e` |
| 感測器 (Sensors) | `search` | Proximity PNP/NPN, photoelectric, PT100, pressure, encoder | `#0077a3` |
| 負載/馬達 (Loads) | `refresh` | 3-phase motor, stepper, servo, heater | `#1a4fa0` |
| 電源 (Power) | `play` | 24V/5V DC, GND, transformer | `#e53e3e` |
| 通訊 (Comm) | `monitor` | Modbus RTU, RS-485, CAN bus | `#7c3aed` |
| 被動元件 (Passive) | `dots` | Resistor, capacitor, diode, terminal | `#5c6bc0` |

### 5.4 Component Item (`.lib-item`)

- 34x34 thumbnail (`.lib-thumb`): border, rounded, colored tint background (`color + '14'` hex alpha)
- Contains SVG mini-symbol (`MiniSymbol` component, 28x28)
- Name: 12.5px/500 weight, ellipsis
- Pin count: 10.5px mono, dim
- Plus icon: appears on hover (add to canvas)
- Cursor: `grab` (drag to canvas)

### 5.5 Search & Filter

- **Search input** (`.lib-search`): 34px height, 1.5px border, search icon + text input + clear button
- Focus state: primary-light border color
- Searches both item names and category names
- **Tabs**: "全部" (all) / "常用" (favorites, items with `fav: true`)
- **Empty state**: centered text "找不到「{query}」相關元件"

### 5.6 Category Groups

- **Header** (`.lib-group-head`): 11px uppercase bold, chevron toggle + category icon + name + count badge
- Count badge (`.lib-count`): 10px/700, border bg pill
- Click: toggles open/close for that category
- When searching: all matching categories auto-open

### 5.7 Map to Existing Files

- **Modify**: `velxio/frontend/src/components/simulator/ComponentPalette.tsx` — redesign as dockable library
- **Delete (eventually)**: `velxio/frontend/src/components/ComponentPickerModal.tsx` — replace with library panel
- **Modify**: `velxio/frontend/src/components/simulator/SimulatorCanvas.tsx` — integrate library panel in circuit layout
- **New**: `velxio/frontend/src/components/simulator/ComponentLibrary.tsx` — new dockable panel
- **New**: `velxio/frontend/src/components/simulator/ComponentCatalog.ts` — catalog data structure

---

## 6. Chat Dock Behavior

### 6.1 Architecture

The AI Chat is a **dock** that can be positioned right, bottom, or floating. It is NOT an overlay —
it pushes the main content area to make room.

### 6.2 State

```typescript
interface ChatDockState {
  open: boolean;           // Chat visible at all
  position: 'right' | 'bottom' | 'float';  // Dock position
  collapsed: boolean;      // Right-only: collapsed to 46px rail
  fullscreen: boolean;     // Fullscreen modal mode
  width: number;           // Right dock width (default 380, range 300-620)
  height: number;          // Bottom dock height (default 300, range 220-560)
}
```

### 6.3 Push Layout (Right Position)

When the chat opens on the right:
1. The work area (code + circuit) shrinks by `chatWidth` pixels
2. A 6px `resize-x` handle appears between work area and chat
3. Dragging the handle resizes the chat (min 300, max 620)
4. The collapse button (panelRight icon) shrinks chat to a 46px rail

**Chat Rail** (`.chat-rail`, 46px width):
- Vertical layout: gradient icon (30x30) + vertical "AI 助手" text (12px, 700 weight, `writing-mode: vertical-rl`) + left chevron
- `border-left: 1px solid var(--qp-border)`
- Click anywhere to expand

### 6.4 Push Layout (Bottom Position)

When the chat opens on the bottom:
1. A `resize-y` handle appears above the chat
2. Chat height is adjustable (min 220, max 560)
3. No collapse-to-rail in this mode

### 6.5 Float Position

- Absolute positioned: `right: 18px, bottom: 18px`
- Fixed size: 372x540px
- Rounded corners (`--qp-r-2xl`), shadow (`--qp-shadow-md`), border
- Does NOT push content

### 6.6 Fullscreen Toggle

Available from any position:
- Overlay: fixed inset 0, z-index 8000
- Backdrop: `rgba(10,22,40,0.45)` + `backdrop-filter: blur(3px)`
- Chat centered: `max-width: 960px`, full height, rounded + shadowed
- Toggle via expand/shrink icon in chat header

### 6.7 Chat Panel Content

**Header** (38px):
- Left: 22x22 gradient icon + "AI ASSISTANT" eyebrow (9px) + "千鉑助手" (13px, 700)
- Right: [Collapse (panelRight)] [Fullscreen (expand/shrink)] [Close (x)] — all 28x28 icon buttons

**Body** (scrollable, `--qp-bg-alt`):
- Messages (user bubbles right-aligned, AI bubbles left-aligned with avatar)
- Tool call cards (collapsible, wrench icon + function name)
- Status pills (green "模擬就緒")

**Footer** (pinned, white bg, top border):
- Suggestion chips row (scrollable, wrapping)
- Input container: 12px radius, 1.5px border, textarea + send button
- Send button: 34x34, primary bg when text present, muted when empty
- Placeholder: "描述你的控制需求，或請 AI 修改線路與程式…"

### 6.8 Map to Existing Files

- **New**: `velxio/frontend/src/components/chat/ChatDock.tsx` — main dock container
- **New**: `velxio/frontend/src/components/chat/ChatRail.tsx` — collapsed rail
- **New**: `velxio/frontend/src/components/chat/ChatPanel.tsx` — chat UI (header + messages + input)
- **New**: `velxio/frontend/src/components/chat/ChatMessage.tsx` — message rendering
- **New**: `velxio/frontend/src/store/useChatStore.ts` — chat state (position, width, collapsed, etc.)
- **Modify**: `velxio/frontend/src/pages/EditorPage.tsx` — integrate chat dock into layout

---

## 7. File-by-File Implementation Plan

### 7.1 Priority Order

| Priority | Area | Effort | Impact |
|---|---|---|---|
| P0 | Design tokens + CSS foundation | Medium | Everything depends on this |
| P1 | Layout restructure (EditorPage) | High | Core architecture change |
| P2 | Workspace Explorer redesign | Medium | Code-side UX |
| P3 | Component Library panel | Medium | Circuit-side UX |
| P4 | Segmented control + view switching | Low | Navigation UX |
| P5 | Bottom Dock redesign | Medium | Console/serial/errors UX |
| P6 | Chat Dock (push layout) | High | AI integration |
| P7 | Brand + header redesign | Low | Visual polish |
| P8 | Simulation mode visuals | Low | Runtime UX |
| P9 | Direction B / C layouts | Low | Optional alternative layouts |

### 7.2 New Files to Create

#### Design System
| File | Purpose |
|---|---|
| `frontend/src/tokens/qp-colors.css` | QianPro color tokens (replace/extend existing `colors.css`) |
| `frontend/src/tokens/qp-typography.css` | Font imports, font stacks, sizes |
| `frontend/src/tokens/qp-shadows.css` | Shadow tokens |
| `frontend/src/tokens/qp-radius.css` | Border radius tokens |
| `frontend/src/tokens/qp-motion.css` | Easing, durations, animations |
| `frontend/src/tokens/qp-density.css` | Density system (`data-density` attribute) |
| `frontend/src/styles/qp-components.css` | Reusable component classes (`.qp-btn`, `.qp-seg`, etc.) |

#### UI Components
| File | Purpose |
|---|---|
| `frontend/src/components/ui/Icon.tsx` | SVG icon component (wrap lucide-react or inline paths) |
| `frontend/src/components/ui/IconButton.tsx` | 32x32 icon button with states |
| `frontend/src/components/ui/SegmentedControl.tsx` | Code/Split/Circuit switcher |
| `frontend/src/components/ui/Chip.tsx` | Pill-shaped suggestion/status chip |
| `frontend/src/components/ui/StatusPill.tsx` | Status indicator with live-dot |
| `frontend/src/components/ui/PanelHeader.tsx` | 38px panel header strip |
| `frontend/src/components/ui/ResizeHandle.tsx` | Draggable resize handle (x/y) |
| `frontend/src/components/ui/EyebrowLabel.tsx` | 10px uppercase section label |

#### Chat
| File | Purpose |
|---|---|
| `frontend/src/components/chat/ChatDock.tsx` | Dock container (right/bottom/float/fullscreen) |
| `frontend/src/components/chat/ChatRail.tsx` | Collapsed 46px rail |
| `frontend/src/components/chat/ChatPanel.tsx` | Full chat UI |
| `frontend/src/components/chat/ChatMessage.tsx` | User/AI/tool message rendering |
| `frontend/src/components/chat/ChatInput.tsx` | Textarea + send button + suggestions |
| `frontend/src/store/useChatStore.ts` | Chat dock state management |

#### Workspace
| File | Purpose |
|---|---|
| `frontend/src/components/editor/SymbolOutline.tsx` | Subroutine/function outline panel |
| `frontend/src/components/editor/WorkspacePanel.tsx` | Combined file tree + outline with tabs |

#### Circuit
| File | Purpose |
|---|---|
| `frontend/src/components/simulator/ComponentLibrary.tsx` | Dockable component library panel |
| `frontend/src/components/simulator/ComponentCatalog.ts` | Category/item data for PLC components |
| `frontend/src/components/simulator/MiniSymbol.tsx` | 28x28 SVG component thumbnails |

### 7.3 Existing Files to Modify

#### Core Layout
| File | Changes |
|---|---|
| `frontend/src/pages/EditorPage.tsx` | **Major rewrite**: Replace current 2-panel layout with 3-direction layout system. Add view mode switcher (code/split/circuit). Integrate chat dock with push layout. Add workspace explorer auto-collapse. Wire up density system. |
| `frontend/src/App.css` | **Major restyle**: Replace dark theme header/panel styles with QianPro light theme. Add all `.qp-*` component classes. Update scrollbar styling. |
| `frontend/src/index.css` | Update root font-family to QianPro stack. Add `@import` for new token files. Change `color-scheme` from `dark` to `light`. |
| `frontend/src/tokens/index.css` | Add imports for all new `qp-*.css` token files. |
| `frontend/src/tokens/colors.css` | Add QianPro color variables alongside existing ones. |

#### Header / Toolbar
| File | Changes |
|---|---|
| `frontend/src/components/layout/AppHeader.tsx` | Replace Velxio brand with AIPLC brand mark. Restructure for Direction A header (undo/redo, segmented control, run controls). Remove GitHub/Discord links from editor view. Height from 44px to 58px. |
| `frontend/src/components/editor/EditorToolbar.tsx` | Redesign as `RunControls` pattern: Check button + Run/Stop toggle + AI toggle. Remove board selector (move to canvas). |

#### Editor Components
| File | Changes |
|---|---|
| `frontend/src/components/editor/FileExplorer.tsx` | **Major rewrite**: Redesign as `WorkspaceExplorer` with file tree + outline tabs, collapsible to rail (48px), styled per design. Width from 165px to 232px. |
| `frontend/src/components/editor/FileTabs.tsx` | Restyle: gradient top seam on active tab, unsaved cyan dot, dark code-editor-colored tab bar. |
| `frontend/src/components/editor/CodeEditor.tsx` | Apply code theme tokens. Update Monaco theme to match `--code-*` variables. |
| `frontend/src/components/editor/CompilationConsole.tsx` | Redesign as `BottomDock` with tabbed interface (Console/Errors/Serial). Resizable height with drag handle. Collapse to 30px status bar. |

#### Circuit / Simulator
| File | Changes |
|---|---|
| `frontend/src/components/simulator/SimulatorCanvas.tsx` | Add circuit toolbar (zoom controls, component count). Integrate `ComponentLibrary` panel on left side. Add simulation status pill overlay. |
| `frontend/src/components/simulator/ComponentPalette.tsx` | Redesign as dockable library or deprecate in favor of new `ComponentLibrary`. |
| `frontend/src/components/simulator/SerialMonitor.tsx` | Restyle as terminal with timestamp + severity coloring matching design. |

#### State
| File | Changes |
|---|---|
| `frontend/src/store/useEditorStore.ts` | Add `viewMode` state (`'code' | 'split' | 'circuit'`), density setting, layout direction preference. (Note: `viewMode` may already exist based on `EditorPage.tsx` line 71.) |
| `frontend/src/store/useSimulatorStore.ts` | Add component library collapsed state, zoom level. |

### 7.4 CSS Migration Strategy

The current Velxio codebase uses a **dark theme** (dark backgrounds, light text). The new QianPro design
uses a **light theme** (white backgrounds, dark text) with a dark code editor surface.

**Migration approach**:
1. Create all new QianPro tokens in separate `qp-*.css` files
2. Add a `data-theme="qianpro"` attribute to toggle between themes
3. Initially keep both themes; default to QianPro for the editor page
4. The code editor retains its dark surface (using `--code-*` tokens)
5. Gradually remove old dark-theme tokens as pages are migrated

### 7.5 Key Behavioral Changes

| Current Behavior | New Behavior |
|---|---|
| Component picker is a modal dialog | Component library is a dockable side panel |
| File explorer is a simple list | Workspace explorer with file tree + symbol outline tabs |
| Serial monitor opens as bottom panel independently | Bottom dock has tabs: Console, Errors, Serial |
| No segmented view switcher | Code / Split / Circuit segmented control |
| Compilation console and serial are separate | Unified bottom dock with tabbed interface |
| No AI chat integration | Full chat dock with push layout, resize, collapse |
| Dark theme everywhere | Light chrome + dark code editor |
| Single layout option | Three layout directions (A/B/C) |
| No density settings | Three density levels (compact/regular/comfy) |

### 7.6 Assets Required

| Asset | Source | Destination |
|---|---|---|
| QianPro logo SVG | `design-files/.../assets/qp-logo.svg` | `frontend/public/qp-logo.svg` |
| Inter font | Google Fonts CDN (already in qp-app.css) | Import in `qp-typography.css` |
| Noto Sans TC | Google Fonts CDN | Import in `qp-typography.css` |
| JetBrains Mono | Google Fonts CDN | Import in `qp-typography.css` |

### 7.7 Implementation Notes

1. **The prototype uses plain React (no build tool)**. All state is via `useState` with abbreviated names (`u`, `useS`, etc.). The production implementation should use proper Zustand stores.

2. **The prototype uses inline styles extensively**. Production should use CSS modules or the existing CSS class pattern with the new QianPro tokens.

3. **The `useDrag` hook** in `workspace.jsx` is a generic mouse-drag utility. Production should use a more robust implementation that handles touch events and pointer capture.

4. **The `TweaksPanel`** (`tweaks-panel.jsx`) is a development-only tool for adjusting design parameters. It should NOT be shipped in production. However, its density and accent-color controls should become proper settings.

5. **The `Presenter` bar** (layout direction switcher at the bottom) is prototype-only. In production, layout direction should be a setting accessible from the Settings button.

6. **Component catalog data** in `mock-circuit.jsx` is for PLC components. The production catalog should be generated from the existing component metadata system (`components-metadata.json`) plus new PLC-specific components.

7. **Wire animations** (`qp-flow`) show current flow direction in simulation mode. This requires integrating with the existing electrical simulation system.

8. **The Direction C "Focus Stage"** uses glassmorphism (backdrop-filter blur + semi-transparent backgrounds). This may have performance implications — test on lower-end hardware.

9. **Auto-collapse behavior**: When switching to `split` view, the workspace explorer auto-collapses to its rail to save horizontal space. This is handled via `useEffect` watching the `view` state.

10. **Bottom dock states**: The bottom dock has two states:
    - **Collapsed** (30px bar): Shows "主控台" chip + optional serial status pill + build status text
    - **Expanded** (120-440px): Full tabbed interface with Console, Errors, Serial Monitor

---

## Appendix A: Component Library Mini-Symbols

The `MiniSymbol` component in `mock-circuit.jsx` renders 28x28 SVG thumbnails for each component
type. These are 20+ distinct symbols using 1.6px strokes in the component's category color.
Symbols include: `cpu`, `btn`, `btnc` (NC button), `sw`, `led`, `buz`, `relay`, `sol` (solenoid),
`seg` (7-segment), `estop`, `cb` (circuit breaker), `fuse`, `sensor`, `enc` (encoder), `motor`,
`heat` (heater), `power`, `gnd`, `tx` (transformer), `comm`, `res` (resistor), `cap` (capacitor),
`diode`, `junction`.

## Appendix B: Circuit Canvas Symbols

Full-size circuit symbols for the canvas (in `mock-circuit.jsx`):
- `SymPower`: 64x36 power supply block
- `SymButton`: 64x44 button with NO/NC contacts
- `SymEStop`: 44x44 circular emergency stop
- `SymPLC`: 130x210 PLC CPU block with DI/DO pins, gradient seam header
- `SymRelay`: 76x58 relay with coil symbol
- `SymMotor`: 72x72 circle with "M" and 3-phase marking
- `SymLED`: 32x48 indicator LED with glow on energized
- `Wire`: Stroke path with animated flow pattern when energized

## Appendix C: Chat Thread Mock Data

The prototype demonstrates the AI chat with a motor control scenario:
1. User: "幫我做一個馬達正反轉控制，有啟動、停止跟急停按鈕"
2. AI: Acknowledges, describes plan (canvas placement + code generation)
3. Tool calls: `canvas_add_component`, `canvas_add_wire`, `editor_set_code` (collapsible)
4. AI: Summary with checkmarks + "按 Run 即可開始 QEMU 模擬" + follow-up offer
5. Suggestions: "加上熱過載保護", "解釋互鎖邏輯", "產生 I/O 對應表"

This demonstrates the expected AI interaction pattern: natural language input -> tool calls that
modify both canvas and code -> summary with actionable follow-ups.
