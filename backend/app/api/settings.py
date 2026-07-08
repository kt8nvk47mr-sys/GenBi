from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import httpx
import os
from app.api.auth import get_current_user
from app.core.config import settings, update_settings
from app.core.database import recreate_engine, get_db
from app.models.models import User

router = APIRouter(prefix="/api/settings", tags=["settings"])


class LLMSettings(BaseModel):
    primary_model: str = Field(default="gpt-4o")
    fast_model: str = Field(default="gpt-4o-mini")
    clarification_model: str = Field(default="gpt-4o-mini")
    temperature: float = Field(default=0.2, ge=0, le=2)
    max_tokens: int = Field(default=4096, ge=100, le=32768)


class DatabaseSettings(BaseModel):
    host: str = Field(default="localhost")
    port: int = Field(default=5432, ge=1, le=65535)
    database: str = Field(default="genbi")
    user: str = Field(default="gpadmin")
    password: str = Field(default="")


class EmbeddingSettings(BaseModel):
    provider: str = Field(default="openai")
    model: str = Field(default="text-embedding-3-small")
    dimensions: int = Field(default=1536, ge=1)


class LiteLLMSettings(BaseModel):
    url: str = Field(default="http://localhost:4000")


class SettingsResponse(BaseModel):
    llm: LLMSettings
    database: DatabaseSettings
    embedding: EmbeddingSettings
    litellm: LiteLLMSettings


class SettingsUpdateRequest(BaseModel):
    llm: Optional[LLMSettings] = None
    database: Optional[DatabaseSettings] = None
    embedding: Optional[EmbeddingSettings] = None
    litellm: Optional[LiteLLMSettings] = None


class TestResult(BaseModel):
    success: bool
    message: str
    latency_ms: Optional[float] = None


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def mask_password(password: str) -> str:
    if not password:
        return ""
    return "***"


def build_response():
    return SettingsResponse(
        llm=LLMSettings(
            primary_model=settings.LLM_PRIMARY_MODEL,
            fast_model=settings.LLM_FAST_MODEL,
            clarification_model=settings.LLM_CLARIFICATION_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
        ),
        database=DatabaseSettings(
            host=settings.GP_HOST,
            port=settings.GP_PORT,
            database=settings.GP_DATABASE,
            user=settings.GP_USER,
            password=mask_password(settings.GP_PASSWORD),
        ),
        embedding=EmbeddingSettings(
            provider=settings.EMBEDDING_PROVIDER,
            model=settings.EMBEDDING_MODEL,
            dimensions=settings.EMBEDDING_DIMENSIONS,
        ),
        litellm=LiteLLMSettings(
            url=settings.LITELLM_URL,
        ),
    )


@router.get("", response_model=SettingsResponse)
def get_settings(admin: User = Depends(require_admin)):
    return build_response()


@router.put("", response_model=SettingsResponse)
def update_settings_endpoint(
    request: SettingsUpdateRequest,
    admin: User = Depends(require_admin),
    db=Depends(get_db),
):
    gp_changed = False

    if request.llm:
        update_settings(
            LLM_PRIMARY_MODEL=request.llm.primary_model,
            LLM_FAST_MODEL=request.llm.fast_model,
            LLM_CLARIFICATION_MODEL=request.llm.clarification_model,
            LLM_TEMPERATURE=request.llm.temperature,
            LLM_MAX_TOKENS=request.llm.max_tokens,
        )

    if request.database:
        update_settings(
            GP_HOST=request.database.host,
            GP_PORT=request.database.port,
            GP_DATABASE=request.database.database,
            GP_USER=request.database.user,
            GP_PASSWORD=request.database.password,
        )
        gp_changed = True

    if request.embedding:
        update_settings(
            EMBEDDING_PROVIDER=request.embedding.provider,
            EMBEDDING_MODEL=request.embedding.model,
            EMBEDDING_DIMENSIONS=request.embedding.dimensions,
        )

    if request.litellm:
        update_settings(
            LITELLM_URL=request.litellm.url,
        )

    if gp_changed:
        recreate_engine()

    return build_response()


@router.post("/test-db", response_model=TestResult)
def test_database(
    request: DatabaseSettings,
    admin: User = Depends(require_admin),
):
    import time
    start = time.time()
    GP_AVAIL = os.getenv("GP_AVAILABLE", "false").lower() == "true"
    if not GP_AVAIL:
        return TestResult(success=True, message="SQLite (локальная разработка)")
    try:
        from sqlalchemy import create_engine, text
        url = f"postgresql://{request.user}:{request.password}@{request.host}:{request.port}/{request.database}"
        eng = create_engine(url, connect_args={"connect_timeout": 5})
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        eng.dispose()
        latency = (time.time() - start) * 1000
        return TestResult(success=True, message=f"Подключение успешно ({request.host}:{request.port}/{request.database})", latency_ms=round(latency, 1))
    except Exception as e:
        latency = (time.time() - start) * 1000
        return TestResult(success=False, message=str(e)[:200], latency_ms=round(latency, 1))


@router.post("/test-litellm", response_model=TestResult)
def test_litellm(
    request: LiteLLMSettings,
    admin: User = Depends(require_admin),
):
    import time
    start = time.time()
    try:
        with httpx.Client(timeout=5) as client:
            r = client.get(f"{request.url}/health")
            r.raise_for_status()
        latency = (time.time() - start) * 1000
        return TestResult(success=True, message=f"LiteLLM доступен ({request.url})", latency_ms=round(latency, 1))
    except Exception as e:
        latency = (time.time() - start) * 1000
        return TestResult(success=False, message=str(e)[:200], latency_ms=round(latency, 1))


@router.post("/test-llm", response_model=TestResult)
def test_llm(
    admin: User = Depends(require_admin),
):
    import time
    start = time.time()
    try:
        with httpx.Client(timeout=15) as client:
            r = client.post(
                f"{settings.LITELLM_URL}/chat/completions",
                headers={"Authorization": f"Bearer {os.getenv('LITELLM_MASTER_KEY', '')}"},
                json={
                    "model": settings.LLM_FAST_MODEL,
                    "messages": [{"role": "user", "content": "ping"}],
                    "max_tokens": 5,
                },
            )
            r.raise_for_status()
        latency = (time.time() - start) * 1000
        return TestResult(success=True, message=f"Модель {settings.LLM_FAST_MODEL} отвечает", latency_ms=round(latency, 1))
    except Exception as e:
        latency = (time.time() - start) * 1000
        return TestResult(success=False, message=str(e)[:200], latency_ms=round(latency, 1))
