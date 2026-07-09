"""API-эндпоинты для базы знаний."""
from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from app.knowledge_base.document_manager import (
    upload_document, get_document_list, update_document_status
)

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


@router.post("/upload")
async def upload_knowledge_document(
    file: UploadFile = File(...),
    doc_type: str = Form("general"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Загрузка документа в базу знаний."""
    file_bytes = await file.read()
    doc = upload_document(db, file_bytes, file.filename, doc_type, user.id)
    return {"id": doc.id, "name": doc.name, "status": doc.status}


@router.get("/documents")
def list_documents(
    doc_type: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Получение списка документов."""
    docs = get_document_list(db, doc_type, status)
    return [
        {
            "id": d.id,
            "name": d.name,
            "doc_type": d.doc_type,
            "status": d.status,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in docs
    ]


@router.patch("/{document_id}/status")
def change_document_status(
    document_id: int,
    status: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Изменение статуса документа."""
    doc = update_document_status(db, document_id, status)
    if not doc:
        return {"error": "Документ не найден"}
    return {"id": doc.id, "status": doc.status}
