"""POST /api/agent/chat — LiteLLM proxy with streaming and tool_use."""

import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app.services.llm_client import chat_completion_stream
from app.services.mcp_tools import execute_tool, get_tools_openai_format

router = APIRouter(prefix="/api/agent", tags=["agent"])

# ---------------------------------------------------------------------------
# System prompt (Traditional Chinese)
# ---------------------------------------------------------------------------

# Load the HAL header once for inclusion in the system prompt
_HAL_HEADER_PATH = Path(__file__).resolve().parents[2] / "templates" / "aiplc.h"
_HAL_HEADER = _HAL_HEADER_PATH.read_text(encoding="utf-8") if _HAL_HEADER_PATH.exists() else ""

SYSTEM_PROMPT = f"""\
你是 AIPLC 工控程式設計助手。你幫助使用者：
1. 設計 PLC 電氣配線圖（使用 canvas 工具放置元件和接線）
2. 生成 C 語言 PLC 控制程式（使用 aiplc.h HAL API）
3. 解釋工控概念和安全規範

可用的 PLC HAL API：
- DI_Read(ch): 讀取數位輸入 (0-15)
- DO_Write(ch, val): 寫入數位輸出 (0-15)
- DO_Toggle(ch): 切換數位輸出
- AI_Read(ch): 讀取類比輸入 0-4095
- AI_ReadVoltage(ch): 讀取類比輸入電壓值
- AI_ReadCurrent(ch): 讀取類比輸入電流值
- AO_Write(ch, val): 寫入類比輸出
- AO_WriteVoltage(ch, voltage): 以電壓值寫入類比輸出
- Timer_Start(id, ms) / Timer_Done(id) / Timer_Reset(id) / Timer_Elapsed(id)
- Counter_Reset(id) / Counter_Up(id) / Counter_Down(id) / Counter_Value(id) / Counter_Done(id, preset)
- Serial_Print(fmt, ...): 除錯輸出
- Modbus_Init(slaveAddr, baud): Modbus 初始化

使用者程式需實作兩個函式：
- PLC_Init(): 初始化（開機執行一次）
- PLC_Scan(): 掃描週期（每 ~10ms 執行一次）

完整 HAL 標頭檔：
```c
{_HAL_HEADER}
```

安全規則：
- 急停必須使用硬接線（不經過 PLC 程式）
- 互鎖必須同時有電氣互鎖和機械互鎖
- 所有馬達迴路必須有過載保護

當使用者描述需求時，你應該：
1. 先用 canvas 工具放置所需元件並接線
2. 然後用 editor_set_code 生成對應的 C 程式碼
3. 最後解釋程式邏輯和安全注意事項
"""


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str
    content: str | None = None
    tool_calls: list[dict[str, Any]] | None = None
    tool_call_id: str | None = None
    name: str | None = None


class CanvasState(BaseModel):
    components: list[dict[str, Any]] = []
    wires: list[dict[str, Any]] = []
    code: str | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    canvas_state: CanvasState | None = None


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/chat")
async def agent_chat(req: ChatRequest, request: Request):
    """Stream an LLM response with tool calling support."""

    # Build message list for LLM
    messages: list[dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Optionally inject current canvas state as a system message
    if req.canvas_state:
        canvas_info = json.dumps(req.canvas_state.model_dump(), ensure_ascii=False)
        messages.append({
            "role": "system",
            "content": f"目前畫布狀態：\n{canvas_info}",
        })

    # Append user-provided messages
    for msg in req.messages:
        m: dict[str, Any] = {"role": msg.role}
        if msg.content is not None:
            m["content"] = msg.content
        if msg.tool_calls is not None:
            m["tool_calls"] = msg.tool_calls
        if msg.tool_call_id is not None:
            m["tool_call_id"] = msg.tool_call_id
        if msg.name is not None:
            m["name"] = msg.name
        messages.append(m)

    tools = get_tools_openai_format()

    async def event_generator():
        """SSE generator that handles streaming + tool calls."""
        current_messages = list(messages)
        max_tool_rounds = 5  # prevent infinite loops

        for _round in range(max_tool_rounds):
            # Accumulate the assistant response
            full_content = ""
            tool_calls_acc: dict[int, dict[str, Any]] = {}
            finish_reason = None

            try:
                async for chunk in chat_completion_stream(
                    current_messages, tools=tools
                ):
                    # Check for client disconnect
                    if await request.is_disconnected():
                        return

                    if chunk.get("done"):
                        break

                    choices = chunk.get("choices", [])
                    if not choices:
                        continue
                    delta = choices[0].get("delta", {})
                    finish_reason = choices[0].get("finish_reason")

                    # Stream text content to client
                    if delta.get("content"):
                        full_content += delta["content"]
                        yield {
                            "event": "content",
                            "data": json.dumps(
                                {"content": delta["content"]}, ensure_ascii=False
                            ),
                        }

                    # Accumulate tool calls
                    if delta.get("tool_calls"):
                        for tc in delta["tool_calls"]:
                            idx = tc["index"]
                            if idx not in tool_calls_acc:
                                tool_calls_acc[idx] = {
                                    "id": tc.get("id", ""),
                                    "type": "function",
                                    "function": {"name": "", "arguments": ""},
                                }
                            if tc.get("id"):
                                tool_calls_acc[idx]["id"] = tc["id"]
                            func = tc.get("function", {})
                            if func.get("name"):
                                tool_calls_acc[idx]["function"]["name"] = func["name"]
                            if func.get("arguments"):
                                tool_calls_acc[idx]["function"]["arguments"] += func[
                                    "arguments"
                                ]

            except Exception as exc:
                yield {
                    "event": "error",
                    "data": json.dumps(
                        {"error": str(exc)}, ensure_ascii=False
                    ),
                }
                return

            # If no tool calls, we're done
            if not tool_calls_acc:
                yield {"event": "done", "data": "{}"}
                return

            # Process tool calls
            tool_calls_list = [tool_calls_acc[i] for i in sorted(tool_calls_acc)]

            # Notify frontend about tool calls
            yield {
                "event": "tool_calls",
                "data": json.dumps(tool_calls_list, ensure_ascii=False),
            }

            # Append assistant message with tool calls
            assistant_msg: dict[str, Any] = {"role": "assistant"}
            if full_content:
                assistant_msg["content"] = full_content
            assistant_msg["tool_calls"] = tool_calls_list
            current_messages.append(assistant_msg)

            # Execute each tool and append result
            for tc in tool_calls_list:
                fn_name = tc["function"]["name"]
                try:
                    fn_args = json.loads(tc["function"]["arguments"])
                except json.JSONDecodeError:
                    fn_args = {}

                result = await execute_tool(fn_name, fn_args)

                # Notify frontend about tool result
                yield {
                    "event": "tool_result",
                    "data": json.dumps(
                        {
                            "tool_call_id": tc["id"],
                            "name": fn_name,
                            "result": result,
                        },
                        ensure_ascii=False,
                    ),
                }

                current_messages.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": json.dumps(result, ensure_ascii=False),
                })

            # Loop continues — the LLM will see tool results and may
            # generate more text or more tool calls.

        # If we exhausted rounds, signal done
        yield {"event": "done", "data": "{}"}

    return EventSourceResponse(event_generator())
