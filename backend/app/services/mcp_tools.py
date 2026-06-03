"""MCP tool definitions and handlers for AIPLC canvas/editor operations."""

from typing import Any

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
                        "'terminal-block', 'fuse', 'contactor'"
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
        "description": "Add a wire connecting two component ports on the canvas.",
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
        "description": "List all available PLC component types with their categories.",
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
        "description": "Get detailed info about a specific component type (ports, ratings, description).",
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


# --- Individual placeholder handlers ---

async def _canvas_add_component(args: dict) -> dict:
    return {
        "status": "ok",
        "action": "canvas_add_component",
        "component_id": f"comp-{id(args) % 100000:05d}",
        "component_type": args.get("component_type"),
        "position": {"x": args.get("x"), "y": args.get("y")},
    }


async def _canvas_add_wire(args: dict) -> dict:
    return {
        "status": "ok",
        "action": "canvas_add_wire",
        "wire_id": f"wire-{id(args) % 100000:05d}",
        "from": f"{args.get('from_component_id')}:{args.get('from_port')}",
        "to": f"{args.get('to_component_id')}:{args.get('to_port')}",
    }


async def _canvas_remove(args: dict) -> dict:
    return {
        "status": "ok",
        "action": "canvas_remove",
        "element_id": args.get("element_id"),
    }


async def _canvas_get_state(_args: dict) -> dict:
    return {
        "status": "ok",
        "action": "canvas_get_state",
        "components": [],
        "wires": [],
    }


async def _editor_set_code(args: dict) -> dict:
    code = args.get("code", "")
    return {
        "status": "ok",
        "action": "editor_set_code",
        "lines": code.count("\n") + 1,
    }


async def _editor_get_code(_args: dict) -> dict:
    return {
        "status": "ok",
        "action": "editor_get_code",
        "code": "// No code loaded yet\n",
    }


async def _component_list(args: dict) -> dict:
    components = {
        "cpu": [
            {"type": "plc-cpu-f405", "name": "STM32F405 PLC CPU", "di": 16, "do": 16, "ai": 8, "ao": 4},
        ],
        "input": [
            {"type": "button-no", "name": "Push Button (NO)"},
            {"type": "button-nc", "name": "Push Button (NC)"},
            {"type": "switch-toggle", "name": "Toggle Switch"},
            {"type": "e-stop", "name": "Emergency Stop (NC)"},
        ],
        "output": [
            {"type": "indicator-light", "name": "Indicator Light"},
            {"type": "relay", "name": "Relay Module"},
            {"type": "motor", "name": "AC Motor"},
            {"type": "contactor", "name": "Contactor"},
        ],
        "sensor": [
            {"type": "sensor-proximity", "name": "Proximity Sensor"},
            {"type": "sensor-temperature", "name": "Temperature Sensor (4-20mA)"},
            {"type": "sensor-pressure", "name": "Pressure Sensor (0-10V)"},
        ],
        "power": [
            {"type": "power-supply", "name": "24V DC Power Supply"},
            {"type": "terminal-block", "name": "Terminal Block"},
        ],
        "protection": [
            {"type": "fuse", "name": "Fuse"},
            {"type": "circuit-breaker", "name": "Circuit Breaker"},
            {"type": "overload-relay", "name": "Thermal Overload Relay"},
        ],
    }
    category = args.get("category")
    if category and category in components:
        return {"status": "ok", "components": {category: components[category]}}
    return {"status": "ok", "components": components}


async def _component_info(args: dict) -> dict:
    info_db: dict[str, dict] = {
        "plc-cpu-f405": {
            "type": "plc-cpu-f405",
            "name": "STM32F405 PLC CPU",
            "description": "Main PLC processor with 16 DI, 16 DO, 8 AI, 4 AO",
            "ports": {
                "DI0-DI15": "Digital inputs (24V sink/source)",
                "DO0-DO15": "Digital outputs (relay/transistor)",
                "AI0-AI7": "Analog inputs (0-10V / 4-20mA)",
                "AO0-AO3": "Analog outputs (0-10V)",
                "COM": "Common ground",
                "V+": "24V supply input",
                "RS485-A": "Modbus RS485 A",
                "RS485-B": "Modbus RS485 B",
            },
        },
        "button-no": {
            "type": "button-no",
            "name": "Push Button (Normally Open)",
            "description": "Momentary push button, normally open contact",
            "ports": {"COM": "Common", "NO": "Normally Open"},
        },
        "indicator-light": {
            "type": "indicator-light",
            "name": "Indicator Light",
            "description": "Panel indicator light (24V DC)",
            "ports": {"A+": "Anode (+24V)", "K-": "Cathode (GND)"},
        },
    }
    ctype = args.get("component_type", "")
    if ctype in info_db:
        return {"status": "ok", "info": info_db[ctype]}
    return {"status": "ok", "info": {"type": ctype, "name": ctype, "ports": {}}}


async def _io_mapping_set(args: dict) -> dict:
    return {
        "status": "ok",
        "action": "io_mapping_set",
        "mapping": {
            "io_type": args.get("io_type"),
            "channel": args.get("channel"),
            "component_id": args.get("component_id"),
            "port": args.get("port"),
        },
    }


async def _io_mapping_get(_args: dict) -> dict:
    return {"status": "ok", "action": "io_mapping_get", "mappings": []}


async def _compile_and_run(args: dict) -> dict:
    return {
        "status": "pending",
        "action": "compile_and_run",
        "message": "Compilation service not yet available — placeholder",
        "optimization": args.get("optimization", "-O0"),
    }


async def _simulation_stop(_args: dict) -> dict:
    return {"status": "ok", "action": "simulation_stop", "message": "Simulation stopped"}


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
}
