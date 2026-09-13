import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/airesumedb")

# If DATABASE_URL uses localhost on Windows, map to 127.0.0.1 to avoid IPv6 (::1) multi-minute connect timeout
if "@localhost:" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("@localhost:", "@127.0.0.1:")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 5}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
