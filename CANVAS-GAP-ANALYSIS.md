# AIPLC Canvas Gap Analysis vs Velxio SimulatorCanvas

> Generated: 2026-06-03
> Velxio source: `velxio/frontend/src/components/simulator/SimulatorCanvas.tsx` (3136 lines) + wire/pin/minimap utilities
> AIPLC source: `frontend/src/store/useAppStore.ts` + `CanvasPanel.tsx` (1190 lines)

---

## 1. Feature-by-Feature Comparison Table

### 1.1 Zoom & Pan

| # | Feature | Velxio | AIPLC | Gap |
|---|---------|--------|-------|-----|
| 1 | Zoom via mouse wheel (cursor-centered) | SimulatorCanvas L446-466 | -- | :x: Not implemented |
| 2 | Zoom via toolbar buttons (+/-) | SimulatorCanvas L1692-1715 | -- | :x: Not implemented |
| 3 | Zoom via pinch-to-zoom (touch) | SimulatorCanvas L481-503, L705-729 | -- | :x: Not implemented |
| 4 | Zoom percentage display + reset-to-100% click | SimulatorCanvas L1717-1722, L2252-2310 | -- | :x: Not implemented |
| 5 | Pan via mouse drag (left/middle/right click on empty canvas) | SimulatorCanvas L1586-1610, L1322-1338 | -- | :x: Not implemented |
| 6 | Pan via single-finger touch | SimulatorCanvas L619-628, L758-769 | -- | :x: Not implemented |
| 7 | Reset view (zoom=1, pan=0,0) | SimulatorCanvas L1717-1722 | -- | :x: Not implemented |
| 8 | Auto-fit on project load | SimulatorCanvas L1805-1894 | -- | :x: Not implemented |
| 9 | Ref-based DOM transform for zero-lag panning | SimulatorCanvas L1586-1610 | -- | :x: Not implemented |

### 1.2 Component Interaction

| # | Feature | Velxio | AIPLC | Gap |
|---|---------|--------|-------|-----|
| 10 | Component dragging (mouse) | SimulatorCanvas L1284-1320 | CanvasPanel L794-827 | :white_check_mark: Implemented (with 5px grid snap) |
| 11 | Component dragging (touch) | SimulatorCanvas L563-579 | -- | :x: Not implemented |
| 12 | Component selection (single click) | SimulatorCanvas L192-193 | CanvasPanel L736, L807 | :white_check_mark: Implemented |
| 13 | Component deletion (keyboard Delete/Backspace) | SimulatorCanvas L1206-1232 | CanvasPanel L891-911 | :white_check_mark: Implemented |
| 14 | Component deletion (toolbar button) | SimulatorCanvas (via SelectionActionBar) | CanvasPanel L961-977 | :white_check_mark: Implemented |
| 15 | Component rotation (90 degrees) | SimulatorCanvas L1269-1282 | -- | :x: Not implemented |
| 16 | Component placement from picker | SimulatorCanvas L1234-1265 | CanvasPanel L782-791 | :large_orange_diamond: Partial -- button click adds at computed position; no drag-from-palette, no viewport-aware placement |
| 17 | Component property dialog | ComponentPropertyDialog.tsx (full dialog) | -- | :x: Not implemented (AIPLC has no property editing UI on canvas) |
| 18 | Two-step delete confirmation | ComponentPropertyDialog L63, L252-294 | -- | :x: Not implemented (delete is immediate) |
| 19 | Click-outside-to-close / Escape-to-close dialogs | ComponentPropertyDialog L96-124 | -- | :x: Not implemented (no dialogs) |
| 20 | Hover tracking for pin overlays | SimulatorCanvas L196-198 | CanvasPanel L739, L1073-1074 | :white_check_mark: Implemented |
| 21 | Mouse cursor state management | SimulatorCanvas L2416-2424 | CanvasPanel L1005-1007 | :large_orange_diamond: Partial -- crosshair during wiring, grabbing during drag; missing wire-hover pointer |
| 22 | Mouse leave handler (cancel drag/pan) | SimulatorCanvas L2366-2370 | -- | :x: Not implemented |
| 23 | Empty state message | (not explicitly noted) | CanvasPanel L1029-1042 | :white_check_mark: AIPLC has this, Velxio may not |
| 24 | DRC error highlighting (components + wires) | (not in SimulatorCanvas) | CanvasPanel L724-725, L1092-1105, L640-647 | :white_check_mark: AIPLC has this (unique feature) |

### 1.3 Wire System

| # | Feature | Velxio | AIPLC | Gap |
|---|---------|--------|-------|-----|
| 25 | Wire creation via pin clicks (two-click) | SimulatorCanvas L1724-1754 | CanvasPanel L847-876 | :white_check_mark: Implemented |
| 26 | Wire in-progress preview | WireInProgressRenderer.tsx (triple-layer) | CanvasPanel L650-695 (dashed cyan) | :large_orange_diamond: Partial -- single-layer dashed preview vs triple-layer with markers |
| 27 | Wire rendering (committed wires) | WireLayer.tsx L77-87 (via WireRenderer) | CanvasPanel L615-648 (WirePath) | :large_orange_diamond: Partial -- basic L-shaped routing only, no triple-layer rendering |
| 28 | Orthogonal wire routing with waypoints | wireUtils.ts L65-142 | CanvasPanel L623-634 | :large_orange_diamond: Partial -- fixed midpoint L-shape only, no waypoints |
| 29 | Wire selection (mouse click) | SimulatorCanvas L2386-2395 | -- | :x: Not implemented |
| 30 | Wire selection (touch tap) | SimulatorCanvas L943-977 | -- | :x: Not implemented |
| 31 | Wire deletion (keyboard) | SimulatorCanvas L1765-1768 | -- | :x: Not implemented |
| 32 | Wire deletion (toolbar) | SelectionActionBar | -- | :x: Not implemented |
| 33 | Wire color system (15 colors, auto-color from pin name) | wireUtils.ts L7-52 | -- | :x: Not implemented (all wires same color) |
| 34 | Wire color keyboard shortcuts (0-9, c, l, m, p, y) | SimulatorCanvas L1769-1777 | -- | :x: Not implemented |
| 35 | Wire hover detection / highlight | wireHitDetection.ts L100-116 | -- | :x: Not implemented |
| 36 | Wire waypoint insertion (mouse click during creation) | SimulatorCanvas L2375-2380 | -- | :x: Not implemented |
| 37 | Wire waypoint insertion (double-click on existing wire) | SimulatorCanvas L2397-2415 | -- | :x: Not implemented |
| 38 | Wire segment drag (perpendicular movement) | wireUtils.ts L246-284, SimulatorCanvas L1364-1386 | -- | :x: Not implemented |
| 39 | Wire waypoint drag (free 2D) | SimulatorCanvas L1389-1435 | -- | :x: Not implemented |
| 40 | Wire segment handles (draggable midpoints) | WireLayer.tsx L118-137 | -- | :x: Not implemented |
| 41 | Wire waypoint handles (draggable bend points) | WireLayer.tsx L139-158 | -- | :x: Not implemented |
| 42 | Alignment guides / snap during wire editing | wireHitDetection.ts L178-219, WireLayer.tsx L89-116 | -- | :x: Not implemented |
| 43 | Wire path simplification (collinear/U-turn collapse) | wireUtils.ts L296-341 | -- | :x: Not implemented |
| 44 | Wire hit detection (point-to-segment distance) | wireHitDetection.ts L83-97 | -- | :x: Not implemented |
| 45 | Escape to cancel wire creation | SimulatorCanvas L1759-1762 | CanvasPanel L897-900 | :white_check_mark: Implemented |
| 46 | Right-click to cancel wire creation | SimulatorCanvas L2371-2374 | CanvasPanel L879-888 | :white_check_mark: Implemented |
| 47 | Same-component wiring prevention | (implicit in pin validation) | CanvasPanel L862 | :white_check_mark: Implemented |

### 1.4 Pin System

| # | Feature | Velxio | AIPLC | Gap |
|---|---------|--------|-------|-----|
| 48 | Pin overlays on hover/selection/wiring | PinOverlay.tsx + SimulatorCanvas L1896-2002 | CanvasPanel L1108-1182 | :white_check_mark: Implemented |
| 49 | Pin visual states (source/target/hover/default) | PinOverlay.tsx L177-184 | CanvasPanel L1137-1155 | :white_check_mark: Implemented |
| 50 | Pin tooltip on hover | PinOverlay.tsx L185 (native title) | CanvasPanel L1157-1179 (SVG label) | :white_check_mark: Implemented (AIPLC has richer SVG tooltip) |
| 51 | Touch-adaptive pin hit-target sizing | PinOverlay.tsx L14-26 (inverse zoom scaling) | -- | :x: Not implemented |
| 52 | Rotation-aware pin positioning | PinOverlay.tsx L123-138 | -- | :x: Not applicable (no rotation in AIPLC) |
| 53 | Touch-friendly pin picker dialog | SimulatorCanvas L200-206, L2597-2682 | -- | :x: Not implemented |
| 54 | Pin coordinate discovery from DOM (web components) | PinOverlay.tsx L70-92 | -- | :x: Not applicable (AIPLC uses hardcoded pin defs) |

### 1.5 Undo/Redo

| # | Feature | Velxio | AIPLC | Gap |
|---|---------|--------|-------|-----|
| 55 | Undo/Redo command stack (50-deep ring buffer) | useSimulatorStore L759-763, L868-880, L2474-2530 | -- | :x: Not implemented |
| 56 | Undo/Redo toolbar buttons with tooltips | SimulatorCanvas L2087-2112 | -- | :x: Not implemented |
| 57 | recordAddComponent (undo cascades wire removal) | useSimulatorStore L2538-2554 | -- | :x: Not implemented |
| 58 | recordRemoveComponent (undo restores component + wires) | useSimulatorStore L2556-2580 | -- | :x: Not implemented |
| 59 | recordMove (undo/redo with wire position update) | useSimulatorStore L2582-2608 | -- | :x: Not implemented |
| 60 | recordRotate | useSimulatorStore L2610-2640 | -- | :x: Not implemented |
| 61 | recordSetProperty | useSimulatorStore L2642-2665 | -- | :x: Not implemented |
| 62 | recordAddWire / recordRemoveWire / recordUpdateWire | useSimulatorStore L2667-2708 | -- | :x: Not implemented |

### 1.6 Minimap

| # | Feature | Velxio | AIPLC | Gap |
|---|---------|--------|-------|-----|
| 63 | Minimap overview (100x75px, bottom-right) | CanvasMinimap.tsx | -- | :x: Not implemented |
| 64 | Minimap viewport rectangle (red overlay) | CanvasMinimap L233-240 | -- | :x: Not implemented |
| 65 | Minimap teleport navigation (click outside viewport rect) | CanvasMinimap L129-140 | -- | :x: Not implemented |
| 66 | Minimap drag-to-pan | CanvasMinimap L142-198 | -- | :x: Not implemented |
| 67 | Minimap ResizeObserver for accurate viewport tracking | CanvasMinimap L64-76 | -- | :x: Not implemented |

### 1.7 Touch Support

| # | Feature | Velxio | AIPLC | Gap |
|---|---------|--------|-------|-----|
| 68 | Touch component dragging | SimulatorCanvas L563-579, L771-795 | -- | :x: Not implemented |
| 69 | Touch wire creation (tap pins) | SimulatorCanvas (touch pin picker) | -- | :x: Not implemented |
| 70 | Touch wire waypoint insertion | SimulatorCanvas L919-941 | -- | :x: Not implemented |
| 71 | Touch wire selection | SimulatorCanvas L943-977 | -- | :x: Not implemented |
| 72 | Touch segment/waypoint handle dragging | SimulatorCanvas L735-745, L833-849 | -- | :x: Not implemented |
| 73 | Touch-safe action bar (useTouchSafeAction hook) | SelectionActionBar L103-123 | -- | :x: Not implemented |
| 74 | Long-press context menu on touch | SimulatorCanvas L379-388, L596-608 | -- | :x: Not implemented |
| 75 | Drag-promote from interactive passthrough | SimulatorCanvas L536-548, L636-686 | -- | :x: Not applicable |
| 76 | Selection action bar (floating touch toolbar) | SelectionActionBar.tsx | -- | :x: Not implemented |

### 1.8 UI Chrome & Toolbar

| # | Feature | Velxio | AIPLC | Gap |
|---|---------|--------|-------|-----|
| 77 | Zoom controls toolbar (+/-/percentage) | SimulatorCanvas L2252-2310 | -- | :x: Not implemented |
| 78 | Component count display | SimulatorCanvas L2312-2331 | -- | :x: Not implemented |
| 79 | Add component button (opens picker modal) | SimulatorCanvas L2333-2354 | CanvasPanel L917-995 (inline palette) | :large_orange_diamond: Partial -- inline button bar vs modal picker |
| 80 | Board selector dropdown | SimulatorCanvas L2058-2081 | -- | :x: Not applicable |
| 81 | Wire mode banner (cancel button + instruction text) | SimulatorCanvas L2521-2527 | CanvasPanel L978-994 | :white_check_mark: Implemented (status text in toolbar) |

### 1.9 Store Architecture

| # | Feature | Velxio | AIPLC | Gap |
|---|---------|--------|-------|-----|
| 82 | Component CRUD operations | useSimulatorStore (full CRUD + batch) | useAppStore L185-199 | :white_check_mark: Implemented |
| 83 | Wire CRUD operations | useSimulatorStore (full CRUD + batch) | useAppStore L200-205 | :large_orange_diamond: Partial -- add/remove/set but no update-in-place |
| 84 | Cascade delete (remove component removes attached wires) | useSimulatorStore | useAppStore L187-193 | :white_check_mark: Implemented |
| 85 | Selection state in store | useSimulatorStore (selectedComponentId, selectedWireId) | -- | :x: Not in store (local state in CanvasPanel) |
| 86 | Undo/redo state in store | useSimulatorStore L868-880 | -- | :x: Not implemented |
| 87 | Wire update (color, waypoints, partial mutation) | useSimulatorStore (updateWire, recordUpdateWire) | -- | :x: Not implemented |
| 88 | Component property update in store | (via updateComponent) | -- | :x: Not in store (only position update exists) |

### 1.10 Canvas Infrastructure

| # | Feature | Velxio | AIPLC | Gap |
|---|---------|--------|-------|-----|
| 89 | Coordinate conversion (toWorld) | SimulatorCanvas L391-398 | -- | :x: Not needed yet (no zoom/pan) |
| 90 | ResizeObserver for dynamic viewBox | (via CSS/refs) | CanvasPanel L742-753 | :white_check_mark: Implemented |
| 91 | Dot grid background | (CSS pattern) | CanvasPanel L1013-1026 | :white_check_mark: Implemented |
| 92 | Context menu prevention | SimulatorCanvas L2371-2374 | CanvasPanel L879-888 | :white_check_mark: Implemented |

### 1.11 Velxio-Specific (Not Applicable to AIPLC)

| # | Feature | Velxio | AIPLC | Gap |
|---|---------|--------|-------|-----|
| 93 | Sensor control panel (runtime) | SimulatorCanvas L2426-2447 | -- | N/A (different domain) |
| 94 | Custom chip dialog | SimulatorCanvas L2756-2782 | -- | N/A |
| 95 | Serial monitor toggle | SimulatorCanvas L2114-2137 | -- | N/A |
| 96 | Oscilloscope toggle | SimulatorCanvas L2229-2248 | -- | N/A |
| 97 | WiFi/BLE status indicators | SimulatorCanvas L2144-2227 | -- | N/A |
| 98 | ESP32-CAM camera toggle | SimulatorCanvas L2139-2142 | -- | N/A |
| 99 | Flash modal (Tauri) | SimulatorCanvas L3014-3037 | -- | N/A |
| 100 | Board options modal (ESP32) | SimulatorCanvas L3039-3056 | -- | N/A |
| 101 | ESP32 crash notification | SimulatorCanvas L2006-2044 | -- | N/A |
| 102 | Pin-to-component subscription system | SimulatorCanvas L1000-1105 | -- | N/A |
| 103 | Board built-in LED subscription | SimulatorCanvas L1107-1140 | -- | N/A |
| 104 | ESP32 input forwarding | SimulatorCanvas L1142-1204 | -- | N/A |
| 105 | Board-less SPICE interaction mode | SimulatorCanvas L265-281 | -- | N/A |
| 106 | Electrical overlay (SPICE visualization) | SimulatorCanvas L2517-2518 | -- | N/A |
| 107 | Runtime property change listener | SimulatorCanvas L405-424 | -- | N/A |
| 108 | Header portal support | SimulatorCanvas L93-101 | -- | N/A |
| 109 | Board context menu (right-click) | SimulatorCanvas L2808-3012 | -- | N/A |
| 110 | Board removal confirmation dialog | SimulatorCanvas L3058-3132 | -- | N/A |

---

## 2. Critical Missing Features (Must-Have for Usable Product)

These are features whose absence makes the canvas feel broken, amateur, or unusable for real work.

### 2.1 Zoom & Pan

**What it does in Velxio:**
- `SimulatorCanvas.tsx` L446-466 (wheel zoom), L1586-1610 (mouse pan), L1692-1722 (zoom buttons + reset)
- Cursor-centered zoom clamped to [0.1, 5], ref-based DOM transform for zero-lag panning, commit to React state on mouseup.

**Why it matters:**
Without zoom and pan, the canvas is limited to whatever fits in the initial viewport. Users cannot work on large circuits, cannot zoom in for precision wiring, and cannot zoom out for an overview. This is the single most impactful missing feature -- every professional schematic/diagram editor has this. The current AIPLC canvas is essentially a fixed-viewport drawing surface.

**Estimated effort:** 2-3 days
- Add `zoom` and `pan` state (or refs for performance) to the store or CanvasPanel
- Apply CSS `transform: translate(panX, panY) scale(zoom)` to the world container
- Add wheel handler for cursor-centered zoom
- Add mouse drag handler for panning on empty canvas
- Add `toWorld()` coordinate conversion utility
- Update all mouse event handlers to convert screen coords to world coords
- Add zoom toolbar (+/- buttons, percentage display, reset)

### 2.2 Undo/Redo System

**What it does in Velxio:**
- `useSimulatorStore.ts` L759-763 (CanvasCommand interface), L2474-2530 (push/undo/redo/canUndo/canRedo/clear), L2532-2708 (8 recorded action types)
- 50-deep ring buffer with command pattern; each action stores execute() and undo() closures; redo branch truncation on new action.

**Why it matters:**
Without undo/redo, every mistake is permanent -- accidentally deleted a component and its wires? Start over. Moved something to the wrong place? Manually reposition. This is a fundamental UX expectation in ANY editor application. Its absence makes the tool feel like a toy.

**Estimated effort:** 3-4 days
- Define `CanvasCommand` interface with `execute()` / `undo()` / `description`
- Add `history[]`, `historyIndex`, `pushCommand()`, `undo()`, `redo()` to the store
- Wrap each mutation (add/remove/move component, add/remove wire) in `record*` methods
- Add Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts
- Add undo/redo buttons to the toolbar with tooltip showing next action description
- Ensure component removal cascades wire deletion atomically in both execute and undo

### 2.3 Wire Selection & Deletion

**What it does in Velxio:**
- `wireHitDetection.ts` L83-116 (point-to-segment distance, findWireNearPoint)
- `SimulatorCanvas.tsx` L2386-2395 (mouse click selection), L1765-1768 (keyboard deletion)
- `SelectionActionBar.tsx` (delete button for selected wire)

**Why it matters:**
AIPLC currently has NO way to select or delete a wire after it has been placed. If a user connects the wrong pins, the only recourse is to delete one of the components (losing all its other connections) and re-add it. This is a critical workflow blocker.

**Estimated effort:** 2-3 days
- Implement `distToSegment()` and `findWireNearPoint()` hit detection
- Add `selectedWireId` state
- Add click handler on canvas background that performs wire hit-testing
- Visual highlight on selected wire (thicker stroke, different color)
- Delete selected wire on Delete/Backspace key
- Add delete button to toolbar when wire is selected

### 2.4 Component Rotation

**What it does in Velxio:**
- `SimulatorCanvas.tsx` L1269-1282 (handleRotateComponent: 90-degree increments, recorded for undo)
- `DynamicComponent.tsx` render output uses CSS `rotate()` transform
- `PinOverlay.tsx` L123-138 (rotation-aware pin coordinate transform)

**Why it matters:**
Without rotation, all components are locked in a single orientation. For PLC/electrical schematics this severely limits layout options. Users need to orient components to create clean, readable diagrams with logical signal flow (typically left-to-right or top-to-bottom).

**Estimated effort:** 2 days
- Add `rotation` field to `CanvasComponent` (0, 90, 180, 270)
- Apply SVG `transform="rotate()"` in component rendering
- Update `getPinWorldPos()` to account for rotation (2D rotation matrix around component center)
- Add rotation button to toolbar / keyboard shortcut (R key)
- Update wire endpoint recalculation after rotation

### 2.5 Component Property Editing on Canvas

**What it does in Velxio:**
- `ComponentPropertyDialog.tsx` -- floating dialog with pin list, editable properties (select/text/number controls), rotate button, two-step delete confirmation
- Opened by clicking a component; positioned relative to component with viewport clamping

**Why it matters:**
AIPLC components have a `properties` field (e.g., resistor value, indicator color) but there is no UI to edit these on the canvas. Users can only set properties if AI generates them. For a circuit editor, being able to change component values (resistance, normally-open vs normally-closed, light color) is essential.

**Estimated effort:** 2-3 days
- Create a floating property panel component
- Read component metadata to determine editable properties and control types
- Render appropriate inputs (dropdown, text, number)
- Position relative to selected component with viewport clamping
- Wire up property changes to store (add `updateComponentProperty` action)

### 2.6 Wire Routing with Waypoints

**What it does in Velxio:**
- `wireUtils.ts` L65-142 (generateOrthogonalPath with waypoints, generatePreviewPath with smart elbow)
- Wire data model includes `waypoints: {x,y}[]` array
- Users can click during creation to add waypoints; double-click existing wire to insert waypoints

**Why it matters:**
AIPLC wires use a fixed L-shape (horizontal-then-vertical) between two pins. This produces visually messy and often overlapping wire paths. Users cannot route wires around components or create clean parallel runs. Professional schematic editors always allow manual wire routing.

**Estimated effort:** 3-4 days
- Add `waypoints: {x: number, y: number}[]` field to `CanvasWire`
- Update wire rendering to draw through waypoints (series of L-segments)
- Allow clicking during wire creation to insert waypoints
- Update wire preview to show the path-so-far plus cursor segment
- Implement path simplification to clean up collinear/redundant waypoints

---

## 3. Nice-to-Have Features (Can Add Later)

### 3.1 Minimap

**What it does in Velxio:** `CanvasMinimap.tsx` -- 100x75px overview with viewport rectangle, teleport click, drag-to-pan, ResizeObserver tracking.

**Why it matters:** Helps orientation in large circuits. Not critical for small-to-medium diagrams. Becomes important once zoom/pan is implemented and circuits grow beyond one screenful.

**Estimated effort:** 2 days (after zoom/pan is done)

### 3.2 Wire Color System

**What it does in Velxio:** `wireUtils.ts` L7-52 -- 15 colors, auto-color from pin name (GND=black, VCC=red, signal=green), keyboard shortcuts for color change.

**Why it matters:** Color-coded wires significantly improve readability of complex circuits. Auto-coloring from pin names is a nice usability touch. However, AIPLC's PLC domain may benefit from different color conventions (e.g., phase colors for 3-phase motor wiring).

**Estimated effort:** 1-2 days

### 3.3 Wire Segment & Waypoint Dragging

**What it does in Velxio:** `SimulatorCanvas.tsx` L1364-1435 (segment drag, waypoint drag) + `wireUtils.ts` L225-284 (computeDragWaypoints, moveSegment) -- drag wire midpoints perpendicular to their orientation; free 2D drag of bend points.

**Why it matters:** Enables fine-tuning wire layout after initial placement. Very useful but requires waypoint support first.

**Estimated effort:** 2-3 days (after waypoints are done)

### 3.4 Alignment Guides / Snap

**What it does in Velxio:** `wireHitDetection.ts` L178-219 -- collects x/y coordinates from all wire endpoints/waypoints, snaps dragged values to nearby alignment points within 6 world-units threshold, renders dashed guide lines.

**Why it matters:** Professional feel, helps create tidy diagrams. Not blocking any workflow.

**Estimated effort:** 1-2 days (after wire editing is done)

### 3.5 Touch Device Support

**What it does in Velxio:** Full parallel touch input handling (pinch zoom, single-finger pan, touch drag, long-press context menu, touch-safe action hooks, PinPickerDialog for large tap targets, adaptive hit-target sizing).

**Why it matters:** Important for tablet users. However, PLC programming is primarily a desktop activity. Can be deferred until desktop experience is solid.

**Estimated effort:** 5-7 days (pervasive changes across all interaction handlers)

### 3.6 Selection Action Bar (Floating Toolbar)

**What it does in Velxio:** `SelectionActionBar.tsx` -- floating top-center toolbar showing selected item label, delete/rotate/deselect/color-change buttons with touch-safe event handling.

**Why it matters:** Great UX especially on touch devices. On desktop, keyboard shortcuts + existing toolbar cover most actions.

**Estimated effort:** 1-2 days

### 3.7 Wire Hover Detection & Highlight

**What it does in Velxio:** `SimulatorCanvas.tsx` L1437-1443, `wireHitDetection.ts` -- on mousemove, performs hit detection to highlight wires under cursor, changes cursor to pointer.

**Why it matters:** Provides visual feedback that wires are interactive. Enhances discoverability of wire selection.

**Estimated effort:** 1 day (after wire hit detection is built for selection)

### 3.8 Auto-fit on Project Load

**What it does in Velxio:** `SimulatorCanvas.tsx` L1805-1894 -- after detecting a component count jump (project load), centers viewport on all content with padding.

**Why it matters:** Good UX when opening saved projects. Without it, loaded circuits may appear off-screen.

**Estimated effort:** 0.5 day (after zoom/pan is done)

### 3.9 Component Count Display

**What it does in Velxio:** `SimulatorCanvas.tsx` L2312-2331 -- shows number of components in toolbar.

**Why it matters:** Minor informational feature. Low impact.

**Estimated effort:** 0.5 day

### 3.10 Wire In-Progress Triple-Layer Rendering

**What it does in Velxio:** `WireInProgressRenderer.tsx` -- dark outline + colored wire + dashed overlay for high-contrast in-progress wire preview with pin/waypoint/cursor markers.

**Why it matters:** Better visual quality than AIPLC's single-layer dashed cyan preview. Purely cosmetic improvement.

**Estimated effort:** 0.5 day

---

## 4. Implementation Priority List

Ordered by impact and dependency chain. Each item notes what it depends on.

| Priority | Feature | Depends On | Est. Effort | Rationale |
|----------|---------|------------|-------------|-----------|
| **P0-1** | **Zoom & Pan** | Nothing | 2-3 days | Foundational. Every subsequent feature (minimap, auto-fit, coordinate conversion) depends on this. Without it, the canvas is unusable for non-trivial circuits. |
| **P0-2** | **Undo/Redo System** | Nothing (store changes only) | 3-4 days | Foundational UX. Every editing action should be undoable. Better to build this early so all subsequent features can integrate with it from the start. |
| **P0-3** | **Wire Selection & Deletion** | Wire hit detection utility | 2-3 days | Critical workflow fix. Currently impossible to remove a wire without deleting a component. |
| **P0-4** | **Component Rotation** | Pin position calculation update | 2 days | Essential for readable schematics. Components locked in one orientation severely limits layout quality. |
| **P0-5** | **Component Property Editing** | Store: `updateComponentProperty` action | 2-3 days | Essential for functional circuits. Users need to set resistor values, button types, indicator colors. |
| **P0-6** | **Wire Routing with Waypoints** | Wire data model update, path rendering | 3-4 days | Essential for clean diagrams. Fixed L-shape routing produces unreadable wire crossings in any non-trivial circuit. |
| **P1-1** | Wire Hover Detection & Highlight | Wire hit detection (from P0-3) | 1 day | Low effort, leverages existing hit detection code. Makes wires feel interactive. |
| **P1-2** | Wire Color System | Wire data model (add `color` field) | 1-2 days | Significant readability improvement. Auto-color from pin name is especially valuable for PLC (24V=red, GND=blue/black). |
| **P1-3** | Selection Action Bar | Selection state | 1-2 days | Better UX for selected items, especially for wire color changes. |
| **P1-4** | Wire Segment & Waypoint Dragging | Waypoints (P0-6), alignment snap | 2-3 days | Enables wire layout fine-tuning after placement. |
| **P1-5** | Alignment Guides / Snap | Wire editing (P1-4) | 1-2 days | Professional polish. Makes diagrams tidy. |
| **P1-6** | Auto-fit on Project Load | Zoom/Pan (P0-1) | 0.5 day | Good UX, trivial to add once zoom/pan exists. |
| **P2-1** | Minimap | Zoom/Pan (P0-1) | 2 days | Useful for large circuits. Not critical for initial release. |
| **P2-2** | Mouse Leave Handler | Drag/pan state cleanup | 0.5 day | Edge case fix. Prevents stuck drag state. |
| **P2-3** | Triple-Layer Wire Rendering | Waypoints (P0-6) | 0.5 day | Visual polish. |
| **P2-4** | Component Count Display | Nothing | 0.5 day | Trivial nice-to-have. |
| **P3-1** | Touch Support (full) | All interaction features (P0-P1) | 5-7 days | Important for tablet users but PLC is desktop-primary. Build after all mouse interactions are solid. |

### Dependency Graph

```
Nothing
  |
  +-- P0-1 Zoom & Pan
  |     |
  |     +-- P1-6 Auto-fit on Load
  |     +-- P2-1 Minimap
  |
  +-- P0-2 Undo/Redo System
  |     (integrate into all subsequent features)
  |
  +-- P0-3 Wire Selection & Deletion
  |     |
  |     +-- P1-1 Wire Hover Detection
  |     +-- P1-2 Wire Color System
  |           |
  |           +-- P1-3 Selection Action Bar
  |
  +-- P0-4 Component Rotation
  |
  +-- P0-5 Component Property Editing
  |
  +-- P0-6 Wire Routing with Waypoints
        |
        +-- P1-4 Wire Segment/Waypoint Dragging
        |     |
        |     +-- P1-5 Alignment Guides
        |
        +-- P2-3 Triple-Layer Wire Rendering
```

### Total Estimated Effort

| Tier | Features | Days |
|------|----------|------|
| P0 (Must-have) | Zoom/Pan, Undo/Redo, Wire Selection, Rotation, Properties, Waypoints | 15-19 days |
| P1 (Should-have) | Wire Hover, Colors, Action Bar, Segment Drag, Alignment, Auto-fit | 6-10 days |
| P2 (Nice-to-have) | Minimap, Mouse Leave, Triple-Layer Wire, Component Count | 3-4 days |
| P3 (Deferred) | Full Touch Support | 5-7 days |
| **Total** | | **29-40 days** |

---

## Summary

AIPLC's canvas currently covers the **bare minimum** for a circuit editor: component add/delete/drag, basic wire creation between pins, pin overlays, and DRC highlighting. Out of ~92 applicable features in Velxio (excluding domain-specific simulation features), AIPLC has:

- **15 features fully implemented** (16%)
- **7 features partially implemented** (8%)
- **70 features missing** (76%)

The six P0 features (Zoom/Pan, Undo/Redo, Wire Selection, Component Rotation, Property Editing, Wire Waypoints) represent approximately 3 weeks of focused development and would transform the canvas from a proof-of-concept into a usable editor.
