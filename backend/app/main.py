from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database.database import engine, Base
from .models import models # Import models to register them with Base
from .routes import auth, upload, search, export, candidate

# Create the database tables
Base.metadata.create_all(bind=engine)

# Auto-migrate candidates table (ignoring errors if columns already exist)
from sqlalchemy import text
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE candidates ADD COLUMN alternative_roles TEXT"))
        conn.execute(text("ALTER TABLE candidates ADD COLUMN is_role_uncertain BOOLEAN DEFAULT FALSE"))
        conn.commit()
    except Exception as e:
        # Columns likely already exist
        conn.rollback()
app = FastAPI(title="AI Resume Intelligence API")

# Configure CORS
origins = [
    "http://localhost:3200",
    "http://127.0.0.1:3200",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(search.router)
app.include_router(export.router)
app.include_router(candidate.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Resume Intelligence API"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend is running smoothly"}
