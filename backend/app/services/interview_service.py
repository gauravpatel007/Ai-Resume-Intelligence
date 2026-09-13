from typing import List, Dict, Any
from ..utils.roles_catalog import get_role_by_name
from ..utils.questions_catalog import get_mcq_questions, get_normal_questions

def sanitize_skills(skills_str: str, role_name: str) -> List[str]:
    """
    Normalizes skill string into a deduplicated list of skills.
    If no valid skills exist, fallback to the role's required skills.
    """
    skill_list = []
    if skills_str and skills_str.strip():
        # Split by comma, strip whitespace, remove empty
        raw_skills = [s.strip() for s in skills_str.split(',') if s.strip()]
        # Deduplicate while preserving order
        seen = set()
        for s in raw_skills:
            lower_s = s.lower()
            if lower_s not in seen:
                seen.add(lower_s)
                skill_list.append(s)
                
    if not skill_list:
        role_data = get_role_by_name(role_name)
        if role_data and "req_skills" in role_data:
            skill_list = role_data["req_skills"]
        else:
            skill_list = ["Core Concepts", "Problem Solving", "Best Practices"]
            
    return skill_list

def get_difficulty(experience: str) -> str:
    """Map the selected experience to a difficulty level string."""
    exp = (experience or "").lower()
    if "fresher" in exp:
        return "Fresher"
    elif "1-3" in exp:
        return "1-3 Years"
    elif "3-5" in exp:
        return "3-5 Years"
    elif "5+" in exp:
        return "5+ Years"
    return "Fresher" # Default fallback

def generate_questions(role: str, package: str, experience: str, skills: str, interview_type: str) -> List[Dict[str, Any]]:
    role_name = role.strip() if role and role.strip() else "Professional"
    
    skill_list = sanitize_skills(skills, role_name)
    difficulty = get_difficulty(experience)
    is_mcq = (interview_type.strip().lower() == "mcq") if interview_type else False
    
    questions = []
    used_questions = set()
    
    for i in range(1, 11):
        target_skill = skill_list[(i - 1) % len(skill_list)]
        target_skill_lower = target_skill.lower()
        
        q_entry = None
        
        if is_mcq:
            catalog = get_mcq_questions(target_skill_lower)
            # Try to find a matching difficulty first
            for q in catalog:
                if q["question"] not in used_questions and q["difficulty"] == difficulty:
                    q_entry = q
                    break
            
            # If no exact difficulty match, pick any unused
            if not q_entry:
                for q in catalog:
                    if q["question"] not in used_questions:
                        q_entry = q
                        break
                        
            if q_entry:
                used_questions.add(q_entry["question"])
                questions.append({
                    "id": i,
                    "question": f"({target_skill}) {q_entry['question']}",
                    "options": q_entry["options"],
                    "correct_answer": q_entry["correct_answer"]
                })
            else:
                # Better generic fallback for MCQ without wrong assumptions
                q_text = f"When evaluating a solution involving {target_skill} for a {role_name} role, what is generally considered the most critical factor?"
                options = [
                    f"Avoiding the use of {target_skill} where possible.",
                    f"Ensuring the implementation addresses explicit requirements and constraints.",
                    f"Hardcoding all configurations for faster deployment.",
                    f"Using {target_skill} exclusively on local environments."
                ]
                correct = options[1]
                questions.append({
                    "id": i,
                    "question": q_text,
                    "options": options,
                    "correct_answer": correct
                })
        else:
            catalog = get_normal_questions(target_skill_lower)
            # Try to find a matching difficulty first
            for q in catalog:
                if q["question"] not in used_questions and q["difficulty"] == difficulty:
                    q_entry = q
                    break
            
            # If no exact difficulty match, pick any unused
            if not q_entry:
                for q in catalog:
                    if q["question"] not in used_questions:
                        q_entry = q
                        break
            
            if q_entry:
                used_questions.add(q_entry["question"])
                questions.append({
                    "id": i,
                    "question": f"({target_skill}) {q_entry['question']}",
                    "options": None,
                    "correct_answer": None # Rubric could be sent, but UI expects null for correct_answer
                })
            else:
                # Better generic fallback for normal questions based on experience
                if difficulty == "Fresher":
                    q_text = f"Explain a fundamental concept related to {target_skill} and describe a small task where you would apply it."
                else:
                    q_text = f"Describe a complex scenario or trade-off you encountered when working with {target_skill}. How did you resolve it?"
                
                questions.append({
                    "id": i,
                    "question": q_text,
                    "options": None,
                    "correct_answer": None
                })
                
    return questions
