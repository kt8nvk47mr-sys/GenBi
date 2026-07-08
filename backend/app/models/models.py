from sqlalchemy import Column, String, Text, TIMESTAMP, JSON, Boolean, Integer
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user")
    created_at = Column(TIMESTAMP, server_default=func.now())


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    title = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, nullable=False)
    role = Column(String(10), nullable=False)
    message_type = Column(String(20), default="text")
    content = Column(Text, nullable=False)
    metadata_ = Column("metadata", JSON)
    model_name = Column(String(100), nullable=True)
    reasoning = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    rating = Column(String(10), nullable=False)
    category = Column(String(50))
    comment = Column(Text)
    corrected_answer = Column(Text)
    is_data_accurate = Column(Boolean)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now())


class KbDocument(Base):
    __tablename__ = "kb_documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    doc_type = Column(String(50), nullable=False)
    file_path = Column(String(1000))
    file_hash = Column(String(64))
    version = Column(Integer, default=1)
    status = Column(String(20), default="active")
    chunk_count = Column(Integer, default=0)
    uploaded_by = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now())


class KbChunk(Base):
    __tablename__ = "kb_chunks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(Integer, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    token_count = Column(Integer)
    embedding = Column(Text)
    metadata_ = Column("metadata", JSON)
    created_at = Column(TIMESTAMP, server_default=func.now())


class QueryCache(Base):
    __tablename__ = "query_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    query_hash = Column(String(64), unique=True, nullable=False)
    response = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.now())
    expires_at = Column(TIMESTAMP)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer)
    action = Column(String(50))
    details = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.now())
