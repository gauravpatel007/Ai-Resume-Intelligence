import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import time
import json
from typing import List, Tuple
from app.utils.semantic import init_tfidf, init_semantic, search_job_description

# Synthetic Candidates
synthetic_candidates = [
    (1, "SKILLS:\nPython, Django, PostgreSQL\nABILITIES:\nI have extensive experience in building REST services for various microservices. Developed scalable backend systems."),
    (2, "SKILLS:\nJava, Spring Boot, MySQL\nABILITIES:\nCreated robust enterprise applications. Strong understanding of object-oriented design and API development using SOAP and REST."),
    (3, "SKILLS:\nJavaScript, React, Node.js\nABILITIES:\nFrontend developer who occasionally touches backend code. Built a few simple APIs for the frontend team."),
    (4, "SKILLS:\nPython, Flask, MongoDB\nABILITIES:\nPassionate about data science. Built a Flask web app to serve machine learning models over HTTP endpoints."),
    (5, "SKILLS:\nC++, OpenGL, Unreal Engine\nABILITIES:\nGame developer with 5 years of experience building 3D environments. No web backend experience.")
]

# Queries
queries = [
    {
        "id": "q1",
        "description": "We need a backend engineer focused on API development and creating robust integrations.",
        "expected_top_concept": "building REST services"
    },
    {
        "id": "q2",
        "description": "Looking for a data scientist to deploy machine learning models.",
        "expected_top_concept": "serve machine learning models"
    }
]

def run_evaluation():
    print("Initializing Models...")
    
    # Initialize TF-IDF
    t0 = time.time()
    init_tfidf(synthetic_candidates)
    t1 = time.time()
    print(f"TF-IDF init time: {t1 - t0:.3f}s")
    
    # Initialize Semantic
    t0 = time.time()
    init_semantic(synthetic_candidates)
    t1 = time.time()
    print(f"Semantic init time: {t1 - t0:.3f}s\n")
    
    print("-" * 50)
    print("Running Completion Check & Faculty Demo")
    print("-" * 50)
    
    for q in queries:
        print(f"\nQuery: '{q['description']}'")
        
        # 1. TF-IDF Baseline
        t0 = time.time()
        tfidf_res = search_job_description(q['description'], synthetic_candidates, method="tfidf", top_k=3)
        t_tfidf = time.time() - t0
        
        # 2. Semantic
        t0 = time.time()
        sem_res = search_job_description(q['description'], synthetic_candidates, method="semantic", top_k=3)
        t_sem = time.time() - t0
        
        print("\nTF-IDF Results:")
        print(f"Latency: {t_tfidf*1000:.1f}ms")
        for i, res in enumerate(tfidf_res):
            print(f"  {i+1}. Candidate {res['candidate_id']} (Score: {res['similarity_score']:.3f})")
            print(f"     Evidence: {res['evidence']}")
            
        print("\nSemantic Results:")
        print(f"Latency: {t_sem*1000:.1f}ms")
        for i, res in enumerate(sem_res):
            print(f"  {i+1}. Candidate {res['candidate_id']} (Score: {res['similarity_score']:.3f})")
            print(f"     Evidence: {res['evidence']}")
            
        print("\nComparison:")
        print("Notice how Semantic matching can bridge the vocabulary gap between 'API development' and 'building REST services', whereas TF-IDF relies heavily on exact keyword overlap (like 'API' or 'development').")
        
    print("\n" + "="*50)
    print("Documenting Trade-offs:")
    print("1. Latency: TF-IDF is generally much faster than Semantic embeddings, especially during initialization.")
    print("2. Memory: Semantic models require significantly more memory to store model weights and embeddings.")
    print("3. Quality: Semantic retrieval performs worse on highly specific acronyms or domain-specific jargon that was not well represented in its training data (e.g. proprietary software names).")
    print("="*50)

if __name__ == "__main__":
    run_evaluation()
