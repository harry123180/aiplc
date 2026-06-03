"""MCP Server tools endpoint — list and execute tools."""

import json
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.mcp_tools import TOOLS, execute_tool

router = APIRouter(prefix="/api/mcp", tags=["mcp"])


# ---------------------------------------------------------------------------
# GET /api/mcp/tools
# ---------------------------------------------------------------------------

@router.get("/tools")
async def list_tools():
    """List all available MCP tools and their schemas."""
    return {"tools": TOOLS}


# ---------------------------------------------------------------------------
# POST /api/mcp/execute
# ---------------------------------------------------------------------------

class ToolExecuteRequest(BaseModel):
    name: str
    arguments: dict[str, Any] = {}


class ToolExecuteResponse(BaseModel):
    name: str
    result: dict[str, Any]


@router.post("/execute", response_model=ToolExecuteResponse)
async def execute_mcp_tool(req: ToolExecuteRequest):
    """Execute a single MCP tool call and return the result."""
    result = await execute_tool(req.name, req.arguments)
    return ToolExecuteResponse(name=req.name, result=result)
