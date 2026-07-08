from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, ChatSession, ChatMessage
from app.services.llm_service import LLMService
from app.services.clarification_service import ClarificationService

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None


class ClarificationResponse(BaseModel):
    session_id: int
    message_id: int
    needs_clarification: bool
    questions: Optional[List[Dict[str, Any]]] = None
    answer: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: int
    message_id: int
    response: str
    message_type: str = "text"
    metadata: Optional[Dict[str, Any]] = None
    sources: Optional[List[Dict[str, str]]] = None
    model: Optional[str] = None
    reasoning: Optional[str] = None


class SessionResponse(BaseModel):
    id: int
    title: Optional[str]
    created_at: datetime
    updated_at: datetime


class MessageResponse(BaseModel):
    id: int
    role: str
    message_type: str
    content: str
    metadata: Optional[Dict[str, Any]] = None
    model: Optional[str] = None
    reasoning: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_model(cls, msg):
        return cls(
            id=msg.id,
            role=msg.role,
            message_type=msg.message_type,
            content=msg.content,
            metadata=getattr(msg, 'metadata_', None),
            model=getattr(msg, 'model_name', None),
            reasoning=getattr(msg, 'reasoning', None),
            created_at=msg.created_at
        )


llm_service = LLMService()
clarification_service = ClarificationService()


@router.post("/send", response_model=ChatResponse)
def send_message(request: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not request.session_id:
        session = ChatSession(user_id=current_user.id, title=request.message[:100])
        db.add(session)
        db.commit()
        db.refresh(session)
        session_id = session.id
    else:
        session = db.query(ChatSession).filter(
            ChatSession.id == request.session_id,
            ChatSession.user_id == current_user.id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        session_id = session.id
    
    user_message = ChatMessage(
        session_id=session_id,
        role="user",
        message_type="text",
        content=request.message
    )
    db.add(user_message)
    db.commit()
    
    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()
    
    chat_history = [{"role": msg.role, "content": msg.content} for msg in history]
    
    result = llm_service.generate_response(request.message, chat_history)

    assistant_message = ChatMessage(
        session_id=session_id,
        role="assistant",
        message_type=result.get("message_type", "text"),
        content=result["response"],
        metadata_=result.get("metadata"),
        model_name=result.get("model"),
        reasoning=result.get("reasoning")
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    return ChatResponse(
        session_id=session_id,
        message_id=assistant_message.id,
        response=result["response"],
        message_type=result.get("message_type", "text"),
        metadata=result.get("metadata"),
        sources=result.get("sources"),
        model=result.get("model"),
        reasoning=result.get("reasoning")
    )


@router.post("/clarify", response_model=ClarificationResponse)
def clarify_message(request: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not request.session_id:
        raise HTTPException(status_code=400, detail="session_id required for clarification")
    
    session = db.query(ChatSession).filter(
        ChatSession.id == request.session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == request.session_id
    ).order_by(ChatMessage.created_at).all()
    
    chat_history = [{"role": msg.role, "content": msg.content} for msg in history]
    
    result = clarification_service.analyze_and_clarify(request.message, chat_history)
    
    assistant_message = ChatMessage(
        session_id=request.session_id,
        role="assistant",
        message_type="clarification" if result["needs_clarification"] else "text",
        content=result.get("answer", ""),
        metadata_=result if result["needs_clarification"] else None
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)
    
    return ClarificationResponse(
        session_id=request.session_id,
        message_id=assistant_message.id,
        needs_clarification=result["needs_clarification"],
        questions=result.get("questions"),
        answer=result.get("answer")
    )


@router.get("/sessions", response_model=List[SessionResponse])
def get_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.updated_at.desc()).all()
    return sessions


@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
def get_messages(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()
    return [MessageResponse.from_orm_model(msg) for msg in messages]


@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
    db.delete(session)
    db.commit()
    return {"status": "deleted"}
