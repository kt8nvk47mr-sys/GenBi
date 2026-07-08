from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, Feedback

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


class FeedbackCreate(BaseModel):
    message_id: int
    rating: str
    category: Optional[str] = None
    comment: Optional[str] = None
    corrected_answer: Optional[str] = None
    is_data_accurate: Optional[bool] = None


class FeedbackResponse(BaseModel):
    id: int
    message_id: int
    user_id: int
    rating: str
    category: Optional[str]
    comment: Optional[str]
    corrected_answer: Optional[str]
    is_data_accurate: Optional[bool]
    created_at: datetime


class FeedbackStats(BaseModel):
    total: int
    likes: int
    dislikes: int
    categories: dict


@router.post("", response_model=FeedbackResponse)
def create_feedback(feedback_data: FeedbackCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Feedback).filter(
        Feedback.message_id == feedback_data.message_id,
        Feedback.user_id == current_user.id
    ).first()
    
    if existing:
        existing.rating = feedback_data.rating
        existing.category = feedback_data.category
        existing.comment = feedback_data.comment
        existing.corrected_answer = feedback_data.corrected_answer
        existing.is_data_accurate = feedback_data.is_data_accurate
        db.commit()
        db.refresh(existing)
        return existing
    
    feedback = Feedback(
        message_id=feedback_data.message_id,
        user_id=current_user.id,
        rating=feedback_data.rating,
        category=feedback_data.category,
        comment=feedback_data.comment,
        corrected_answer=feedback_data.corrected_answer,
        is_data_accurate=feedback_data.is_data_accurate
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get("", response_model=List[FeedbackResponse])
def get_feedback(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "moderator"]:
        feedbacks = db.query(Feedback).filter(Feedback.user_id == current_user.id).all()
    else:
        feedbacks = db.query(Feedback).all()
    return feedbacks


@router.get("/stats", response_model=FeedbackStats)
def get_feedback_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total = db.query(Feedback).count()
    likes = db.query(Feedback).filter(Feedback.rating == "like").count()
    dislikes = db.query(Feedback).filter(Feedback.rating == "dislike").count()
    
    from sqlalchemy import func
    categories = db.query(
        Feedback.category, func.count(Feedback.id)
    ).filter(Feedback.rating == "dislike").group_by(Feedback.category).all()
    
    return FeedbackStats(
        total=total,
        likes=likes,
        dislikes=dislikes,
        categories={cat: count for cat, count in categories if cat}
    )


@router.put("/{feedback_id}", response_model=FeedbackResponse)
def update_feedback(feedback_id: int, feedback_data: FeedbackCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    feedback = db.query(Feedback).filter(
        Feedback.id == feedback_id,
        Feedback.user_id == current_user.id
    ).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    feedback.rating = feedback_data.rating
    feedback.category = feedback_data.category
    feedback.comment = feedback_data.comment
    feedback.corrected_answer = feedback_data.corrected_answer
    feedback.is_data_accurate = feedback_data.is_data_accurate
    db.commit()
    db.refresh(feedback)
    return feedback


@router.delete("/{feedback_id}")
def delete_feedback(feedback_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    if current_user.role not in ["admin", "moderator"] and feedback.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(feedback)
    db.commit()
    return {"status": "deleted"}
