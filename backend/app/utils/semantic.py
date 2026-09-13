import logging
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

EMBEDDINGS_CACHE_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "embeddings_cache.pt"
)

# Global caches
_tfidf_vectorizer = None
_tfidf_matrix = None
_tfidf_candidate_ids = []

_embedding_model = None
_embedding_matrix = None
_embedding_candidate_ids = []

def get_embedding_model():
    """Lazily load SentenceTransformer model."""
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            import torch
            torch.set_num_threads(1)  # Prevent CPU thread starvation of the event loop
            logger.info("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
            _embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        except ImportError:
            logger.error("sentence-transformers is not installed.")
            return None
    return _embedding_model

def load_cached_embeddings():
    """Load precomputed embeddings from disk if available."""
    global _embedding_matrix, _embedding_candidate_ids
    if _embedding_matrix is not None:
        return True
    if os.path.exists(EMBEDDINGS_CACHE_FILE):
        try:
            import torch
            logger.info(f"Loading persistent embeddings from {EMBEDDINGS_CACHE_FILE}...")
            cache = torch.load(EMBEDDINGS_CACHE_FILE, map_location="cpu")
            _embedding_candidate_ids = cache.get("candidate_ids", [])
            _embedding_matrix = cache.get("embeddings")
            logger.info(f"Loaded {len(_embedding_candidate_ids)} candidate embeddings from disk cache.")
            return True
        except Exception as e:
            logger.warning(f"Could not load disk cache: {e}")
    return False

def save_embeddings_cache():
    """Save in-memory embeddings to disk cache."""
    global _embedding_matrix, _embedding_candidate_ids
    if _embedding_matrix is None or not _embedding_candidate_ids:
        return
    try:
        import torch
        os.makedirs(os.path.dirname(EMBEDDINGS_CACHE_FILE), exist_ok=True)
        torch.save({
            "candidate_ids": _embedding_candidate_ids,
            "embeddings": _embedding_matrix.cpu() if hasattr(_embedding_matrix, 'cpu') else _embedding_matrix
        }, EMBEDDINGS_CACHE_FILE)
        logger.info(f"Successfully saved {len(_embedding_candidate_ids)} embeddings to disk cache.")
    except Exception as e:
        logger.warning(f"Failed to save embeddings to disk: {e}")

def init_tfidf(candidates_data: List[Tuple[int, str]]):
    """
    Initialize and fit the TF-IDF vectorizer on the given candidate profiles.
    candidates_data is a list of (candidate_id, profile_text)
    """
    global _tfidf_vectorizer, _tfidf_matrix, _tfidf_candidate_ids
    
    if not candidates_data:
        logger.warning("No candidate data provided for TF-IDF initialization.")
        return
        
    _tfidf_candidate_ids = [c[0] for c in candidates_data]
    texts = [c[1] for c in candidates_data]
    
    _tfidf_vectorizer = TfidfVectorizer(stop_words='english', max_features=10000)
    _tfidf_matrix = _tfidf_vectorizer.fit_transform(texts)
    logger.info(f"TF-IDF initialized with {len(texts)} candidates.")

def init_semantic(candidates_data: List[Tuple[int, str]]):
    """
    Initialize the SentenceTransformer model and compute embeddings.
    """
    global _embedding_model, _embedding_matrix, _embedding_candidate_ids
    import torch

    model = get_embedding_model()
    if model is None:
        return

    # Check disk cache first
    load_cached_embeddings()

    current_ids = [c[0] for c in candidates_data]
    
    if _embedding_matrix is not None and len(_embedding_candidate_ids) > 0:
        existing_id_set = set(_embedding_candidate_ids)
        new_candidates = [c for c in candidates_data if c[0] not in existing_id_set]
        
        if new_candidates:
            new_texts = [c[1] for c in new_candidates]
            logger.info(f"Computing embeddings for {len(new_texts)} NEW candidates...")
            new_matrix = model.encode(new_texts, convert_to_tensor=True)
            _embedding_matrix = torch.cat([_embedding_matrix, new_matrix])
            _embedding_candidate_ids.extend([c[0] for c in new_candidates])
            save_embeddings_cache()
    elif len(candidates_data) <= 500:
        # Only compute synchronously if candidate pool is reasonably small
        _embedding_candidate_ids = current_ids
        texts = [c[1] for c in candidates_data]
        logger.info(f"Computing embeddings for {len(texts)} candidates...")
        _embedding_matrix = model.encode(texts, convert_to_tensor=True)
        save_embeddings_cache()
        logger.info("Semantic embeddings initialized.")
    else:
        logger.info(f"Dataset has {len(candidates_data)} candidates. Using 2-Stage Hybrid Semantic Search to respond in ~1s instead of 25 minutes.")

def find_best_snippet(query: str, text: str, method: str = "tfidf") -> str:
    """
    Finds the most relevant sentence in `text` for the given `query`.
    """
    if not text or not query:
        return ""
        
    sentences = [s.strip() for s in text.replace('\n', '. ').split('.') if s.strip()]
    if not sentences:
        return text[:150] + "..."
        
    if method == "tfidf":
        if _tfidf_vectorizer is None:
            return sentences[0][:150] + "..."
        
        query_vec = _tfidf_vectorizer.transform([query])
        sent_vecs = _tfidf_vectorizer.transform(sentences)
        sims = cosine_similarity(query_vec, sent_vecs)[0]
        best_idx = np.argmax(sims)
        return sentences[best_idx]
        
    elif method == "semantic":
        if _embedding_model is None:
             return sentences[0][:150] + "..."
        from sentence_transformers import util
        query_emb = _embedding_model.encode([query], convert_to_tensor=True)
        sent_embs = _embedding_model.encode(sentences, convert_to_tensor=True)
        
        cos_scores = util.cos_sim(query_emb, sent_embs)[0]
        best_idx = int(np.argmax(cos_scores.cpu().numpy()))
        return sentences[best_idx]
        
    return sentences[0][:150] + "..."

def match_tfidf(query: str, candidates_data: List[Tuple[int, str]], top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Rank candidates based on TF-IDF cosine similarity.
    """
    global _tfidf_vectorizer, _tfidf_matrix, _tfidf_candidate_ids
    
    # Rebuild cache if candidates list changed size
    current_ids = [c[0] for c in candidates_data]
    if _tfidf_vectorizer is None or _tfidf_matrix is None or len(_tfidf_candidate_ids) != len(current_ids):
        init_tfidf(candidates_data)
        
    if _tfidf_vectorizer is None or _tfidf_matrix is None:
        return []
        
    query_vec = _tfidf_vectorizer.transform([query])
    sims = cosine_similarity(query_vec, _tfidf_matrix)[0]
    
    candidates_dict = dict(candidates_data)
    results = []
    for idx in sims.argsort()[::-1][:top_k]:
        candidate_id = _tfidf_candidate_ids[idx]
        score = float(sims[idx])
        profile_text = candidates_dict.get(candidate_id, "")
        
        snippet = find_best_snippet(query, profile_text, method="tfidf")
        
        results.append({
            "candidate_id": candidate_id,
            "similarity_score": score,
            "evidence": snippet
        })
        
    return results

def match_semantic(query: str, candidates_data: List[Tuple[int, str]], top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Rank candidates based on SentenceTransformers semantic similarity.
    Uses precomputed disk cache if available, or fast 2-stage hybrid reranking.
    """
    global _embedding_model, _embedding_matrix, _embedding_candidate_ids
    from sentence_transformers import util
    
    model = get_embedding_model()
    if model is None:
        # Fallback to TF-IDF if model failed to load
        return match_tfidf(query, candidates_data, top_k)
        
    # Check if disk cache or in-memory matrix is available
    load_cached_embeddings()
    
    if _embedding_matrix is not None and len(_embedding_candidate_ids) > 0:
        # Full precomputed corpus search (Ultra-fast: ~5ms)
        query_emb = model.encode([query], convert_to_tensor=True)
        cos_scores = util.cos_sim(query_emb, _embedding_matrix)[0].cpu().numpy()
        
        candidates_map = {c[0]: c[1] for c in candidates_data}
        results = []
        for idx in cos_scores.argsort()[::-1]:
            candidate_id = _embedding_candidate_ids[idx]
            if candidate_id not in candidates_map:
                continue
            score = float(cos_scores[idx])
            profile_text = candidates_map[candidate_id]
            snippet = find_best_snippet(query, profile_text, method="semantic")
            results.append({
                "candidate_id": candidate_id,
                "similarity_score": score,
                "evidence": snippet
            })
            if len(results) >= top_k:
                break
        return results

    # If full matrix is not yet precomputed and candidate pool is large:
    # Use 2-Stage Hybrid Semantic Search:
    # 1. Fast TF-IDF pre-filter retrieves top 100 candidate candidates in 50ms
    # 2. SentenceTransformers densely encodes and reranks only those 100 in ~0.5s
    logger.info("Full embeddings cache not found on disk. Running 2-Stage Hybrid Semantic Reranking...")
    pool_size = min(150, len(candidates_data))
    
    # Stage 1: Fast TF-IDF retrieval
    initial_matches = match_tfidf(query, candidates_data, top_k=pool_size)
    if not initial_matches:
        return []
        
    candidates_map = {c[0]: c[1] for c in candidates_data}
    pool_ids = [m["candidate_id"] for m in initial_matches]
    pool_texts = [candidates_map[cid] for cid in pool_ids if cid in candidates_map]
    
    # Stage 2: Dense neural reranking with SentenceTransformers
    query_emb = model.encode([query], convert_to_tensor=True)
    pool_embs = model.encode(pool_texts, convert_to_tensor=True)
    cos_scores = util.cos_sim(query_emb, pool_embs)[0].cpu().numpy()
    
    results = []
    for idx in cos_scores.argsort()[::-1][:top_k]:
        candidate_id = pool_ids[idx]
        score = float(cos_scores[idx])
        profile_text = pool_texts[idx]
        snippet = find_best_snippet(query, profile_text, method="semantic")
        results.append({
            "candidate_id": candidate_id,
            "similarity_score": score,
            "evidence": snippet
        })
    return results

def search_job_description(
    job_description: str,
    candidates_data: List[Tuple[int, str]],
    method: str = "tfidf",
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Main entrypoint for matching a job description against candidates.
    Returns list of dicts with candidate_id, similarity_score, and evidence snippet.
    """
    if method == "semantic":
        return match_semantic(job_description, candidates_data, top_k)
    else:
        return match_tfidf(job_description, candidates_data, top_k)
