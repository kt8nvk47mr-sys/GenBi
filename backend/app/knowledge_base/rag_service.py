"""RAG-сервис: поиск в базе знаний и формирование контекста для LLM."""
from sqlalchemy.orm import Session
from app.models.models import KnowledgeDocument, KnowledgeChunk
from app.knowledge_base.embeddings import get_embedding


def search_knowledge_base(
    db: Session,
    query: str,
    top_k: int = 5,
    min_score: float = 0.7
) -> list[dict]:
    """Поиск релевантных документов в базе знаний."""
    query_embedding = get_embedding(query)

    chunks = db.query(KnowledgeChunk).join(KnowledgeDocument).filter(
        KnowledgeDocument.status == "active"
    ).all()

    results = []
    for chunk in chunks:
        score = _cosine_similarity(query_embedding, chunk.embedding)
        if score >= min_score:
            results.append({
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "document_name": chunk.document.name,
                "content": chunk.content,
                "score": score,
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]


def build_rag_context(results: list[dict]) -> str:
    """Формирование контекста для LLM из результатов поиска."""
    if not results:
        return ""

    context_parts = ["## Релевантные документы из базы знаний:\n"]
    for i, r in enumerate(results, 1):
        context_parts.append(
            f"### Источник {i}: {r['document_name']} "
            f"(релевантность: {r['score']:.0%})\n{r['content']}\n"
        )

    return "\n".join(context_parts)


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Косинусная близость двух векторов."""
    dot_product = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)
