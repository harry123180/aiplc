"""WS /api/simulate — placeholder for QEMU simulation bridge."""

import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["simulation"])


@router.websocket("/api/simulate")
async def simulation_ws(websocket: WebSocket):
    """
    WebSocket endpoint for real-time simulation bridge.

    Protocol (planned):
      Client -> Server:  {"action": "start" | "stop" | "set_input", ...}
      Server -> Client:  {"type": "state", "outputs": {...}, "tick": N}

    Currently a placeholder that echoes messages and sends periodic heartbeats.
    """
    await websocket.accept()
    try:
        while True:
            data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON"})
                continue

            action = msg.get("action")
            if action == "start":
                await websocket.send_json({
                    "type": "status",
                    "status": "not_implemented",
                    "message": "QEMU simulation bridge not yet available",
                })
            elif action == "stop":
                await websocket.send_json({
                    "type": "status",
                    "status": "stopped",
                })
            elif action == "ping":
                await websocket.send_json({"type": "pong"})
            else:
                await websocket.send_json({
                    "type": "echo",
                    "received": msg,
                })

    except (WebSocketDisconnect, asyncio.TimeoutError):
        pass
