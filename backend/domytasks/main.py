from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastmcp.utilities.lifespan import combine_lifespans

from domytasks.api.routes import settings as settings_routes
from domytasks.api.routes import tasks as tasks_routes
from domytasks.api.routes import views as views_routes
from domytasks.api.routes import workstreams as workstreams_routes
from domytasks.auth import BearerAuthMiddleware
from domytasks.config import get_settings
from domytasks.db import init_db
from domytasks.mcp.server import mcp_app
from domytasks.service.exceptions import NotFoundError, ValidationError


@asynccontextmanager
async def db_lifespan(_app: FastAPI):
    init_db()
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="DoMyTasks",
        lifespan=combine_lifespans(mcp_app.lifespan, db_lifespan),
    )

    app.add_middleware(BearerAuthMiddleware)

    @app.exception_handler(NotFoundError)
    async def not_found_handler(_request: Request, exc: NotFoundError):
        return JSONResponse(
            status_code=404,
            content={"detail": str(exc)},
        )

    @app.exception_handler(ValidationError)
    async def validation_handler(_request: Request, exc: ValidationError):
        return JSONResponse(
            status_code=400,
            content={"detail": exc.message},
        )

    @app.get("/health")
    def health():
        return {"status": "ok"}

    app.include_router(workstreams_routes.router, prefix="/api")
    app.include_router(tasks_routes.router, prefix="/api")
    app.include_router(views_routes.router, prefix="/api")
    app.include_router(settings_routes.router, prefix="/api")

    app.mount("/mcp", mcp_app)

    static_dir = settings.static_dir
    if static_dir.exists():
        app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")

    return app


app = create_app()
