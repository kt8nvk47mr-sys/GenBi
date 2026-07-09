"""Генерация эмбеддингов для векторного поиска."""
from openai import OpenAI
from app.core.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def get_embedding(text: str) -> list[float]:
    """Получение эмбеддинга для текста."""
    response = client.embeddings.create(
        model=settings.EMBEDDING_MODEL,
        input=text
    )
    return response.data[0].embedding


def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Получение эмбеддингов для списка текстов."""
    response = client.embeddings.create(
        model=settings.EMBEDDING_MODEL,
        input=texts
    )
    return [item.embedding for item in response.data]
