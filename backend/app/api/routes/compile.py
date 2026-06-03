"""POST /api/compile — C compilation service (gcc syntax-check MVP)."""

import os
import subprocess
import tempfile
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["compile"])

TEMPLATES_DIR = Path(__file__).resolve().parents[2] / "templates"


class CompileRequest(BaseModel):
    code: str
    board: str = "stm32f405"


class CompileResponse(BaseModel):
    success: bool
    message: str
    output: str = ""
    hex: str | None = None  # future: compiled binary


@router.post("/compile", response_model=CompileResponse)
async def compile_code(req: CompileRequest):
    """
    Compile PLC C code with syntax checking.

    Uses gcc to validate the user's code against aiplc.h with stub
    implementations.  This catches syntax errors, type mismatches, and
    missing function definitions without requiring arm-none-eabi-gcc.
    """

    with tempfile.TemporaryDirectory() as tmpdir:
        # Copy the HAL header into the temp build directory
        aiplc_h_src = TEMPLATES_DIR / "aiplc.h"
        (Path(tmpdir) / "aiplc.h").write_text(aiplc_h_src.read_text(encoding="utf-8"), encoding="utf-8")

        # Write a main wrapper that provides stub implementations of every
        # HAL function declared in aiplc.h, includes the user code, and
        # calls PLC_Init / PLC_Scan so the linker (if used) can resolve
        # those symbols too.
        main_wrapper = r'''
#include "aiplc.h"
#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#include <stdarg.h>

/* ---- Stub implementations for syntax checking ---- */
bool DI_Read(int ch) { (void)ch; return false; }
void DO_Write(int ch, bool v) { (void)ch; (void)v; }
void DO_Toggle(int ch) { (void)ch; }
uint16_t AI_Read(int ch) { (void)ch; return 0; }
float AI_ReadVoltage(int ch) { (void)ch; return 0.0f; }
float AI_ReadCurrent(int ch) { (void)ch; return 0.0f; }
void AO_Write(int ch, uint16_t v) { (void)ch; (void)v; }
void AO_WriteVoltage(int ch, float v) { (void)ch; (void)v; }
void Timer_Start(int id, uint32_t ms) { (void)id; (void)ms; }
bool Timer_Done(int id) { (void)id; return false; }
void Timer_Reset(int id) { (void)id; }
uint32_t Timer_Elapsed(int id) { (void)id; return 0; }
void Counter_Reset(int id) { (void)id; }
void Counter_Up(int id) { (void)id; }
void Counter_Down(int id) { (void)id; }
int32_t Counter_Value(int id) { (void)id; return 0; }
bool Counter_Done(int id, int32_t p) { (void)id; (void)p; return false; }
void Serial_Print(const char* fmt, ...) { va_list a; va_start(a,fmt); (void)a; va_end(a); }
void Modbus_Init(uint8_t addr, long baud) { (void)addr; (void)baud; }

/* ---- Include user code ---- */
#include "user_code.c"

int main(void) {
    PLC_Init();
    for (;;) { PLC_Scan(); }
    return 0;
}
'''
        (Path(tmpdir) / "main.c").write_text(main_wrapper, encoding="utf-8")

        # Write user code
        (Path(tmpdir) / "user_code.c").write_text(req.code, encoding="utf-8")

        # Determine the null device for the current platform
        null_dev = "NUL" if os.name == "nt" else "/dev/null"

        try:
            result = subprocess.run(
                ["gcc", "-Wall", "-Wextra", "-c", "-o", null_dev, "main.c"],
                cwd=tmpdir,
                capture_output=True,
                text=True,
                timeout=30,
            )

            output = result.stdout + result.stderr
            # Clean up temp directory paths from error messages so the user
            # sees clean file references.
            output = output.replace(tmpdir + "/", "").replace(tmpdir + "\\", "")
            # Map the included file back to a user-friendly name
            output = output.replace("user_code.c", "main.c")

            if result.returncode == 0:
                return CompileResponse(
                    success=True,
                    message="Compilation successful",
                    output=output.strip() or "No errors or warnings",
                )
            else:
                return CompileResponse(
                    success=False,
                    message="Compilation failed",
                    output=output.strip(),
                )

        except FileNotFoundError:
            return CompileResponse(
                success=False,
                message="gcc not found - install build-essential in Docker image",
                output="Error: gcc compiler not available on this system",
            )
        except subprocess.TimeoutExpired:
            return CompileResponse(
                success=False,
                message="Compilation timeout (30s)",
                output="Error: compilation took too long",
            )
