from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Greenplum
    GP_HOST: str = "localhost"
    GP_PORT: int = 5432
    GP_DATABASE: str = "genbi"
    GP_USER: str = "gpadmin"
    GP_PASSWORD: str = ""
    
    # LiteLLM
    LITELLM_URL: str = "http://localhost:4000"
    LLM_PRIMARY_MODEL: str = "gpt-4o"
    LLM_FAST_MODEL: str = "gpt-4o-mini"
    LLM_CLARIFICATION_MODEL: str = "gpt-4o-mini"
    
    # Embeddings
    EMBEDDING_PROVIDER: str = "openai"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSIONS: int = 1536
    
    # JWT
    JWT_SECRET: str = "change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 24
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # LLM Parameters
    LLM_TEMPERATURE: float = 0.2
    LLM_MAX_TOKENS: int = 4096
    
    class Config:
        env_file = ".env"


settings = Settings()


def update_settings(**kwargs) -> Settings:
    for key, value in kwargs.items():
        if hasattr(settings, key):
            setattr(settings, key, value)
    return settings
