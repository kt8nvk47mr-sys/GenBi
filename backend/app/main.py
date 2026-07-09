from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, chat, feedback, data, settings, knowledge
from app.core.database import engine, Base
from app.core.security import get_password_hash

app = FastAPI(
    title="GenBI API",
    description="Генеративная аналитическая платформа для сырьевого обеспечения",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(feedback.router)
app.include_router(data.router)
app.include_router(settings.router)
app.include_router(knowledge.router)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    # Create default admin user if not exists
    from app.core.database import SessionLocal
    from app.models.models import User
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                password_hash=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("Default admin user created (admin/admin123)")
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "GenBI API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
