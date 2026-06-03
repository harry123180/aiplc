"""AIPLC Backend — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.routes import agent, compile, mcp
from app.api.websocket import simulation


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup / shutdown hooks."""
    settings = get_settings()
    print(f"[AIPLC] Starting — LLM endpoint: {settings.LITELLM_BASE_URL}")
    print(f"[AIPLC] Model: {settings.LITELLM_MODEL}")
    yield
    print("[AIPLC] Shutting down")


app = FastAPI(
    title="AIPLC Backend",
    description="AI-powered PLC programming assistant backend",
    version="0.1.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
settings = get_settings()

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://aiplc.qianpro.shop",
]
# Add FRONTEND_URL if it's not already covered
if settings.FRONTEND_URL not in allowed_origins:
    allowed_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(agent.router)
app.include_router(compile.router)
app.include_router(mcp.router)
app.include_router(simulation.router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/api/health", tags=["health"])
async def health_check():
    return {
        "status": "ok",
        "service": "aiplc-backend",
        "version": "0.1.0",
    }
