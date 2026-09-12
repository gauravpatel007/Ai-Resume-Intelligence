import re
from datetime import datetime
from typing import List, Dict, Any

MONTH_MAP = {
    'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
    'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6, 'jul': 7, 'july': 7,
    'aug': 8, 'august': 8, 'sep': 9, 'sept': 9, 'september': 9,
    'oct': 10, 'october': 10, 'nov': 11, 'november': 11, 'dec': 12, 'december': 12
}

def parse_date(date_str: str, is_end_date: bool = False) -> datetime:
    """Attempts to parse a date string like '10/2012', 'Jan 2015', '2012' or 'Present'."""
    if not date_str or str(date_str).lower() in ['present', 'current', 'now']:
        return datetime.utcnow()
        
    date_str = str(date_str).lower().strip()
    
    year_match = re.search(r'\b(19|20)\d{2}\b', date_str)
    if not year_match:
        return None
        
    year = int(year_match.group())
    month = 1
    
    found_month = False
    for m_word, m_num in MONTH_MAP.items():
        if re.search(r'\b' + m_word + r'\b', date_str):
            month = m_num
            found_month = True
            break
            
    if not found_month:
        num_match = re.search(r'\b(\d{1,2})[-/]\d{4}\b', date_str)
        if num_match:
            try:
                m = int(num_match.group(1))
                if 1 <= m <= 12:
                    month = m
                    found_month = True
            except:
                pass
                
    if not found_month and is_end_date:
        month = 12
        
    try:
        return datetime(year, month, 1)
    except:
        return None

def calculate_total_experience(experiences: List[Any]) -> float:
    """Calculates total elapsed experience in years based on merged start and end intervals."""
    intervals = []
    
    for exp in experiences:
        if not exp.start_date:
            continue
            
        start = parse_date(exp.start_date, is_end_date=False)
        end = parse_date(exp.end_date, is_end_date=True)
        
        if not start:
            continue
        if not end:
            end = datetime.utcnow()
            
        if start > end:
            start, end = end, start
            
        intervals.append((start, end))
        
    if not intervals:
        return 0.0
        
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    
    for current_start, current_end in intervals[1:]:
        last_start, last_end = merged[-1]
        if current_start <= last_end:
            merged[-1] = (last_start, max(last_end, current_end))
        else:
            merged.append((current_start, current_end))
            
    total_days = sum((end - start).days for start, end in merged)
    return round(total_days / 365.25, 1)

def score_candidate(
    candidate: Any, 
    target_role: str, 
    req_skills: List[str], 
    pref_skills: List[str], 
    min_exp: int,
    req_degree: str = "Any",
    profile_text: str = ""
) -> Dict[str, Any]:
    """
    Transparent Scoring Algorithm
    - Required Skills (40%)
    - Experience Match (25%)
    - Job Role Match (20%)
    - Education/Abilities (15%)
    """
    score = 0.0
    breakdown = {}
    explanations = []
    
    # Helper to find a snippet
    def find_snippet(keyword: str, text: str) -> str:
        if not text:
            return ""
        # Find sentence containing keyword
        pattern = re.compile(r'([^.!?\n]*\b' + re.escape(keyword) + r'\b[^.!?\n]*)[.!?\n]?', re.IGNORECASE)
        match = pattern.search(text)
        if match:
            snippet = match.group(1).strip()
            snippet = snippet.lstrip("•*- \t'\"").strip()
            # truncate if too long
            if len(snippet) > 120:
                idx = snippet.lower().find(keyword.lower())
                start = max(0, idx - 40)
                end = min(len(snippet), idx + len(keyword) + 40)
                snippet = "..." + snippet[start:end].strip() + "..."
            return snippet
        return ""
    
    # Normalize inputs
    target_role_lower = target_role.lower()
    req_skills_lower = [s.lower() for s in req_skills]
    pref_skills_lower = [s.lower() for s in pref_skills]
    
    candidate_extracted_skills = [s.name.lower() for s in candidate.skills]
    candidate_manual_skills = [s.strip().lower() for s in (getattr(candidate, 'manual_skills', '') or '').split(',') if s.strip()]
    all_candidate_skills = set(candidate_extracted_skills + candidate_manual_skills)
    
    # 1. Skills (40%)
    # Required skills are mandatory. Missing them heavily penalizes out of 30%.
    matched_req = []
    missing_req = []
    
    for rs in req_skills_lower:
        if rs in all_candidate_skills:
            matched_req.append(rs)
            snippet = find_snippet(rs, profile_text)
            clean_snip = snippet.strip("•*- \t'\"")
            
            if rs in candidate_extracted_skills:
                finding = "Verified"
                evidence = f'"{clean_snip}"' if clean_snip else "Found in AI extracted skills."
            elif clean_snip:
                finding = "Evidence found"
                evidence = f'"{clean_snip}"'
            else:
                finding = "Not verified"
                evidence = "Manually added. No textual evidence found."
                
            explanations.append({
                "requirement": rs.title(),
                "finding": finding,
                "evidence": evidence
            })
        else:
            missing_req.append(rs)
            explanations.append({
                "requirement": rs.title(),
                "finding": "Not found",
                "evidence": "No matching evidence located"
            })
            
    req_score = 0
    if req_skills_lower:
        req_ratio = len(matched_req) / len(req_skills_lower)
        req_score = req_ratio * 30.0
    else:
        req_score = 30.0 # Free points if none requested
        
    # Preferred skills (10%)
    matched_pref = []
    for ps in pref_skills_lower:
        if ps in all_candidate_skills:
            matched_pref.append(ps)
            snippet = find_snippet(ps, profile_text)
            clean_snip = snippet.strip("•*- \t'\"")
            
            if ps in candidate_extracted_skills:
                finding = "Verified"
                evidence = f'"{clean_snip}"' if clean_snip else "Found in AI extracted skills."
            elif clean_snip:
                finding = "Evidence found"
                evidence = f'"{clean_snip}"'
            else:
                finding = "Not verified"
                evidence = "Manually added. No textual evidence found."
                
            explanations.append({
                "requirement": ps.title() + " (Preferred)",
                "finding": finding,
                "evidence": evidence
            })
    pref_score = 0
    if pref_skills_lower:
        pref_ratio = len(matched_pref) / len(pref_skills_lower)
        pref_score = pref_ratio * 10.0
    else:
        pref_score = 10.0
        
    skills_score = req_score + pref_score
    score += skills_score
    breakdown["skills_score"] = round(skills_score, 1)
    
    # 2. Experience Match (25%)
    exp_years = calculate_total_experience(candidate.experiences)
    breakdown["calculated_experience_years"] = exp_years
    
    exp_score = 0.0
    if min_exp and min_exp > 0:
        if exp_years >= min_exp:
            exp_score = 25.0
            explanations.append({
                "requirement": f"{min_exp} years of experience",
                "finding": "Meets requirement",
                "evidence": f"Calculated {exp_years} years from employment history."
            })
        else:
            exp_score = (exp_years / min_exp) * 25.0
            explanations.append({
                "requirement": f"{min_exp} years of experience",
                "finding": "Below requirement",
                "evidence": f"Candidate has {exp_years} years vs {min_exp} years required."
            })
    else:
        exp_score = 25.0 # Free points if 0 required
            
    score += exp_score
    breakdown["experience_score"] = round(exp_score, 1)
    
    # 3. Job Role Match (20%)
    role_score = 0.0
    if target_role_lower == "any":
        role_score = 20.0
    else:
        # Check ML Predicted Role
        if candidate.predicted_job_role and target_role_lower in candidate.predicted_job_role.lower():
            role_score = 20.0
            explanations.append({
                "requirement": f"Role: {target_role.title()}",
                "finding": "Predicted Role Match",
                "evidence": f"AI model classified profile as '{candidate.predicted_job_role}'."
            })
        else:
            # Check Past Experience Titles
            past_titles = [e.title.lower() for e in candidate.experiences if e.title]
            if any(target_role_lower in t for t in past_titles):
                role_score = 15.0 # Partial credit if they had it in the past but not predicted as primary
                matched_title = next(t for t in past_titles if target_role_lower in t)
                explanations.append({
                    "requirement": f"Role: {target_role.title()}",
                    "finding": "Past Experience Match",
                    "evidence": f"Held past role containing '{matched_title.title()}'."
                })
            else:
                explanations.append({
                    "requirement": f"Role: {target_role.title()}",
                    "finding": "Not found",
                    "evidence": f"Target role missing from prediction and past titles."
                })
                
    score += role_score
    breakdown["role_score"] = round(role_score, 1)
    
    # 4. Education & Abilities (15%)
    # Education: 10%, Abilities: 5%
    ab_score = 5.0 if candidate.abilities else 0.0
    
    # Check Candidate's highest degree
    def get_degree_level(degree_str):
        if not degree_str: return 0
        ds = degree_str.lower()
        if "phd" in ds or "doctor" in ds: return 3
        if "master" in ds: return 2
        if "bachelor" in ds: return 1
        return 0

    highest_level = 0
    highest_edu_obj = None
    for edu in candidate.educations:
        level = get_degree_level(edu.degree)
        if level > highest_level:
            highest_level = level
            highest_edu_obj = edu
        
    req_level = get_degree_level(req_degree)
    
    clean_deg_name = req_degree.value.title() if hasattr(req_degree, "value") else str(req_degree).replace("DegreeType.", "").replace("degree_type.", "").title()
    if clean_deg_name.lower() == "any":
        deg_req_label = "Any Degree"
    elif not clean_deg_name.lower().endswith("degree"):
        deg_req_label = f"{clean_deg_name} Degree"
    else:
        deg_req_label = clean_deg_name

    if req_level > 0:
        if highest_level >= req_level:
            edu_score = 10.0
            explanations.append({
                "requirement": f"Degree: {deg_req_label}",
                "finding": "Requirement met",
                "evidence": f"Found {highest_edu_obj.degree} from {highest_edu_obj.institution or 'institution'}." if highest_edu_obj else "Degree level met."
            })
        else:
            edu_score = 0.0 # Penalty for missing required degree
            explanations.append({
                "requirement": f"Degree: {deg_req_label}",
                "finding": "Not found",
                "evidence": "Highest recorded degree does not meet requirement."
            })
    else: # Any
        edu_score = 10.0 if candidate.educations else 0.0
        
    edu_ab_score = edu_score + ab_score
    score += edu_ab_score
    breakdown["education_abilities_score"] = round(edu_ab_score, 1)
    
    breakdown["total_score"] = round(score, 1)
    breakdown["matched_required"] = matched_req
    breakdown["missing_required"] = missing_req
    breakdown["matched_preferred"] = matched_pref
    breakdown["calculated_experience_years"] = exp_years
    breakdown["explanations"] = explanations
    
    # Generate Analysis
    strengths = []
    if skills_score >= 35:
        strengths.append("Exceptional technical skill match.")
    elif skills_score >= 25:
        strengths.append("Strong technical skill match.")
        
    if exp_score >= 20:
        strengths.append("Meets or exceeds experience requirements.")
        
    if role_score >= 15:
        strengths.append("Proven background in the target role.")
        
    weak_areas = []
    if missing_req:
        weak_areas.append(f"Missing key required skills: {', '.join(missing_req[:3])}{'...' if len(missing_req)>3 else ''}")
    if exp_score < 15 and min_exp:
        weak_areas.append("Falls short of the requested minimum experience.")
    if req_degree != "Any" and edu_score == 0.0:
        weak_areas.append(f"Does not meet the {req_degree} degree requirement.")
        
    recommendation = "Consider"
    if score >= 80:
        recommendation = "Strong Hire"
    elif score < 60:
        recommendation = "Reject"
        
    breakdown["analysis"] = {
        "strengths": " ".join(strengths) if strengths else "No major strengths identified.",
        "weak_areas": " ".join(weak_areas) if weak_areas else "No significant weak areas identified.",
        "recommendation": recommendation
    }
    
    return breakdown
