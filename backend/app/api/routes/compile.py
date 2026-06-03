"""POST /api/compile — placeholder for C compilation service."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["compile"])


class CompileRequest(BaseModel):
    code: str
    board: str = "stm32f405"


class CompileResponse(BaseModel):
    success: bool
    message: str
    binary_url: str | None = None
    warnings: list[str] = []
    errors: list[str] = []


@router.post("/compile", response_model=CompileResponse)
async def compile_code(req: CompileRequest):
    """
    Compile C code for the specified board.

    Currently returns a placeholder response. In production this will
    invoke arm-none-eabi-gcc inside a sandboxed container.
    """
    return CompileResponse(
        success=False,
        message="Compilation service not yet available",
    )
