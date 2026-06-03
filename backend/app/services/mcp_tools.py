"""MCP tool definitions and handlers for AIPLC canvas/editor operations."""

import copy
from typing import Any

# ---------------------------------------------------------------------------
# In-memory state — mirrors what the frontend canvas/editor would hold.
# Persists for the lifetime of the server process.
# ---------------------------------------------------------------------------

_canvas_state: dict[str, list] = {
    "components": [],  # list of {id, type, x, y, properties}
    "wires": [],       # list of {id, from_component, from_pin, to_component, to_pin}
}

_editor_state: dict[str, str] = {
    "code": (
        '#include "aiplc.h"\n'
        "\n"
        "void PLC_Init() {\n"
        '    Serial_Print("AIPLC Ready\\n");\n'
        "}\n"
        "\n"
        "void PLC_Scan() {\n"
        "    // Your control logic here\n"
        "}\n"
    ),
}

_io_mapping: dict[str, dict] = {}  # {channel_name: mapping_info}

_next_id: int = 1

# ---------------------------------------------------------------------------
# Tool registry — 12 tools from the MVP spec
# ---------------------------------------------------------------------------

TOOLS: list[dict[str, Any]] = [
    # ── Canvas manipulation ────────────────────────────────────────────
    {
        "name": "canvas_add_component",
        "description": "Add a PLC component to the canvas. Returns the created component's ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "component_type": {
                    "type": "string",
                    "description": (
                        "Component type ID, e.g. 'plc-cpu-f405', 'button-no', "
                        "'button-nc', 'indicator-light', 'relay', 'motor', "
                        "'sensor-proximity', 'sensor-temperature', 'power-supply', "
                        "'terminal-block', 'fuse', 'contactor', 'resistor', "
                        "'ground', 'power-24v', 'junction'"
                    ),
                },
                "x": {"type": "number", "description": "X position on canvas (px)"},
                "y": {"type": "number", "description": "Y position on canvas (px)"},
                "properties": {
                    "type": "object",
                    "description": "Optional component properties (label, rating, etc.)",
                },
            },
            "required": ["component_type", "x", "y"],
        },
    },
    {
        "name": "canvas_add_wire",
        "description": "在兩個元件之間建立接線。使用前請先呼叫 component_info 確認元件的正確 pin 名稱。pin 名稱必須完全匹配（例如接觸器的線圈腳是 'COIL+' 不是 'coil'，指示燈的正極是 'A' 不是 '+'）。",
        "parameters": {
            "type": "object",
            "properties": {
                "from_component_id": {
                    "type": "string",
                    "description": "Source component ID",
                },
                "from_port": {
                    "type": "string",
                    "description": "Source port name (e.g. 'DO0', 'COM', 'NO')",
                },
                "to_component_id": {
                    "type": "string",
                    "description": "Target component ID",
                },
                "to_port": {
                    "type": "string",
                    "description": "Target port name",
                },
            },
            "required": [
                "from_component_id",
                "from_port",
                "to_component_id",
                "to_port",
            ],
        },
    },
    {
        "name": "canvas_remove",
        "description": "Remove a component or wire from the canvas by ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "element_id": {
                    "type": "string",
                    "description": "ID of the component or wire to remove",
                },
            },
            "required": ["element_id"],
        },
    },
    {
        "name": "canvas_get_state",
        "description": "Get the current state of the canvas (all components, wires, and their properties).",
        "parameters": {
            "type": "object",
            "properties": {},
        },
    },
    # ── Code editor ────────────────────────────────────────────────────
    {
        "name": "editor_set_code",
        "description": "Set the C code in the code editor panel.",
        "parameters": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "Complete C source code using aiplc.h HAL API",
                },
                "cursor_line": {
                    "type": "integer",
                    "description": "Optional line number to place the cursor at",
                },
            },
            "required": ["code"],
        },
    },
    {
        "name": "editor_get_code",
        "description": "Get the current C code from the code editor panel.",
        "parameters": {
            "type": "object",
            "properties": {},
        },
    },
    # ── Component library ──────────────────────────────────────────────
    {
        "name": "component_list",
        "description": "列出所有可用的 PLC 元件類型，包含分類、pin 名稱與 pin 說明。回傳結果可直接用於確認接線時的 pin 名稱。",
        "parameters": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "Filter by category: 'cpu', 'input', 'output', 'sensor', 'power', 'protection'",
                },
            },
        },
    },
    {
        "name": "component_info",
        "description": "查詢特定元件類型的詳細資訊，包含所有可用的 pin 名稱。接線前務必先呼叫此工具確認 pin 名稱。",
        "parameters": {
            "type": "object",
            "properties": {
                "component_type": {
                    "type": "string",
                    "description": "Component type ID",
                },
            },
            "required": ["component_type"],
        },
    },
    # ── I/O mapping ────────────────────────────────────────────────────
    {
        "name": "io_mapping_set",
        "description": "Set a mapping between a PLC I/O channel and a canvas component port.",
        "parameters": {
            "type": "object",
            "properties": {
                "io_type": {
                    "type": "string",
                    "enum": ["DI", "DO", "AI", "AO"],
                    "description": "I/O type",
                },
                "channel": {
                    "type": "integer",
                    "description": "Channel number (0-15)",
                },
                "component_id": {
                    "type": "string",
                    "description": "Target component ID on canvas",
                },
                "port": {
                    "type": "string",
                    "description": "Target port on the component",
                },
            },
            "required": ["io_type", "channel", "component_id", "port"],
        },
    },
    {
        "name": "io_mapping_get",
        "description": "Get current I/O mapping table (which channels map to which canvas components).",
        "parameters": {
            "type": "object",
            "properties": {},
        },
    },
    # ── Simulation ─────────────────────────────────────────────────────
    {
        "name": "compile_and_run",
        "description": "Compile the current C code and start the simulation.",
        "parameters": {
            "type": "object",
            "properties": {
                "optimization": {
                    "type": "string",
                    "enum": ["-O0", "-O1", "-O2", "-Os"],
                    "description": "GCC optimization level (default: -O0)",
                },
            },
        },
    },
    {
        "name": "simulation_stop",
        "description": "Stop the currently running simulation.",
        "parameters": {
            "type": "object",
            "properties": {},
        },
    },
    # ── Design skill retrieval ────────────────────────────────────────
    {
        "name": "retrieve_design_skill",
        "description": "搜尋並載入相關的電路設計 skill。當使用者要求設計特定迴路時呼叫此工具取得設計範本、元件清單、接線規則和程式碼範例。",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "設計需求關鍵字（例如：馬達正反轉、LED按鈕、星三角啟動）",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "list_design_skills",
        "description": "列出所有可用的電路設計 skill 清單",
        "parameters": {
            "type": "object",
            "properties": {},
        },
    },
    # ── Circuit verification ──────────────────────────────────────────
    {
        "name": "verify_circuit",
        "description": "對目前畫布上的電路執行 DRC 和電氣模擬檢查。回傳目前的電路狀態，前端會用 ngspice WASM 執行實際的電氣模擬。",
        "parameters": {
            "type": "object",
            "properties": {},
        },
    },
]


def get_tools_openai_format() -> list[dict[str, Any]]:
    """Return tools in OpenAI function-calling format for the LLM."""
    return [
        {
            "type": "function",
            "function": {
                "name": tool["name"],
                "description": tool["description"],
                "parameters": tool["parameters"],
            },
        }
        for tool in TOOLS
    ]


# ---------------------------------------------------------------------------
# Tool execution — in MVP these are forwarded to the frontend via SSE;
# the handlers below return placeholder results.
# ---------------------------------------------------------------------------

async def execute_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    """
    Execute an MCP tool call.

    In production, canvas/editor tools are forwarded to the frontend via the
    SSE stream and the frontend applies them.  Here we return a confirmation
    payload so the LLM can continue its reasoning.
    """
    handler = _HANDLERS.get(name)
    if handler is None:
        return {"error": f"Unknown tool: {name}"}
    return await handler(arguments)


# ---------------------------------------------------------------------------
# Component library — hardcoded catalogue of available PLC components
# ---------------------------------------------------------------------------

_COMPONENT_LIBRARY: dict[str, dict] = {
    "plc-cpu-f405": {
        "type": "plc-cpu-f405",
        "name": "PLC CPU Module (STM32F405)",
        "category": "cpu",
        "description": "Main PLC processor module based on STM32F405. Provides digital and analog I/O channels.",
        "pins": ["DI0", "DI1", "DI2", "DI3", "DI4", "DI5", "DI6", "DI7",
                 "DO0", "DO1", "DO2", "DO3", "DO4", "DO5", "DO6", "DO7",
                 "AI0", "AI1", "AI2", "AI3", "AO0", "AO1", "VCC", "GND"],
        "pin_descriptions": {
            "DI0": "數位輸入 0", "DI1": "數位輸入 1", "DI2": "數位輸入 2", "DI3": "數位輸入 3",
            "DI4": "數位輸入 4", "DI5": "數位輸入 5", "DI6": "數位輸入 6", "DI7": "數位輸入 7",
            "DO0": "數位輸出 0", "DO1": "數位輸出 1", "DO2": "數位輸出 2", "DO3": "數位輸出 3",
            "DO4": "數位輸出 4", "DO5": "數位輸出 5", "DO6": "數位輸出 6", "DO7": "數位輸出 7",
            "AI0": "類比輸入 0", "AI1": "類比輸入 1", "AI2": "類比輸入 2", "AI3": "類比輸入 3",
            "AO0": "類比輸出 0", "AO1": "類比輸出 1",
            "VCC": "電源", "GND": "接地",
        },
    },
    "button-no": {
        "type": "button-no",
        "name": "Push Button (Normally Open)",
        "category": "input",
        "description": "Momentary push button with normally-open contact. Closes circuit when pressed.",
        "pins": ["COM", "NO"],
        "pin_descriptions": {
            "COM": "共接點",
            "NO": "常開接點",
        },
    },
    "button-nc": {
        "type": "button-nc",
        "name": "Push Button (Normally Closed)",
        "category": "input",
        "description": "Momentary push button with normally-closed contact. Opens circuit when pressed.",
        "pins": ["COM", "NC"],
        "pin_descriptions": {
            "COM": "共接點",
            "NC": "常閉接點",
        },
    },
    "indicator-light": {
        "type": "indicator-light",
        "name": "Indicator Light",
        "category": "output",
        "description": "Panel-mount indicator light (24V DC). Available in red, yellow, and green.",
        "pins": ["A", "K"],
        "pin_descriptions": {
            "A": "陽極(+)",
            "K": "陰極(-)",
        },
        "properties": {"color": {"options": ["red", "yellow", "green"], "default": "red"}},
    },
    "relay": {
        "type": "relay",
        "name": "Relay",
        "category": "output",
        "description": "Electromechanical relay with coil drive and SPDT output contacts.",
        "pins": ["COIL+", "COIL-", "COM", "NO", "NC"],
        "pin_descriptions": {
            "COIL+": "線圈正極",
            "COIL-": "線圈負極",
            "COM": "共接點",
            "NO": "常開接點",
            "NC": "常閉接點",
        },
    },
    "contactor-3phase": {
        "type": "contactor-3phase",
        "name": "3-Phase Contactor",
        "category": "output",
        "description": "3-phase power contactor for switching motors and heavy loads.",
        "pins": ["COIL+", "COIL-", "L1", "L2", "L3", "T1", "T2", "T3"],
        "pin_descriptions": {
            "COIL+": "線圈正極(接PLC DO)",
            "COIL-": "線圈負極(接GND)",
            "L1": "電源側 L1",
            "L2": "電源側 L2",
            "L3": "電源側 L3",
            "T1": "負載側 T1(接馬達 U)",
            "T2": "負載側 T2(接馬達 V)",
            "T3": "負載側 T3(接馬達 W)",
        },
    },
    "motor-3phase": {
        "type": "motor-3phase",
        "name": "3-Phase Motor",
        "category": "output",
        "description": "3-phase AC induction motor.",
        "pins": ["U", "V", "W"],
        "pin_descriptions": {
            "U": "U相",
            "V": "V相",
            "W": "W相",
        },
    },
    "thermal-overload": {
        "type": "thermal-overload",
        "name": "Thermal Overload Relay",
        "category": "protection",
        "description": "Bimetallic thermal overload relay for motor overcurrent protection.",
        "pins": ["L1", "L2", "L3", "T1", "T2", "T3", "NC", "NO"],
        "pin_descriptions": {
            "L1": "電源側輸入 L1",
            "L2": "電源側輸入 L2",
            "L3": "電源側輸入 L3",
            "T1": "負載側輸出 T1",
            "T2": "負載側輸出 T2",
            "T3": "負載側輸出 T3",
            "NC": "常閉輔助接點(過載斷開)",
            "NO": "常開輔助接點(過載閉合)",
        },
    },
    "emergency-stop": {
        "type": "emergency-stop",
        "name": "Emergency Stop Button",
        "category": "input",
        "description": "Mushroom-head emergency stop button with dual NC contacts. Latching — requires twist to release.",
        "pins": ["NC1", "NC2"],
        "pin_descriptions": {
            "NC1": "常閉接點1",
            "NC2": "常閉接點2",
        },
    },
    "proximity-pnp": {
        "type": "proximity-pnp",
        "name": "PNP Proximity Sensor",
        "category": "sensor",
        "description": "Inductive proximity sensor with PNP (sourcing) output. Detects metallic objects.",
        "pins": ["+V", "OUT", "GND"],
        "pin_descriptions": {
            "+V": "電源正極",
            "OUT": "信號輸出",
            "GND": "接地",
        },
    },
    "resistor": {
        "type": "resistor",
        "name": "Resistor",
        "category": "passive",
        "description": "限流電阻",
        "pins": ["1", "2"],
        "pin_descriptions": {
            "1": "端子1",
            "2": "端子2",
        },
        "properties": {"value": {"default": "1kΩ"}},
    },
    "ground": {
        "type": "ground",
        "name": "Ground (GND)",
        "category": "power",
        "description": "接地端子",
        "pins": ["GND"],
        "pin_descriptions": {
            "GND": "接地端",
        },
    },
    "power-24v": {
        "type": "power-24v",
        "name": "Power Supply 24VDC",
        "category": "power",
        "description": "24VDC 電源供應器",
        "pins": ["V+", "V-"],
        "pin_descriptions": {
            "V+": "正極24V",
            "V-": "負極0V",
        },
        "properties": {"voltage": {"default": "24"}},
    },
    "junction": {
        "type": "junction",
        "name": "Wire Junction",
        "category": "passive",
        "description": "接線端子 / 分歧點",
        "pins": ["1", "2", "3"],
        "pin_descriptions": {
            "1": "端子1",
            "2": "端子2",
            "3": "端子3",
        },
    },
}


# --- Helper ----------------------------------------------------------------

def _gen_id(prefix: str) -> str:
    """Generate a unique ID like comp_1, wire_2, etc."""
    global _next_id
    uid = f"{prefix}_{_next_id}"
    _next_id += 1
    return uid


# --- Individual handlers ---------------------------------------------------

async def _canvas_add_component(args: dict) -> dict:
    component_type = args.get("component_type", "unknown")
    x = args.get("x", 0)
    y = args.get("y", 0)
    properties = args.get("properties") or {}

    comp_id = _gen_id("comp")
    component = {
        "id": comp_id,
        "type": component_type,
        "x": x,
        "y": y,
        "properties": properties,
    }
    _canvas_state["components"].append(component)
    return {
        "success": True,
        "component_id": comp_id,
        "component_type": component_type,
        "x": x,
        "y": y,
        "properties": properties,
        "message": f"Added {component_type} at ({x}, {y})",
    }


async def _canvas_add_wire(args: dict) -> dict:
    from_component = args.get("from_component_id", "")
    from_pin = args.get("from_port", "").strip()
    to_component = args.get("to_component_id", "")
    to_pin = args.get("to_port", "").strip()

    # Validate that both referenced components exist
    comp_map = {c["id"]: c for c in _canvas_state["components"]}
    if from_component not in comp_map:
        return {"success": False, "error": f"Component '{from_component}' not found on canvas"}
    if to_component not in comp_map:
        return {"success": False, "error": f"Component '{to_component}' not found on canvas"}

    # Validate pin names against component library
    from_comp = comp_map[from_component]
    to_comp = comp_map[to_component]

    from_type = from_comp.get("type", "")
    to_type = to_comp.get("type", "")

    if from_type in _COMPONENT_LIBRARY:
        valid_pins = _COMPONENT_LIBRARY[from_type]["pins"]
        if from_pin not in valid_pins:
            return {
                "success": False,
                "error": f"Pin '{from_pin}' not found on {from_type}. Valid pins: {', '.join(valid_pins)}",
            }

    if to_type in _COMPONENT_LIBRARY:
        valid_pins = _COMPONENT_LIBRARY[to_type]["pins"]
        if to_pin not in valid_pins:
            return {
                "success": False,
                "error": f"Pin '{to_pin}' not found on {to_type}. Valid pins: {', '.join(valid_pins)}",
            }

    wire_id = _gen_id("wire")
    wire = {
        "id": wire_id,
        "from_component": from_component,
        "from_pin": from_pin,
        "to_component": to_component,
        "to_pin": to_pin,
    }
    _canvas_state["wires"].append(wire)
    return {
        "success": True,
        "wire_id": wire_id,
        "from_component": from_component,
        "from_pin": from_pin,
        "to_component": to_component,
        "to_pin": to_pin,
    }


async def _canvas_remove(args: dict) -> dict:
    element_id = args.get("element_id", "")

    # Try removing from components
    for i, comp in enumerate(_canvas_state["components"]):
        if comp["id"] == element_id:
            _canvas_state["components"].pop(i)
            # Also remove any wires connected to this component
            _canvas_state["wires"] = [
                w for w in _canvas_state["wires"]
                if w["from_component"] != element_id and w["to_component"] != element_id
            ]
            return {"success": True, "element_id": element_id, "element_type": "component", "message": f"Removed component '{element_id}' and its connected wires"}

    # Try removing from wires
    for i, wire in enumerate(_canvas_state["wires"]):
        if wire["id"] == element_id:
            _canvas_state["wires"].pop(i)
            return {"success": True, "element_id": element_id, "element_type": "wire", "message": f"Removed wire '{element_id}'"}

    return {"success": False, "error": f"Element '{element_id}' not found"}


async def _canvas_get_state(_args: dict) -> dict:
    return copy.deepcopy(_canvas_state)


async def _editor_set_code(args: dict) -> dict:
    code = args.get("code", "")
    _editor_state["code"] = code
    return {"success": True, "code": code, "length": len(code)}


async def _editor_get_code(_args: dict) -> dict:
    return {"code": _editor_state["code"]}


async def _component_list(args: dict) -> dict:
    category = args.get("category")
    if category:
        filtered = [
            info for info in _COMPONENT_LIBRARY.values()
            if info.get("category") == category
        ]
        return {"components": filtered}
    return {"components": list(_COMPONENT_LIBRARY.values())}


async def _component_info(args: dict) -> dict:
    component_type = args.get("component_type", "")
    if component_type in _COMPONENT_LIBRARY:
        return {"found": True, "info": copy.deepcopy(_COMPONENT_LIBRARY[component_type])}
    return {"found": False, "error": f"Unknown component type: '{component_type}'"}


async def _io_mapping_set(args: dict) -> dict:
    io_type = args.get("io_type", "")
    channel = args.get("channel", 0)
    component_id = args.get("component_id", "")
    port = args.get("port", "")

    channel_name = f"{io_type}{channel}"
    _io_mapping[channel_name] = {
        "io_type": io_type,
        "channel": channel,
        "component_id": component_id,
        "port": port,
    }
    return {"success": True, "channel": channel_name}


async def _io_mapping_get(_args: dict) -> dict:
    return copy.deepcopy(_io_mapping)


async def _compile_and_run(_args: dict) -> dict:
    return {
        "success": False,
        "message": "QEMU simulation not yet connected. Code is ready for compilation.",
    }


async def _simulation_stop(_args: dict) -> dict:
    return {"success": True, "message": "Simulation stopped"}


async def _retrieve_design_skill(args: dict) -> dict:
    from app.services.skill_retriever import search_skills
    query = args.get("query", "")
    results = search_skills(query)
    if not results:
        return {"found": False, "message": f"沒有找到與 '{query}' 相關的設計 skill"}
    return {"found": True, "skills": results}


async def _list_design_skills(_args: dict) -> dict:
    from app.services.skill_retriever import list_skills
    return {"skills": list_skills()}


async def _verify_circuit(_args: dict) -> dict:
    """Return the current canvas + editor state for frontend DRC with ngspice."""
    return {
        "components": copy.deepcopy(_canvas_state["components"]),
        "wires": copy.deepcopy(_canvas_state["wires"]),
        "code": _editor_state["code"],
        "message": "Circuit state returned. Frontend will run DRC with ngspice.",
    }


_HANDLERS = {
    "canvas_add_component": _canvas_add_component,
    "canvas_add_wire": _canvas_add_wire,
    "canvas_remove": _canvas_remove,
    "canvas_get_state": _canvas_get_state,
    "editor_set_code": _editor_set_code,
    "editor_get_code": _editor_get_code,
    "component_list": _component_list,
    "component_info": _component_info,
    "io_mapping_set": _io_mapping_set,
    "io_mapping_get": _io_mapping_get,
    "compile_and_run": _compile_and_run,
    "simulation_stop": _simulation_stop,
    "retrieve_design_skill": _retrieve_design_skill,
    "list_design_skills": _list_design_skills,
    "verify_circuit": _verify_circuit,
}
