"""WS /api/simulate — PLC simulation bridge."""

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["simulation"])
logger = logging.getLogger(__name__)


@router.websocket("/api/simulate")
async def simulate_ws(ws: WebSocket):
    await ws.accept()
    logger.info("Simulation WebSocket connected")

    scan_task: asyncio.Task | None = None

    try:
        while True:
            data = await ws.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                await ws.send_json({"error": "Invalid JSON"})
                continue

            msg_type = msg.get("type", "")

            if msg_type == "start":
                # Cancel any existing scan loop
                if scan_task and not scan_task.done():
                    scan_task.cancel()

                code = msg.get("code", "")
                await ws.send_json(
                    {"type": "system", "data": {"event": "booting"}}
                )
                await asyncio.sleep(0.5)
                await ws.send_json(
                    {"type": "system", "data": {"event": "booted"}}
                )
                await ws.send_json(
                    {
                        "type": "serial_output",
                        "data": {"text": "AIPLC Ready\n", "uart": 0},
                    }
                )

                # Start periodic scan simulation
                scan_task = asyncio.create_task(
                    _simulate_scan_loop(ws, code)
                )

            elif msg_type == "stop":
                if scan_task and not scan_task.done():
                    scan_task.cancel()
                    scan_task = None
                await ws.send_json(
                    {"type": "system", "data": {"event": "stopped"}}
                )

            elif msg_type == "gpio_in":
                pin = msg.get("pin", 0)
                state = msg.get("state", 0)
                # Echo back as gpio_change (mock)
                await ws.send_json(
                    {
                        "type": "gpio_change",
                        "data": {"pin": pin, "state": state},
                    }
                )

    except WebSocketDisconnect:
        logger.info("Simulation WebSocket disconnected")
    except Exception as e:
        logger.error(f"Simulation error: {e}")
    finally:
        if scan_task and not scan_task.done():
            scan_task.cancel()


async def _simulate_scan_loop(ws: WebSocket, code: str) -> None:
    """Mock PLC scan loop -- sends periodic serial output."""
    scan_count = 0
    try:
        while True:
            scan_count += 1

            # Every 10 scans (~1 second), send a status message
            if scan_count % 10 == 0:
                await ws.send_json(
                    {
                        "type": "serial_output",
                        "data": {
                            "text": f"[Scan #{scan_count}] Running...\n",
                            "uart": 0,
                        },
                    }
                )

            # Simulate some GPIO changes at scan #5
            if scan_count == 5:
                await ws.send_json(
                    {
                        "type": "gpio_change",
                        "data": {"pin": 0, "state": 1},  # DO0 = HIGH
                    }
                )
                await ws.send_json(
                    {
                        "type": "serial_output",
                        "data": {
                            "text": "DO0 = HIGH (接觸器 ON)\n",
                            "uart": 0,
                        },
                    }
                )

            await asyncio.sleep(0.1)  # 100ms scan cycle

    except asyncio.CancelledError:
        logger.info("Scan loop cancelled")
    except Exception:
        pass  # Connection closed
