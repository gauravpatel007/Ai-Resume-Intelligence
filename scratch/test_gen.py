import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

# pyrefly: ignore [missing-import]
from app.services.interview_service import generate_questions

print("Testing Frontend Developer MCQ for Fresher:")
questions = generate_questions("Frontend Developer", "< 5 LPA", "Fresher", "React, JavaScript, CSS", "mcq")
for q in questions:
    print(f"[{q['id']}] {q['question']}")

print("\nTesting Backend Developer Normal for 1-3 Years (no explicit skills):")
questions2 = generate_questions("Backend Developer", "10-20 LPA", "1-3 Years", "", "normal")
for q in questions2:
    print(f"[{q['id']}] {q['question']}")
