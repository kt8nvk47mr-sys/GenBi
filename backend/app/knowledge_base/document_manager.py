"""Менеджер документов базы знаний: загрузка, версионирование, модерация."""
from sqlalchemy.orm import Session
from app.models.models import KnowledgeDocument, KnowledgeChunk
from app.parsers.document_parser import parse_document
from app.knowledge_base.chunker import chunk_text
from app.knowledge_base.embeddings import get_embeddings_batch


def upload_document(
    db: Session,
    file_bytes: bytes,
    filename: str,
    doc_type: str,
    uploaded_by: int
) -> KnowledgeDocument:
    """Загрузка и индексация нового документа."""
    text = parse_document(file_bytes, filename)

    doc = KnowledgeDocument(
        name=filename,
        doc_type=doc_type,
        content=text,
        status="active",
        uploaded_by=uploaded_by,
    )
    db.add(doc)
    db.flush()

    chunks = chunk_text(text)
    embeddings = get_embeddings_batch(chunks)

    for content, embedding in zip(chunks, embeddings):
        chunk = KnowledgeChunk(
            document_id=doc.id,
            content=content,
            embedding=embedding,
        )
        db.add(chunk)

    db.commit()
    db.refresh(doc)
    return doc


def get_document_list(
    db: Session,
    doc_type: str | None = None,
    status: str | None = None,
) -> list[KnowledgeDocument]:
    """Получение списка документов с фильтрацией."""
    query = db.query(KnowledgeDocument)
    if doc_type:
        query = query.filter(KnowledgeDocument.doc_type == doc_type)
    if status:
        query = query.filter(KnowledgeDocument.status == status)
    return query.order_by(KnowledgeDocument.created_at.desc()).all()


def update_document_status(
    db: Session,
    document_id: int,
    status: str
) -> KnowledgeDocument | None:
    """Обновление статуса документа."""
    doc = db.query(KnowledgeDocument).filter(
        KnowledgeDocument.id == document_id
    ).first()
    if doc:
        doc.status = status
        db.commit()
        db.refresh(doc)
    return doc
