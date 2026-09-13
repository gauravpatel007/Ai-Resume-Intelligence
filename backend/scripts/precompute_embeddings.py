"""
Offline script to precompute SentenceTransformer dense embeddings for all candidates
and save them to disk (uploads/embeddings_cache.pt).
This avoids any on-the-fly encoding during interactive search requests.
"""
import os
import sys
import time
import logging

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import torch
from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session, selectinload
from app.database.database import SessionLocal
from app.models.models import Candidate

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

CACHE_FILE = os.path.join(backend_dir, "uploads", "embeddings_cache.pt")

def precompute():
    db: Session = SessionLocal()
    try:
        logger.info("Fetching candidates from database...")
        candidates = (
            db.query(Candidate)
            .options(selectinload(Candidate.skills), selectinload(Candidate.abilities))
            .all()
        )
        total = len(candidates)
        logger.info(f"Loaded {total} candidates from database.")
        if total == 0:
            logger.warning("No candidates found in database.")
            return

        candidates_data = []
        for c in candidates:
            skills_list = [s.name for s in c.skills if s.name]
            abilities_list = [a.description for a in c.abilities if a.description]
            parts = []
            if abilities_list:
                parts.append("ABILITIES:\n" + "\n".join(abilities_list).strip())
            if skills_list:
                parts.append("SKILLS:\n" + ", ".join(skills_list))
            text = "\n\n".join(parts) if parts else "No textual profile data available."
            candidates_data.append((c.id, text))

        candidate_ids = [c[0] for c in candidates_data]
        texts = [c[1] for c in candidates_data]

        logger.info("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
        model = SentenceTransformer('all-MiniLM-L6-v2')

        logger.info(f"Computing embeddings for {total} candidates...")
        start = time.time()
        embeddings = model.encode(texts, batch_size=64, show_progress_bar=True, convert_to_tensor=True)
        elapsed = time.time() - start
        logger.info(f"Embeddings calculated in {elapsed:.1f}s ({total/elapsed:.1f} candidates/sec).")

        os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
        torch.save({
            "candidate_ids": candidate_ids,
            "embeddings": embeddings.cpu()
        }, CACHE_FILE)
        logger.info(f"Successfully saved embeddings cache to {CACHE_FILE}")

    finally:
        db.close()

if __name__ == "__main__":
    precompute()
