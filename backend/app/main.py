from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.database import init_db
from app.core.security import add_cors_middleware
from app.api.routes import health, imports, dashboard, products, stock, expiration, replenishment, alerts, ai

settings = get_settings()

app = FastAPI(
    title="SmartStock AI API",
    description="Intelligent inventory management for supermarkets",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add middleware
add_cors_middleware(app)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(imports.router, prefix="/api", tags=["imports"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(products.router, prefix="/api", tags=["products"])
app.include_router(stock.router, prefix="/api", tags=["stock"])
app.include_router(expiration.router, prefix="/api", tags=["expiration"])
app.include_router(replenishment.router, prefix="/api", tags=["replenishment"])
app.include_router(alerts.router, prefix="/api", tags=["alerts"])
app.include_router(ai.router, prefix="/api", tags=["ai"])


@app.on_event("startup")
async def startup_event():
    init_db()


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc) if settings.app_debug else "Internal error"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.app_host, port=settings.app_port)