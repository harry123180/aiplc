# Velxio Codebase Findings & AIPLC Adoption Plan

> Single source of truth for what we learned from Velxio and how to apply it to AIPLC.
> Generated 2026-06-03. Review before any implementation begins.

---

## Section 1: Velxio Feature Map with Source Locations

### 1.1 UI Layout & Panels

#### 3-Tier Flexbox Layout
- **Velxio files**: `velxio/frontend/src/pages/EditorPage.tsx` (lines 321-648)
- **How it works**: Root `div.app` contains AppHeader, then `div.app-container` which is a horizontal flex with `editor-panel` (left, width = `editorWidthPct%`) and `simulator-panel` (right, width = `100 - editorWidthPct%`). Each panel stacks vertically: toolbar slot at top, main content in the middle, optional bottom panels (console / serial / oscilloscope) that appear conditionally.
- **AIPLC status**: Partial. AIPLC has a 2-column top (Editor + Chat) and a tabbed bottom panel (Canvas + Serial). The layout is inverted compared to Velxio -- code/chat are on top, canvas on bottom.

#### Horizontal Splitter with Drag Resize
- **Velxio files**: `velxio/frontend/src/pages/EditorPage.tsx` (lines 246-269)
- **How it works**: `handleResizeMouseDown` captures mousedown on `div.resize-handle`, attaches global mousemove/mouseup listeners. Mouse position relative to container rect computes a percentage (clamped 20%-80%) stored as `editorWidthPct`. Both panels use CSS `width: ${pct}%` / `width: ${100-pct}%`. Body cursor set to `col-resize` during drag, `userSelect` set to `none` to prevent text selection.
- **AIPLC status**: Partial. AIPLC has a vertical (row-resize) bottom panel splitter but no horizontal column splitter between panels.

#### Bottom Panel System -- Console, Serial, Oscilloscope
- **Velxio files**: `velxio/frontend/src/pages/EditorPage.tsx` (lines 271-295, 566-638)
- **How it works**: Three independent boolean toggles (`consoleOpen`, `serialMonitorOpen`, `oscilloscopeOpen`) each render a resize handle + fixed-height panel (`bottomPanelHeight`, min 80 / max 600 / default 200). Console sits under the code editor; Serial and Oscilloscope sit under the simulator canvas. `handleBottomPanelResizeMouseDown` uses delta from startY to resize.
- **AIPLC status**: Partial. Has a single bottom panel with Canvas/Serial tabs. Missing: compilation console, oscilloscope, per-panel independent show/hide.

#### File Explorer Sidebar
- **Velxio files**: `velxio/frontend/src/pages/EditorPage.tsx` (lines 297-319, 489-503), `velxio/frontend/src/components/editor/FileExplorer.tsx`
- **How it works**: Collapsible left sidebar with drag-resizable width (min 110 / max 500 / default 165). Toggle button in unified toolbar. Contains file tree with SVG icons, rename, delete, and save button. Resized via `handleExplorerResizeMouseDown`.
- **AIPLC status**: None. AIPLC is single-file only. No file explorer, no multi-file workspace.

#### Mobile Responsive Toggle
- **Velxio files**: `velxio/frontend/src/pages/EditorPage.tsx` (lines 140-149), `velxio/frontend/src/App.css` (lines 302-375)
- **How it works**: `isMobile` state tracks `matchMedia('max-width: 768px')`. When mobile: resize handle hidden, panels stack vertically at 100% width, a `mobile-tab-bar` nav at top toggles between `'code'` and `'circuit'` views. CSS media queries override flexbox direction and hide splitters.
- **AIPLC status**: None. No mobile responsiveness.

#### Canvas Minimap
- **Velxio files**: `velxio/frontend/src/components/simulator/CanvasMinimap.tsx`, `velxio/frontend/src/components/simulator/CanvasMinimap.css`
- **How it works**: 100x75px bottom-right overview of the 4000x3000 world space. Renders boards and components as tiny colored rectangles scaled by `SCALE = MINIMAP_W / WORLD_W`. Draggable viewport rectangle shows the visible portion. Click outside rectangle teleports; click inside starts drag-pan. Pan is inverse-mapped from minimap deltas to world coordinates.
- **AIPLC status**: None. Canvas uses a 1:1 SVG viewBox matching container size. No world-space separation, no minimap.

#### Pro Slot System for Overlay Injection
- **Velxio files**: `velxio/frontend/src/pages/EditorPage.tsx` (line 645), `velxio/frontend/src/__pro_stub__/index.ts`
- **How it works**: A `<div data-velxio-slot="agent-chat" />` at the bottom of EditorPage. The pro overlay (private repo) uses `slotMounter` to portal a React tree into this div. OSS builds render nothing. Related: `proSaveAction.ts`, `proBoardGate.ts`, `proSession.ts`, `proRoutes.ts` -- each is a registry pattern where OSS defines a no-op doorbell and the overlay plugs in a real implementation at runtime.
- **AIPLC status**: Not applicable. AIPLC has its own AI Chat panel built-in (not an overlay).

---

### 1.2 Canvas & Wiring UX

#### Pin Overlay System
- **Velxio files**: `velxio/frontend/src/components/simulator/PinOverlay.tsx`
- **How it works**: Renders clickable pin indicators over components as absolutely-positioned div overlays. Pins show when hovering over a component or when wire creation is in progress. Touch devices get scaled-up hit targets: `TOUCH_MIN_SCREEN_PX (44px)` divided by current zoom, capped at `PIN_WORLD_MAX (28px)`. Reads pin positions from component DOM node's `pinInfo` getter. Handles CSS rotation by manually rotating coordinates around the wrapper centre.
- **AIPLC status**: Partial. AIPLC renders interactive pin circles directly in SVG (in CanvasPanel.tsx). Shows pins on hover/select/wiring. Missing: touch scaling, rotation handling, zoom-aware sizing.

#### Wire Creation Flow
- **Velxio files**: `velxio/frontend/src/components/simulator/SimulatorCanvas.tsx` (lines 1725-1754)
- **How it works**: `handlePinClick` starts wire creation on first pin click (auto-detecting color from pin name via `autoWireColor`), then finishes on second pin click. The finish step calls `finishWireCreation()` in the store, then pushes an undoable `CanvasCommand` with `applyNow:false`. Wire is added to the undo stack so Ctrl+Z removes it.
- **AIPLC status**: Partial. AIPLC has basic two-click wiring in CanvasPanel.tsx (lines 842-871). Missing: auto wire color, undo/redo integration, waypoint support.

#### Wire-in-Progress Renderer
- **Velxio files**: `velxio/frontend/src/components/simulator/WireInProgressRenderer.tsx`
- **How it works**: Renders the live preview while drawing a wire. Uses `generatePreviewPath()` from wireUtils to create an orthogonal SVG path through fixed waypoints plus a dynamic elbow to the mouse cursor. Three layers: dark outline (stroke 5px), colored wire (stroke 2px), dashed white overlay (opacity 0.5). Circle markers at start, each waypoint, and cursor.
- **AIPLC status**: Partial. AIPLC has a `WirePreview` component (CanvasPanel.tsx lines 648-692) with dashed orthogonal path and markers. Missing: waypoint markers, triple-layer rendering, the preview path generation algorithm.

#### Orthogonal Path Generation
- **Velxio files**: `velxio/frontend/src/utils/wireUtils.ts` (lines 65-142)
- **How it works**: `generateOrthogonalPath(start, waypoints, end)` builds SVG path `M ... L ...` through all points. Between each pair, if dx and dy are both nonzero, inserts an L-shape elbow (horizontal first, then vertical). `generatePreviewPath()` does the same for locked waypoints but chooses the last elbow orientation based on which axis has the larger mouse delta (longer axis goes first).
- **AIPLC status**: Partial. AIPLC does midpoint-based L-shaped routing in WirePath (CanvasPanel.tsx line 633). Missing: waypoint support, adaptive elbow orientation on preview.

#### Wire Segment Drag + Waypoint Handles
- **Velxio files**: `velxio/frontend/src/components/simulator/WireLayer.tsx`, `velxio/frontend/src/components/simulator/SimulatorCanvas.tsx` (handleHandleMouseDown at line 1613)
- **How it works**: WireLayer renders each wire segment with a draggable handle circle at the midpoint. Dragging a handle perpendicular to the segment orientation creates a new waypoint, splitting the segment into two. SimulatorCanvas tracks `handleDragState` and computes the new waypoint position on mousemove.
- **AIPLC status**: None. Wires are simple two-point connections with no editing after creation.

#### Wire Alignment Guides
- **Velxio files**: `velxio/frontend/src/utils/wireHitDetection.ts` (ALIGN_SNAP_PX = 6)
- **How it works**: When dragging a wire segment handle, snaps to alignment with nearby wire segments within 6px. Visual guide lines appear showing the alignment.
- **AIPLC status**: None.

#### Wire Color Keyboard Shortcuts
- **Velxio files**: `velxio/frontend/src/components/simulator/SimulatorCanvas.tsx` (lines 1769-1777), `velxio/frontend/src/utils/wireUtils.ts` (lines 7-23)
- **How it works**: Keys 0-9, c, l, m, p, y each map to a hex color (matching Wokwi's palette). During wire creation, the key changes `wireInProgress.color`. When a wire is selected, the key changes the wire's stored color. Color map: 0=Black, 1=Brown, 2=Red, 3=Orange, 4=Gold, 5=Green, 6=Blue, 7=Violet, 8=Gray, 9=White, c=Cyan, l=Lime, m=Magenta, p=Purple, y=Yellow.
- **AIPLC status**: None. All wires are blue (#1565C0).

#### Zoom: Scroll Wheel + Pinch + Buttons
- **Velxio files**: `velxio/frontend/src/components/simulator/SimulatorCanvas.tsx` (lines 445-466 wheel, 705-729 pinch)
- **How it works**: Wheel zoom: non-passive listener, `preventDefault()` on wheel event. Factor 1.1/0.9 per tick. Zoom clamped 0.1-5.0. Pan adjusted to keep the world point under the cursor fixed. Pinch zoom: two-finger touch distance ratio scales from `pinchStartZoomRef`. Buttons: zoom in/out/reset buttons in the toolbar (`handleZoomIn`, `handleZoomOut`, `handleResetZoom`).
- **AIPLC status**: None. Canvas uses a 1:1 SVG viewBox with no zoom capability.

#### Pan: Middle-Click + Right-Drag
- **Velxio files**: `velxio/frontend/src/components/simulator/SimulatorCanvas.tsx` (lines 1586-1610)
- **How it works**: `handleCanvasMouseDown` detects middle-click (button 1) or right-click (button 2) to start panning. Left-click on background also pans (when not wiring and no property dialog). Stores `panStartRef` with initial mouse/pan coords. `handleCanvasMouseMove` computes delta and updates `panRef.current`.
- **AIPLC status**: None. No pan support.

#### Zero-Lag Ref-Based Pan/Zoom
- **Velxio files**: `velxio/frontend/src/components/simulator/SimulatorCanvas.tsx` (line 1335)
- **How it works**: During drag/pan, the `.canvas-world` element's `transform` CSS property is set directly via `world.style.transform = translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, bypassing React state updates. The refs (`panRef`, `zoomRef`) hold the live values; React state is only set on mouse-up for re-render. This eliminates 60fps React reconciliation overhead.
- **AIPLC status**: None. All position updates go through React state (`updateComponentPosition` triggers `set()` on every mousemove).

#### Component Rotation 90 degrees
- **Velxio files**: `velxio/frontend/src/components/simulator/SimulatorCanvas.tsx` (lines 1268-1282)
- **How it works**: `handleRotateComponent` reads current rotation property (default 0), computes `(current + 90) % 360`, calls `updateComponent` to set the new rotation, then `recordRotate` to push an undoable command. The component wrapper div applies `transform: rotate(${rotation}deg)` in CSS.
- **AIPLC status**: None. Components cannot be rotated.

#### Component Property Dialog
- **Velxio files**: `velxio/frontend/src/components/simulator/ComponentPropertyDialog.tsx`
- **How it works**: Floating dialog that appears on component single-click. Shows component name, editable properties (text/number/select controls based on metadata), pin roles list (with touch-friendly "Start wire from pin" / "Connect to pin" rows), rotate button, and delete button. Position is clamped within the canvas viewport to prevent off-screen overflow.
- **AIPLC status**: None. Components have no property dialog. Only selection highlight and Delete button.

#### Two-Step Delete Confirmation
- **Velxio files**: `velxio/frontend/src/components/simulator/ComponentPropertyDialog.tsx` (lines 60-63, ~253-274)
- **How it works**: First click on Delete sets `confirmingDelete = true`, which flips the dialog footer to show "Delete {component}? Yes / No". Second click confirms. Replaces the old `window.confirm()` which was jarring on mobile.
- **AIPLC status**: None. Delete is instant (no confirmation).

#### Touch Support
- **Velxio files**: `velxio/frontend/src/components/simulator/SimulatorCanvas.tsx` (lines 594-686)
- **How it works**: Non-passive touch listeners for: single-finger pan/drag with 150ms long-press promotion (prevents accidental drag), two-finger pinch-to-zoom, touch-friendly pin scaling (hit targets grow inversely to zoom). `data-drag-promote` attribute on components enables the long-press detection. Touch events call `preventDefault()` to suppress scroll and synthetic click.
- **AIPLC status**: None.

#### Selection Action Bar
- **Velxio files**: `velxio/frontend/src/components/simulator/SelectionActionBar.tsx`
- **How it works**: Floating toolbar pinned to top-center of canvas. Visible when any wire/component/board is selected. Shows Delete, Rotate (components only), and Deselect buttons. For wires, shows a color palette swatch row (using the same WIRE_KEY_COLORS from wireUtils). Uses native `touchend` for button taps to bypass the canvas's `preventDefault()` on touchend.
- **AIPLC status**: None. Only a toolbar "Delete" button appears when something is selected.

---

### 1.3 Circuit Verification (DRC)

#### Pre-Flight Safety Verifier
- **Velxio files**: `velxio/frontend/src/simulation/verify/circuitVerifier.ts`
- **How it works**: Runs when user presses Run. Builds an `.op` SPICE netlist from the current canvas, solves it with ngspice-WASM, then inspects branch currents against four rules. Returns `VerificationResult { errors, warnings, componentsChecked, solve }`. Never throws -- solver failure returns a single warning and skips rules.
- **AIPLC status**: None. Run button directly toggles simulation state.

#### Short Circuit Detection
- **Velxio files**: `velxio/frontend/src/simulation/verify/circuitVerifier.ts` (lines 130-164)
- **How it works**: Finds all voltage source components (battery, signal-generator, power-supply). Reads `|i(v_{id})|` from branch currents. Compares against threshold (default 500mA, overridable by power-supply `currentLimit` property). Above threshold: severity "error", code "short-circuit" or "source-overload".
- **AIPLC status**: None.

#### LED Overcurrent Check
- **Velxio files**: `velxio/frontend/src/simulation/verify/circuitVerifier.ts` (lines 166-191)
- **How it works**: Finds all LED components. Reads forward current from `|i(v_{id}_sense)|`. Above 20mA: severity "error", code "led-overcurrent". Below 1uA but > 0: severity "warning", code "led-no-current" (wired but dark).
- **AIPLC status**: None.

#### Resistor Overpower Check
- **Velxio files**: `velxio/frontend/src/simulation/verify/circuitVerifier.ts` (lines 193+)
- **How it works**: Parses the netlist text for `R_{id}` cards to find node assignments. Computes I from V_drop / R. If I^2 * R > 0.25W (default rating): severity "warning", code "resistor-overpower".
- **AIPLC status**: None.

#### Verification Modal
- **Velxio files**: `velxio/frontend/src/components/simulator/CircuitVerificationModal.tsx`
- **How it works**: Fixed-overlay modal (z-index 1000) with dark backdrop. Lists errors (red badge) and warnings (yellow badge) with component IDs and messages. If errors exist: "Cancel" (primary) and "Run anyway" (secondary) buttons. If only warnings: auto-dismiss. Errors block run; warnings don't.
- **AIPLC status**: None.

#### CONFLICT Pin State
- **Velxio files**: `velxio/frontend/src/simulation/PinResolver.ts` (line 41)
- **How it works**: `PinState = 'HIGH' | 'LOW' | 'FLOATING' | 'CONFLICT'`. CONFLICT is defined in the type but the Phase 0 default implementation never produces it -- it's a landing point for the Phase 1 SPICE-resolved implementation where two sources driving the same net at different voltages would be detected.
- **AIPLC status**: None.

---

### 1.4 Simulation Engine

#### SPICE Engine (ngspice WASM)
- **Velxio files**: `velxio/frontend/src/simulation/spice/` directory, `SpiceEngine.lazy.ts`, `NgSpiceWorkerAdapter`
- **How it works**: Lazy-loaded ~39MB WASM chunk (`eecircuit-engine`). Runs `.op`, `.tran`, `.ac` analyses. Web Worker adapter for non-blocking solves. Used by both the live electrical overlay and the DRC verifier.
- **AIPLC status**: None. No analog simulation.

#### NetlistBuilder (Union-Find on wires)
- **Velxio files**: `velxio/frontend/src/simulation/spice/NetlistBuilder.ts`
- **How it works**: Reads `components[]` and `wires[]` from the store. Uses Union-Find to group connected pins into nets. Maps each net to a SPICE node name. For each component, calls `componentToSpice()` to emit SPICE cards (R, C, L, D, V, etc.). Appends analysis commands.
- **AIPLC status**: None.

#### componentToSpice
- **Velxio files**: `velxio/frontend/src/simulation/spice/componentToSpice.ts`
- **How it works**: Maps component metadata IDs to SPICE model cards. Supports: R (resistor), C (capacitor), L (inductor), D (LED/diode), V (battery/signal-generator/power-supply), Q (BJT), M (MOSFET), X (OpAmp subcircuit). Each component emits its SPICE primitive plus optional sense sources for current measurement.
- **AIPLC status**: None.

#### Mixed-Mode: Digital MCU + Analog SPICE
- **Velxio files**: `velxio/frontend/src/simulation/spice/MixedModeScheduler.ts`
- **How it works**: Schedules alternating time-steps between the digital MCU simulator (AVR/RP2040/ESP32) and the SPICE solver. MCU GPIO outputs become voltage sources in the SPICE netlist; SPICE node voltages are threshold-converted back to digital states for MCU inputs.
- **AIPLC status**: None.

#### PinManager + PinResolver
- **Velxio files**: `velxio/frontend/src/simulation/PinManager.ts`, `velxio/frontend/src/simulation/PinResolver.ts`
- **How it works**: PinManager maps Arduino/MCU pin numbers to component instances. Fires callbacks when pin state changes (HIGH/LOW/PWM). PinResolver abstracts the query "what state is this pin in?" so handlers don't touch PinManager directly. Phase 0 implementation proxies to PinManager. Phase 1 would read SPICE node voltages and threshold-convert.
- **AIPLC status**: None. AIPLC has no pin simulation -- components only show visual state from store properties.

#### I2C/SPI Bus Managers
- **Velxio files**: `velxio/frontend/src/simulation/I2CBusManager.ts`, `velxio/frontend/src/simulation/SPI/`
- **How it works**: I2CBusManager provides a virtual I2C bus with multiple devices (DS1307 RTC, BMP280 temp sensor, SSD1306 OLED, etc.). Each device implements the `I2CDevice` interface with `startCondition`, `writeByte`, `readByte`. SPI manager similarly routes SPI frames.
- **AIPLC status**: None. Might be relevant for Modbus RTU simulation in future.

#### SignalRouter (GPIO Matrix)
- **Velxio files**: `velxio/frontend/src/simulation/SignalRouter.ts`
- **How it works**: ESP32-specific GPIO matrix that maps logical functions to physical pins. Routes UART TX/RX, I2C SDA/SCL, SPI, LEDC PWM channels. `ledcSignalForChannel()` converts LEDC config to frequency/duty for servo/LED simulation.
- **AIPLC status**: Not applicable to PLC use case.

#### Interconnect (Cross-Board Signal Propagation)
- **Velxio files**: `velxio/frontend/src/simulation/Interconnect.ts`
- **How it works**: Routes signals between boards in multi-board setups. `bindBoard` registers a board's PinManager. `updateWires` scans wires for cross-board connections and creates bidirectional listeners. When a pin on board A changes, it fires the corresponding pin on board B.
- **AIPLC status**: Not directly applicable. AIPLC has a single PLC CPU. Could be used for PLC-to-I/O-module bus simulation in future.

---

### 1.5 AI Integration

#### MCP Server OSS (7 Tools)
- **Velxio files**: `velxio/backend/app/mcp/server.py`, `velxio/backend/mcp_server.py` (stdio), `velxio/backend/mcp_sse_server.py` (SSE)
- **How it works**: FastMCP server with 7 tools: `compile_project`, `run_project`, `import_wokwi_json`, `export_wokwi_json`, `create_circuit`, `update_circuit`, `generate_code_files`. Each tool is a decorated async function receiving typed parameters and returning a dict result.
- **AIPLC status**: Has MCP integration but with AIPLC-specific tools (canvas_add_component, canvas_add_wire, canvas_remove, editor_set_code, etc.). 12 tools defined in `backend/app/services/mcp_tools.py`.

#### MCP Dual Transport: stdio + SSE
- **Velxio files**: `velxio/backend/mcp_server.py` (stdio entry point for Claude Desktop), `velxio/backend/mcp_sse_server.py` (SSE for Cursor), `velxio/backend/app/main.py` (SSE mount at `/mcp`)
- **How it works**: `mcp_server.py` runs `mcp.run(transport='stdio')` for direct pipe. The FastAPI app mounts the SSE transport at `/mcp` for HTTP-based agents. Both share the same `mcp` FastMCP instance and tool implementations.
- **AIPLC status**: Has SSE transport at `/api/mcp/sse`. Missing: stdio transport for Claude Desktop integration.

#### Pro AI Chat via Overlay Slot
- **Velxio files**: `velxio/frontend/src/pages/EditorPage.tsx` (line 645)
- **How it works**: `<div data-velxio-slot="agent-chat" />` -- empty div that the pro overlay portals an AI chat panel into. The overlay reads `useCompileLogsStore` to build "diagnose this failure" prompts.
- **AIPLC status**: Different approach. AIPLC has a built-in ChatPanel component (not an overlay). The chat is embedded in the main layout.

#### AI Quota System
- **Velxio files**: Lives in the private velxio-prod repo (not in OSS)
- **How it works**: 20/500/2000 daily credits by tier (free/hobby/pro). Rate limiting per user.
- **AIPLC status**: Not applicable for MVP. Uses LiteLLM proxy at `ai.qianpro.shop`.

#### llms.txt Public Declaration
- **Velxio files**: `velxio/frontend/public/llms.txt` (or similar)
- **How it works**: A public text file at the root of the site describing the project for LLM agents to discover capabilities.
- **AIPLC status**: None.

#### Pro Overlay Registry Pattern
- **Velxio files**: `velxio/frontend/src/lib/proSaveAction.ts`, `velxio/frontend/src/lib/proBoardGate.ts`, `velxio/frontend/src/lib/proSession.ts`, `velxio/frontend/src/lib/proRoutes.ts`
- **How it works**: Each is a small module that defines a default no-op behavior and exposes an `install*Impl()` function. The pro overlay calls these at mount time to inject real implementations. Pattern: registry with fallback.
- **AIPLC status**: Not applicable. AIPLC is a single product, not an OSS+overlay split.

---

### 1.6 Examples & Templates

#### 250+ Example Projects
- **Velxio files**: `velxio/frontend/src/data/examples.ts` (hub), `examples-circuits.ts`, `examples-analog.ts`, `examples-digital.ts`, `examples-100-days.ts`, `examples-picow-wifi.ts`, `examples-displays-epaper.ts`, `examples-retro-intel.ts`, `examples-robot-desktop.ts`
- **How it works**: 8 category files each export an array of `ExampleProject` objects. The hub file imports and merges them.
- **AIPLC status**: None. No example gallery. Has 5 skill markdown files in `backend/app/skills/` (led-button-circuit, modbus-communication, motor-forward-reverse, star-delta-starter, timer-counter-basic) but these are AI agent reference docs, not loadable examples.

#### ExampleProject Metadata
- **Velxio files**: `velxio/frontend/src/data/examples.ts` (lines 17-80)
- **How it works**: Each example has: `id`, `title`, `description`, `category` (basics/sensors/displays/communication/games/robotics/circuits), `difficulty` (beginner/intermediate/advanced), `boardType`, `code`, optional `components[]`, `wires[]`, `boards[]` (multi-board), `tags`, `libraries`. Gallery renders from this metadata.
- **AIPLC status**: None.

#### Examples Gallery
- **Velxio files**: `velxio/frontend/src/components/examples/ExamplesGallery.tsx`
- **How it works**: Grid of example cards with board tabs at top, category filter, difficulty pills, and live search. Each card shows a thumbnail (WebP screenshot or SVG CircuitPreview fallback), title, description, difficulty badge, and tags.
- **AIPLC status**: None.

#### Shareable /example/<id> URLs
- **Velxio files**: `velxio/frontend/src/pages/ExampleLoaderPage.tsx`, `velxio/frontend/src/pages/ExampleDetailPage.tsx`
- **How it works**: React Router route `/example/:id` loads the example data and redirects to the editor with components/wires/code pre-populated.
- **AIPLC status**: None. Single-page app, no routing.

---

### 1.7 Developer Experience

#### Undo/Redo System
- **Velxio files**: `velxio/frontend/src/store/useSimulatorStore.ts` (lines 741-880), `velxio/frontend/src/pages/EditorPage.tsx` (lines 209-231)
- **How it works**: Bounded ring buffer of `CanvasCommand` objects (max 50). Each command has `description`, `execute()`, `undo()`. `pushCommand(cmd, {applyNow})` appends to history and truncates the redo tail. `undo()` decrements index and calls `cmd.undo()`. `redo()` increments and calls `cmd.execute()`. Keyboard: Ctrl+Z = undo, Ctrl+Y / Ctrl+Shift+Z = redo (skipped when focus is in input/textarea/contenteditable). Recorded actions: `recordAddComponent`, `recordRemoveComponent`, `recordMove`, `recordRotate`, `recordAddWire`, `recordRemoveWire`, etc.
- **AIPLC status**: None.

#### Serial Batcher
- **Velxio files**: `velxio/frontend/src/store/serialBatcher.ts`
- **How it works**: Buffers per-byte USART output in a `Map<boardId, string>`. Flushes once per `requestAnimationFrame` (max 60Hz). Prevents React "Maximum update depth exceeded" from high-frequency serial output (e.g. 200Hz println). `createSerialBatcher(flush)` returns `{ append, flushNow }`.
- **AIPLC status**: None. Serial lines are added individually to an array. Could cause performance issues with high-frequency output.

#### VFS Store for Raspberry Pi Python Files
- **Velxio files**: `velxio/frontend/src/store/useVfsStore.ts`
- **How it works**: Virtual file system for Raspberry Pi 3 Python workspace. Stores file tree in Zustand, syncs to the Pi QEMU worker.
- **AIPLC status**: Not applicable.

#### Oscilloscope Store
- **Velxio files**: `velxio/frontend/src/store/useOscilloscopeStore.ts`
- **How it works**: Multi-channel waveform data store. Stores time-series samples, trigger settings, timebase, and per-channel visibility. Used by the Oscilloscope component for real-time signal visualization.
- **AIPLC status**: None. Could be useful for analog signal debugging in future.

#### i18n (8 Languages)
- **Velxio files**: `velxio/frontend/src/i18n/` directory, 8 locale folders (en, de, es, fr, it, ja, pt-br, ru, zh-cn)
- **How it works**: Uses `i18next` + `react-i18next`. Translation keys in JSON files grouped by feature (docs, docs2, etc.). `useTranslation()` hook in components.
- **AIPLC status**: None. Hard-coded Chinese/English strings.

#### Analytics (GA4 Events)
- **Velxio files**: `velxio/frontend/src/utils/analytics.ts`
- **How it works**: 5 key event categories: simulation (run/stop/reset), editor (compile, select_board, add_component, create_wire), examples (open_example), projects (create/save), auth (sign_up/login). `fireEvent()` wrapper checks for `window.gtag`.
- **AIPLC status**: None.

#### Component Metadata Auto-Generation
- **Velxio files**: `velxio/frontend/scripts/generate-component-metadata.ts`, `velxio/frontend/scripts/component-overrides.json`
- **How it works**: TypeScript AST scanner reads wokwi-elements source, extracts pin definitions and properties, outputs `components-metadata.json`. Override file adds custom components and property patches. npm script: `npm run generate:metadata`.
- **AIPLC status**: Not applicable. AIPLC has hand-coded component definitions in CanvasPanel.tsx.

---

### 1.8 Deployment & Infrastructure

#### Multi-Stage Docker
- **Velxio files**: `velxio/Dockerfile.standalone`
- **How it works**: Stage 0: QEMU .so provider (ubuntu:22.04, curl). Stage 1: Frontend build (node:20, `npm run build:docker`). Stage 2: Backend (python:3.11 + nginx). Entrypoint runs setup, then starts uvicorn + nginx in parallel with `wait -n` for fail-fast.
- **AIPLC status**: Has `docker-compose.yml` and basic setup. No multi-stage optimization.

#### Entrypoint Auto-Setup
- **Velxio files**: `velxio/backend/docker-entrypoint.sh` (referenced in Dockerfile)
- **How it works**: Installs arduino-cli cores if missing (arduino:avr, stm32, rp2040), generates secret key if not set, downloads ESP-IDF if configured.
- **AIPLC status**: None.

#### 5 Persistent Volumes
- **Velxio files**: `velxio/Dockerfile.standalone`
- **How it works**: data (SQLite/uploads), arduino (arduino-cli data), ccache (ESP-IDF build cache), build (temp build artifacts), libraries (installed Arduino libraries).
- **AIPLC status**: Basic. docker-compose has no persistent volume configuration.

#### ccache for ESP-IDF Warm Builds
- **Velxio files**: `velxio/backend/app/services/espidf_compiler.py`
- **How it works**: ccache wraps the ESP-IDF GCC calls. First build: 5-7 minutes. Warm builds: 5-30 seconds. Volume-mounted so cache survives container restarts.
- **AIPLC status**: Not applicable (not using ESP-IDF).

#### Dual-Process Orchestration
- **Velxio files**: `velxio/Dockerfile.standalone` (entrypoint)
- **How it works**: Starts `uvicorn` (Python backend) and `nginx` (frontend static + reverse proxy) in parallel. `wait -n` exits if either process dies.
- **AIPLC status**: Uses docker-compose to run frontend and backend as separate containers.

#### VS Code Extension + Desktop App (Tauri)
- **Velxio files**: Referenced in CLAUDE.md but code is in separate repos
- **How it works**: VS Code extension embeds the frontend in a WebView panel. Tauri desktop app bundles the frontend + backend for offline use with bundled QEMU binaries.
- **AIPLC status**: None.

---

## Section 2: AIPLC Feature Adoption Plan

### Adopt Now (MVP v2) -- High value, achievable in 1-2 subagent tasks

| Feature | Rationale |
|---------|-----------|
| **Undo/Redo System** | Core UX. Users lose work without it. Simple command pattern. |
| **Compilation Console** | Essential for debugging. Shows compile errors inline, not just in serial monitor. |
| **Horizontal Splitter** | Needed to resize Editor vs Chat panel widths. |
| **Wire Auto-Color** | Quick win. GND=black, VCC=red, default=green. |
| **Component Property Dialog** | Needed for editing component values (indicator light color, relay label, etc.). |
| **Selection Action Bar** | Touch-friendly actions. Better than the current inline toolbar delete button. |
| **DRC Safety Verifier** | Critical for PLC: short circuit detection prevents bad habits. Simplified version (no SPICE -- rule-based check on wiring graph). |
| **DRC Verification Modal** | The UI for showing DRC results before Run. |

### Adopt Soon (v3) -- Important but not urgent, or depends on Adopt Now items

| Feature | Rationale |
|---------|-----------|
| **Canvas Zoom + Pan** | Important for complex circuits but MVP canvas is small enough. Depends on SVG-to-world-space refactor. |
| **Waypoint Wire Editing** | Improves wire routing but basic L-shaped routing works. |
| **Wire Color Shortcuts** | Nice keyboard shortcut but not essential until zoom/pan exists. |
| **Component Rotation** | Useful for layout aesthetics. Moderate complexity (need to rotate pin positions). |
| **Serial Batcher** | Only needed when QEMU simulation generates high-frequency output. |
| **Two-Step Delete** | Better UX but current instant-delete is acceptable for now. |
| **Touch Support** | Important for tablet use in classroom. Depends on zoom/pan. |
| **Mobile Responsive** | Same -- classroom/demo use on mobile. |
| **Examples Gallery** | High value for teaching. Depends on having 10+ working examples first. |
| **Canvas Minimap** | Only useful after zoom/pan is implemented. |

### Adopt Later (v4+) -- Nice to have, or requires significant infrastructure

| Feature | Rationale |
|---------|-----------|
| **SPICE Engine** | Full analog simulation. Huge dependency (39MB WASM). Not needed for digital PLC I/O. |
| **Mixed-Mode Simulation** | Depends on SPICE engine. |
| **i18n** | Only needed when targeting international markets. |
| **Analytics** | Nice for product metrics but not a feature users see. |
| **File Explorer / Multi-File** | PLC programs are typically single-file. Could be useful for library includes. |
| **Oscilloscope** | Useful for analog debugging. Depends on SPICE. |
| **MCP stdio transport** | For Claude Desktop integration. Low priority vs web-based chat. |
| **Pro Overlay Pattern** | Only if we split into OSS/Pro. |

### Skip -- Not relevant to PLC use case

| Feature | Rationale |
|---------|-----------|
| **Wokwi Import/Export** | Arduino ecosystem, not PLC. |
| **GitHub Star Banner** | Velxio-specific growth hack. |
| **SEO Pages** | Landing pages for Arduino/ESP32 boards. |
| **Board Selector (19 boards)** | AIPLC has 1 PLC board. |
| **AVR/RP2040/ESP32 Simulators** | PLC uses STM32 QEMU only. |
| **Logic Gate Elements** | Not PLC components. |
| **Custom Chip Designer** | Not PLC. |
| **I2C/SPI Virtual Devices** | Not relevant until Modbus. |
| **SignalRouter / GPIO Matrix** | ESP32-specific. |

---

### Adopt Now: Detailed Specs

#### 1. Undo/Redo System
- **What to build**: Add `history`, `historyIndex`, `pushCommand`, `undo`, `redo`, `canUndo`, `canRedo`, `clearHistory` to `useAppStore`. Add `CanvasCommand` interface. Wrap existing mutations (`addCanvasComponent`, `removeCanvasComponent`, `addCanvasWire`, `removeCanvasWire`, `updateComponentPosition`) with recorded commands.
- **Reference**: `velxio/frontend/src/store/useSimulatorStore.ts` lines 741-880 (interface), lines 2474-2500 (implementation of pushCommand)
- **Dependencies**: None
- **Estimated tasks**: 1 subagent task

#### 2. Compilation Console
- **What to build**: `CompilationConsole.tsx` component. `useCompileLogsStore.ts` Zustand store with `logs`, `setLogs`, `appendLogs`, `clear`. Add "Console" tab to the bottom panel alongside Canvas and Serial. Wire compile API response logs into the store.
- **Reference**: `velxio/frontend/src/components/editor/CompilationConsole.tsx`, `velxio/frontend/src/store/useCompileLogsStore.ts`
- **Dependencies**: None
- **Estimated tasks**: 1 subagent task

#### 3. Horizontal Splitter (Editor / Chat resize)
- **What to build**: Add `editorWidthPct` state to store. Render a vertical `div.resize-handle` between EditorPanel and ChatPanel. Same drag logic as Velxio's `handleResizeMouseDown`. Apply `width: ${pct}%` to left panel, `width: ${100-pct}%` to right panel.
- **Reference**: `velxio/frontend/src/pages/EditorPage.tsx` lines 246-269
- **Dependencies**: None
- **Estimated tasks**: Part of layout restructure batch

#### 4. Wire Auto-Color
- **What to build**: Port `autoWireColor(pinName)` from `velxio/frontend/src/utils/wireUtils.ts` lines 32-52. Call it in `handlePinClick` when starting a wire. Store wire color in `CanvasWire`. Render colored wires in `WirePath`.
- **Reference**: `velxio/frontend/src/utils/wireUtils.ts` lines 32-52
- **Dependencies**: Needs `CanvasWire` to add a `color` field
- **Estimated tasks**: Part of UX polish batch

#### 5. Component Property Dialog
- **What to build**: `ComponentPropertyDialog.tsx` -- floating dialog on component click. Shows component type, editable properties (color for indicator light, value for resistor). Pin list with "Start wire from X" action. Rotate button (placeholder for v3). Delete button (two-step).
- **Reference**: `velxio/frontend/src/components/simulator/ComponentPropertyDialog.tsx`
- **Dependencies**: Needs component metadata definition (already have `getComponentDef` function)
- **Estimated tasks**: 1 subagent task

#### 6. Selection Action Bar
- **What to build**: `SelectionActionBar.tsx` -- floating top-center bar when anything is selected. Delete and Deselect buttons. Wire color swatches when a wire is selected.
- **Reference**: `velxio/frontend/src/components/simulator/SelectionActionBar.tsx`
- **Dependencies**: Needs wire selection support (currently only component selection exists)
- **Estimated tasks**: Part of UX polish batch

#### 7. DRC Safety Verifier (Simplified)
- **What to build**: `circuitVerifier.ts` -- rule-based (no SPICE). Check for: (a) unconnected PLC output pins driving nothing, (b) multiple outputs driving the same node, (c) missing power/ground connections, (d) motor without contactor (safety), (e) emergency-stop not wired. Return `{ errors, warnings }`.
- **Reference**: `velxio/frontend/src/simulation/verify/circuitVerifier.ts` for the interface pattern only. Rules will be PLC-specific, not SPICE-based.
- **Dependencies**: None
- **Estimated tasks**: 1 subagent task

#### 8. DRC Verification Modal
- **What to build**: `DrcVerificationModal.tsx` -- same pattern as Velxio's `CircuitVerificationModal.tsx`. Overlay modal with error/warning list, Cancel / Run Anyway buttons. Wire into Header.tsx Run button: before toggling simulation, run verifier, show modal if errors found.
- **Reference**: `velxio/frontend/src/components/simulator/CircuitVerificationModal.tsx`
- **Dependencies**: DRC Safety Verifier (#7)
- **Estimated tasks**: Part of DRC batch

---

## Section 3: Implementation Task Breakdown

### Batch 1: Store Enhancements + Reusable Components (parallel tasks)

**Task 1A: Undo/Redo in useAppStore**

Add to `useAppStore.ts`:

```typescript
// New interface
interface CanvasCommand {
  description: string;
  execute(): void;
  undo(): void;
}

// New state
history: CanvasCommand[];           // bounded ring buffer, max 50
historyIndex: number;               // -1 = empty / fully undone
pushCommand: (cmd: CanvasCommand, opts?: { applyNow?: boolean }) => void;
undo: () => void;
redo: () => void;
canUndo: () => boolean;
canRedo: () => boolean;
clearHistory: () => void;

// New recorded actions (wrap existing mutators)
recordAddComponent: (comp: CanvasComponent) => void;
recordRemoveComponent: (id: string) => void;
recordMove: (id: string, fromX: number, fromY: number, toX: number, toY: number) => void;
recordAddWire: (wire: CanvasWire) => void;
recordRemoveWire: (id: string) => void;
```

Implementation pattern (from Velxio `useSimulatorStore.ts` line 2474):
```typescript
pushCommand: (cmd, opts = { applyNow: true }) => {
  if (opts.applyNow !== false) cmd.execute();
  set((s) => {
    const next = s.history.slice(0, s.historyIndex + 1);
    next.push(cmd);
    if (next.length > 50) next.shift();
    return { history: next, historyIndex: next.length - 1 };
  });
},
undo: () => {
  const { history, historyIndex } = get();
  if (historyIndex < 0) return;
  history[historyIndex].undo();
  set({ historyIndex: historyIndex - 1 });
},
redo: () => {
  const { history, historyIndex } = get();
  if (historyIndex >= history.length - 1) return;
  history[historyIndex + 1].execute();
  set({ historyIndex: historyIndex + 1 });
},
```

Add Ctrl+Z/Y keyboard handler in `App.tsx` (reference: `velxio/frontend/src/pages/EditorPage.tsx` lines 209-231):
- Skip when focus is in INPUT/TEXTAREA/contenteditable
- Ctrl+Z = undo, Ctrl+Y or Ctrl+Shift+Z = redo

**Task 1B: CompileLogsStore + CompilationConsole component**

Create `frontend/src/store/useCompileLogsStore.ts`:
```typescript
interface CompilationLog {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: number;
}

interface CompileLogsState {
  logs: CompilationLog[];
  setLogs: (logs: CompilationLog[]) => void;
  appendLogs: (logs: CompilationLog[]) => void;
  clear: () => void;
}
```

Create `frontend/src/components/CompilationConsole.tsx`:
- Dark background terminal-style panel (#1E1E1E)
- Filter tabs: All / Errors / Warnings
- Auto-scroll to bottom on new logs
- Clear button
- Close button
- Each log line: colored icon (green info, yellow warning, red error), timestamp, message
- Auto-switch to "Errors" filter when new errors arrive

Reference: `velxio/frontend/src/components/editor/CompilationConsole.tsx` (lines 1-60)

Add "Console" as a third tab in the bottom panel of `App.tsx`:
```typescript
bottomTab: 'canvas' | 'serial' | 'console'
```

**Task 1C: Wire color support + auto-color utility**

Create `frontend/src/utils/wireUtils.ts`:
```typescript
export function autoWireColor(pinName: string): string {
  const lower = pinName.toLowerCase();
  if (lower.includes('gnd') || lower === 'ground' || lower.includes('coil-') || lower === 'k') return '#000000';
  if (lower.includes('vcc') || lower.includes('24v') || lower.includes('v+') || lower === 'a') return '#cc0000';
  if (lower.includes('di')) return '#4CAF50';
  if (lower.includes('do')) return '#F44336';
  if (lower.includes('ai')) return '#FF9800';
  if (lower.includes('ao')) return '#2196F3';
  return '#22c55e'; // default green
}

export const WIRE_KEY_COLORS: Record<string, string> = {
  '0': '#000000', '1': '#8B4513', '2': '#cc0000', '3': '#FF8C00',
  '4': '#FFD700', '5': '#22c55e', '6': '#0000cc', '7': '#8B00FF',
  '8': '#808080', '9': '#FFFFFF',
};
```

Add `color` field to `CanvasWire`:
```typescript
interface CanvasWire {
  id: string;
  fromComponent: string;
  fromPin: string;
  toComponent: string;
  toPin: string;
  color: string;  // NEW
}
```

Update `WirePath` in `CanvasPanel.tsx` to use `wire.color` instead of hardcoded `#1565C0`.
Update `handlePinClick` to call `autoWireColor(pinName)` when starting a wire.

---

### Batch 2: Layout Restructure (depends on Batch 1 for Console tab)

**Task 2A: App.tsx rewrite -- 3-column layout with horizontal splitter**

New layout structure:
```
+-------------------------------------------------------------+
|  Header (unchanged)                                          |
+---------------------------+--+------------------------------+
|                           |  |                              |
|  Left: Editor + Console   |  |  Right: Chat Panel           |
|  (width: editorWidthPct%) |  |  (width: 100-editorWidthPct%)|
|                           |  |                              |
|  +-----------------------+|  |                              |
|  | Monaco Editor         ||  |                              |
|  |                       ||  |                              |
|  +-----------------------+|  |                              |
|  | Console (collapsible) ||  |                              |
|  +-----------------------+|  |                              |
+---------------------------+--+------------------------------+
|  Bottom: Canvas + Serial + Console tabs                      |
|  (height: bottomPanelHeight, resizable)                      |
+-------------------------------------------------------------+
```

New state in `useAppStore`:
```typescript
editorWidthPct: number;          // default 50, range 20-80
setEditorWidthPct: (pct: number) => void;
leftPanelConsoleOpen: boolean;   // compilation console below editor
setLeftPanelConsoleOpen: (open: boolean) => void;
```

The horizontal splitter reuses the same pattern as the existing vertical splitter:
- 5px handle between left and right panels
- cursor `col-resize` on drag
- grip indicator (2px x 32px rounded bar)
- Hover effect: grip changes from `var(--color-border)` to `var(--color-text-secondary)`

**Task 2B: AI Chat Panel as a right column (not a drawer)**

The Chat panel stays as the right column. No drawer needed because it is always visible in the current layout. The horizontal splitter allows users to give more or less space to it.

Update `ChatPanel.tsx`:
- Remove any "toggle" logic (it is always visible)
- Add min-width constraint (250px) so it does not disappear when dragged all the way right

---

### Batch 3: DRC (can run in parallel with Batch 2)

**Task 3A: circuitVerifier.ts -- PLC-specific rule-based DRC**

Create `frontend/src/utils/circuitVerifier.ts`:

```typescript
export type WarningSeverity = 'error' | 'warning';
export type WarningCode =
  | 'unconnected-output'
  | 'unconnected-input'
  | 'output-conflict'
  | 'missing-power'
  | 'motor-no-contactor'
  | 'estop-not-wired'
  | 'coil-no-return';

export interface CircuitWarning {
  severity: WarningSeverity;
  code: WarningCode;
  componentId?: string;
  message: string;
}

export interface VerificationResult {
  errors: CircuitWarning[];
  warnings: CircuitWarning[];
  componentsChecked: number;
}

export function verifyCircuit(
  components: CanvasComponent[],
  wires: CanvasWire[],
): VerificationResult { ... }
```

Rules to implement:

1. **Unconnected PLC outputs (warning)**: For each PLC CPU DO/AO pin, check if at least one wire connects from it. If not, warn "DO{n} is configured in code but not wired to any component."

2. **Output conflict (error)**: Build adjacency graph from wires. If two DO pins are wired to the same component input pin, error "Multiple outputs driving {component}.{pin}."

3. **Relay/contactor coil without return path (warning)**: If a relay's COIL+ is wired but COIL- is not (or vice versa), warn "Relay {id} coil is not fully wired."

4. **Motor without contactor (warning)**: If a motor-3phase is wired directly to PLC DO pins without an intervening contactor, warn "Motor {id} should be driven through a contactor, not directly from PLC outputs."

5. **Emergency stop not wired (warning)**: If an emergency-stop component exists but has no wires, warn "Emergency stop {id} is placed but not wired."

6. **Missing ground on indicator (warning)**: If an indicator-light has its anode wired but cathode unwired (or vice versa), warn "Indicator {id} is not fully wired."

**Task 3B: DrcVerificationModal.tsx**

Create `frontend/src/components/DrcVerificationModal.tsx`:

```typescript
interface Props {
  result: VerificationResult;
  onCancel: () => void;
  onRunAnyway: () => void;
}
```

Styled with AIPLC design tokens:
- White card (`var(--color-bg)`) with shadow (`var(--shadow-lg)`)
- Error badge: `var(--color-red)` pill
- Warning badge: `var(--color-yellow)` pill
- "Cancel" = primary blue button
- "Run Anyway" = outlined secondary button
- Max height 400px with scroll

Reference: `velxio/frontend/src/components/simulator/CircuitVerificationModal.tsx`

**Task 3C: Header.tsx Run flow change**

Update `Header.tsx` `handleRun`:

```typescript
const handleRun = () => {
  if (isSimulating) {
    setIsSimulating(false);
    return;
  }
  // Run DRC before starting simulation
  const { components, wires } = useAppStore.getState();
  const result = verifyCircuit(components, wires);
  if (result.errors.length > 0) {
    setDrcResult(result);  // show modal
    return;
  }
  if (result.warnings.length > 0) {
    setDrcResult(result);  // show modal (user can dismiss)
    return;
  }
  setIsSimulating(true);
};
```

Add state:
```typescript
const [drcResult, setDrcResult] = useState<VerificationResult | null>(null);
```

Render:
```tsx
{drcResult && (
  <DrcVerificationModal
    result={drcResult}
    onCancel={() => setDrcResult(null)}
    onRunAnyway={() => { setDrcResult(null); setIsSimulating(true); }}
  />
)}
```

---

### Batch 4: UX Polish (depends on Batch 2 for layout)

**Task 4A: Wire selection support**

Currently only components can be selected. Add wire selection:

Add to `useAppStore`:
```typescript
selectedWireId: string | null;
setSelectedWireId: (id: string | null) => void;
```

In `CanvasPanel.tsx`:
- Each `WirePath` gets an invisible fat stroke (12px, transparent) for hit testing, with `onClick` to select
- Selected wire: rendered with blue dashed stroke overlay
- Delete key removes selected wire (using `recordRemoveWire` from undo system)
- Click on empty space deselects wire

**Task 4B: Resize handle hover effects**

Update the vertical (bottom panel) resize handle in `App.tsx`:
- Default: grip is `var(--color-border)`
- Hover: grip transitions to `var(--color-text-secondary)`, handle background brightens slightly
- Active (dragging): grip becomes `var(--color-blue)`
- CSS transition: 150ms

Same treatment for the horizontal splitter.

**Task 4C: CSS micro-animations**

Add to `index.css`:
```css
/* Bottom panel tab underline slide */
.bottom-tab-indicator {
  transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Component palette button hover lift */
.palette-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
  transition: transform 0.15s, box-shadow 0.15s;
}

/* Selection highlight pulse */
@keyframes selection-pulse {
  0%, 100% { stroke-opacity: 0.6; }
  50% { stroke-opacity: 1; }
}
.component-selected rect {
  animation: selection-pulse 1.5s ease-in-out infinite;
}

/* Modal backdrop fade */
.modal-backdrop {
  animation: fadeIn 0.15s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Task 4D: Compilation console wiring**

Wire the compile API response to the CompileLogsStore:
- When user presses Run and code needs compiling:
  1. `clear()` the compile logs
  2. `appendLogs([{ type: 'info', message: 'Compiling...', timestamp: Date.now() }])`
  3. On compile success: `appendLogs([{ type: 'success', message: 'Compilation successful', ... }])`
  4. On compile error: `appendLogs([{ type: 'error', message: stderr, ... }])`
  5. Auto-open the console tab when errors occur
  6. Auto-switch bottom tab to 'console' on error

---

## Appendix A: Key Velxio File Quick Reference

| Purpose | Velxio Path |
|---------|-------------|
| Main layout | `velxio/frontend/src/pages/EditorPage.tsx` |
| Simulator canvas | `velxio/frontend/src/components/simulator/SimulatorCanvas.tsx` |
| Wire utils | `velxio/frontend/src/utils/wireUtils.ts` |
| Wire preview | `velxio/frontend/src/components/simulator/WireInProgressRenderer.tsx` |
| Wire layer | `velxio/frontend/src/components/simulator/WireLayer.tsx` |
| Pin overlay | `velxio/frontend/src/components/simulator/PinOverlay.tsx` |
| Property dialog | `velxio/frontend/src/components/simulator/ComponentPropertyDialog.tsx` |
| Selection action bar | `velxio/frontend/src/components/simulator/SelectionActionBar.tsx` |
| Circuit verifier | `velxio/frontend/src/simulation/verify/circuitVerifier.ts` |
| Verification modal | `velxio/frontend/src/components/simulator/CircuitVerificationModal.tsx` |
| Minimap | `velxio/frontend/src/components/simulator/CanvasMinimap.tsx` |
| Compile console | `velxio/frontend/src/components/editor/CompilationConsole.tsx` |
| Serial batcher | `velxio/frontend/src/store/serialBatcher.ts` |
| Compile logs store | `velxio/frontend/src/store/useCompileLogsStore.ts` |
| Simulator store | `velxio/frontend/src/store/useSimulatorStore.ts` |
| Editor store | `velxio/frontend/src/store/useEditorStore.ts` |
| Analytics | `velxio/frontend/src/utils/analytics.ts` |
| MCP server | `velxio/backend/app/mcp/server.py` |
| App CSS | `velxio/frontend/src/App.css` |
| Pro overlay stubs | `velxio/frontend/src/lib/proSaveAction.ts`, `proBoardGate.ts`, `proSession.ts`, `proRoutes.ts` |
| Examples data | `velxio/frontend/src/data/examples.ts` |
| Dockerfile | `velxio/Dockerfile.standalone` |

## Appendix B: Current AIPLC File Map

| File | Role | Status |
|------|------|--------|
| `frontend/src/App.tsx` | Main layout | 2-column top + tabbed bottom |
| `frontend/src/store/useAppStore.ts` | Central Zustand store | Has: code, messages, components, wires, serial, bottomPanel. Missing: undo, compile logs, editorWidth |
| `frontend/src/components/Header.tsx` | Top bar with Run/Settings | No DRC, no compile feedback |
| `frontend/src/components/EditorPanel.tsx` | Monaco editor with aiplc.h autocomplete | Working |
| `frontend/src/components/ChatPanel.tsx` | AI chat with MCP tool result application | Working |
| `frontend/src/components/CanvasPanel.tsx` | SVG canvas with 11 component types, wiring, drag | Working but no zoom/pan/rotation/undo |
| `frontend/src/components/SerialMonitor.tsx` | Serial output display | Working |
| `frontend/src/components/McpSettingsModal.tsx` | MCP server configuration | Working |
| `frontend/src/index.css` | Design tokens + global styles | Google Slides theme established |
| `backend/app/main.py` | FastAPI entry | Working |
| `backend/app/api/routes/agent.py` | AI chat endpoint | Working with LiteLLM |
| `backend/app/api/routes/compile.py` | Compile endpoint | Stub (needs STM32duino wiring) |
| `backend/app/api/routes/mcp.py` | MCP SSE endpoint | Working |
| `backend/app/services/mcp_tools.py` | 12 MCP tools | Working |
| `backend/app/services/llm_client.py` | LiteLLM proxy client | Working |
| `backend/app/services/skill_retriever.py` | RAG over skill markdown files | Working |
