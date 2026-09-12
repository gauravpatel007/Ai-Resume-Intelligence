import re
# pyrefly: ignore [missing-import]
import spacy
from sqlalchemy.orm import Session
from ..models.models import Skill

# Load spaCy model lazily to avoid startup delay if not needed immediately
nlp_model = None

def get_nlp():
    global nlp_model
    if nlp_model is None:
        try:
            nlp_model = spacy.load("en_core_web_sm")
        except OSError:
            # Fallback if model isn't downloaded yet (for robust error handling)
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
            nlp_model = spacy.load("en_core_web_sm")
    return nlp_model

def extract_email_phone(text: str):
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    phone_pattern = r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    
    emails = re.findall(email_pattern, text)
    phones = re.findall(phone_pattern, text)
    
    return {
        "email": emails[0] if emails else None,
        "phone": phones[0] if phones else None
    }

def extract_entities(text: str):
    nlp = get_nlp()
    doc = nlp(text)
    
    entities = {
        "names": [],
        "organizations": [],
        "locations": []
    }
    
    for ent in doc.ents:
        if ent.label_ == "PERSON" and ent.text not in entities["names"] and len(ent.text.split()) <= 3 and not any(kw in ent.text.lower() for kw in ['admin', 'java', 'mean', 'react', 'python', 'developer']):
            entities["names"].append(ent.text.strip())
        elif ent.label_ == "ORG" and ent.text not in entities["organizations"]:
            entities["organizations"].append(ent.text.strip())
        elif ent.label_ == "GPE" and ent.text not in entities["locations"]:
            entities["locations"].append(ent.text.strip())
            
    # Fallback 1: Check the first non-empty line of the resume, usually it's the name
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    if lines:
        first_line = lines[0]
        # If it's a short string without weird characters, it's likely a name
        if len(first_line.split()) <= 3 and re.match(r'^[A-Za-z\s\.]+$', first_line):
            if not any(kw in first_line.lower() for kw in ['resume', 'cv', 'curriculum vitae', 'profile']):
                if first_line not in entities["names"]:
                    entities["names"].insert(0, first_line.title())
                    
    # Strict filtering: remove any names containing bad words or commas
    bad_name_kws = ['admin', 'java', 'mean', 'react', 'python', 'developer', 'mitec', 'technology', 'engineer', 'manager', 'institute', 'university', 'college']
    valid_names = []
    for name in entities["names"]:
        name_lower = name.lower()
        if ',' in name or len(name.split()) > 4:
            continue
        if any(kw in name_lower for kw in bad_name_kws):
            continue
        valid_names.append(name)
    entities["names"] = valid_names
                
    # Fallback 2: Extract from email if we still don't have a good name
    email_dict = extract_email_phone(text)
    if email_dict.get("email"):
        email = email_dict["email"]
        # extract part before @ and remove numbers
        name_part = email.split('@')[0]
        name_part = re.sub(r'[0-9]', '', name_part)
        name_part = name_part.replace('.', ' ').replace('_', ' ')
        # split by capitals if camel case
        name_part = re.sub(r'([A-Z])', r' \1', name_part).strip()
        if name_part and len(name_part) > 2:
            formatted_name = name_part.title()
            if formatted_name not in entities["names"]:
                entities["names"].insert(0, formatted_name)
                
    return entities

def extract_skills(text: str, db: Session):
    # For a production app with 200k skills, we wouldn't fetch all.
    # Instead, we tokenize the resume and query the DB for matching tokens.
    
    # 1. Extract n-grams (1 to 4 words) to support multi-word skills and punctuation
    raw_tokens = re.findall(r'[a-z0-9+#.-]+', text.lower())
    tokens = [t.rstrip('.') for t in raw_tokens if t.rstrip('.')]
    
    phrases = set()
    n_tokens = len(tokens)
    for n in range(1, 5): # 1-gram to 4-grams
        for i in range(n_tokens - n + 1):
            phrase = " ".join(tokens[i:i+n])
            phrases.add(phrase)
            
    phrases = list(phrases)
    if not phrases:
        return []
        
    # 2. Query DB for matching skills using IN clause (chunked to avoid SQLite limits)
    matched_skills = []
    chunk_size = 900
    for i in range(0, len(phrases), chunk_size):
        chunk = phrases[i:i+chunk_size]
        results = db.query(Skill.name).filter(
            func.lower(Skill.name).in_(chunk)
        ).all()
        matched_skills.extend(results)
        
    # Extract unique strings from tuples
    return list(set(skill[0] for skill in matched_skills))

from sqlalchemy import func

def standardize_degree(text: str):
    """
    Extracts and standardizes the degree (PhD, Master, Bachelor) and specific field.
    """
    if not text or not isinstance(text, str) or text.lower() == 'nan':
        return {"degree": None, "specific_field": None}
    
    text_lower = text.lower()
    
    def clean_field(pat, txt):
        field = re.sub(pat, '', txt, flags=re.IGNORECASE)
        field = re.sub(r'\b(of|in)\b', '', field, flags=re.IGNORECASE).strip()
        return field.title() if field else None

    # Check for PhD
    phd_patterns = [r'\bphd\b', r'\bph\.d\b', r'\bdoctorate\b', r'\bdoctor\b']
    for pat in phd_patterns:
        if re.search(pat, text_lower):
            return {"degree": "PhD", "specific_field": clean_field(pat, text_lower)}
            
    # Check for Master
    master_patterns = [r'\bmaster\b', r'\bmsc\b', r'\bm\.sc\b', r'\bmtech\b', r'\bm\.tech\b', r'\bms\b', r'\bm\.s\b', r'\bma\b', r'\bm\.a\b', r'\bmba\b']
    for pat in master_patterns:
        if re.search(pat, text_lower):
            return {"degree": "Master", "specific_field": clean_field(pat, text_lower)}
            
    # Check for Bachelor
    bachelor_patterns = [r'\bbachelor\b', r'\bbsc\b', r'\bb\.sc\b', r'\bbtech\b', r'\bb\.tech\b', r'\bbs\b', r'\bb\.s\b', r'\bba\b', r'\bb\.a\b', r'\bbba\b']
    for pat in bachelor_patterns:
        if re.search(pat, text_lower):
            return {"degree": "Bachelor", "specific_field": clean_field(pat, text_lower)}
            
    return {"degree": None, "specific_field": text.title() if text else None}

def extract_sections(text: str):
    sections = {
        "education": [],
        "experience": [],
        "skills": [],
        "abilities": []
    }
    
    current_section = None
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    for i, line in enumerate(lines):
        upper = line.upper()
        
        # Education
        if upper in ['EDUCATION', 'EDUCATIONAL QUALIFICATIONS', 'ACADEMIC BACKGROUND', 'ACADEMICS', 'EDUCATION DETAILS'] or 'EDUCATIONAL QUALIFICATION' in upper:
            current_section = 'education'
            continue
            
        # Experience
        if upper in ['EXPERIENCE', 'WORK EXPERIENCE', 'PROFESSIONAL EXPERIENCE', 'EMPLOYMENT HISTORY', 'EMPLOYMENT'] or 'WORK EXPERIENCE' in upper:
            current_section = 'experience'
            continue
            
        # Skills
        if upper in ['SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES', 'IT SKILLS'] or 'TECHNICAL SKILLS' in upper:
            current_section = 'skills'
            continue
            
        # Abilities / Profile
        if upper in ['SUMMARY', 'PROFILE', 'OBJECTIVE', 'CAREER OBJECTIVE', 'ABILITIES & HIGHLIGHTS', 'PROFESSIONAL SUMMARY']:
            current_section = 'abilities'
            continue
            
        # Ignore short unclassified headers
        if len(line) < 40 and line == upper and not current_section and i > 5:
            continue
            
        if current_section:
            sections[current_section].append(line)
            
    # Post-process sections to filter table headers and merge fragmented lines
    def clean_and_merge_section(section_lines):
        headers_to_ignore = ['Position & Institution', 'Period', 'Qualification', 'Institute / University', 'Year', 'Result', 'Industry Professional', 'Board / University']
        cleaned = []
        for line in section_lines:
            if any(h.lower() == line.lower().strip() for h in headers_to_ignore):
                continue
            if 'Position &' in line or 'Institute /' in line:
                continue
            cleaned.append(line)
            
        merged = []
        current_sentence = []
        for line in cleaned:
            current_sentence.append(line)
            combined_len = sum(len(x) for x in current_sentence)
            if line.endswith('.') or re.search(r'\b(19|20)\d{2}\b', line) or combined_len > 80:
                merged.append(", ".join(current_sentence))
                current_sentence = []
                
        if current_sentence:
            merged.append(", ".join(current_sentence))
            
        return merged

    # Post-process education strictly (Max 3 degrees: PhD, Master, Bachelor)
    def parse_education_strictly(section_lines):
        records = []
        current_record = []
        headers_to_ignore = ['Qualification', 'Institute / University', 'Year', 'Result', 'Board / University', 'Institute', 'University', 'Board']
        
        for line in section_lines:
            # ignore headers
            if any(h.lower() == line.lower().strip() for h in headers_to_ignore):
                continue
                
            current_record.append(line.strip())
            # if we see a year (19xx or 20xx), it usually terminates a record
            if re.search(r'\b(19|20)\d{2}\b', line):
                records.append(", ".join(current_record))
                current_record = []
                
        if current_record:
            records.append(", ".join(current_record))
            
        filtered_records = []
        for rec in records:
            rec_lower = rec.lower()
            is_phd = re.search(r'\b(phd|ph\.d|doctorate)\b', rec_lower)
            is_master = re.search(r'\b(master|m\.e|m\.tech|msc|m\.sc|mba|m\.a|m\.e\.)\b', rec_lower)
            is_bachelor = re.search(r'\b(bachelor|b\.e|b\.tech|bsc|b\.sc|bba|b\.a|b\.e\.)\b', rec_lower)
            
            if is_phd or is_master or is_bachelor:
                # Clean up grades/percentages to just show degree, field, time, location
                clean_rec = re.sub(r'\b\d{1,2}\.\d{1,2}\s?%\b', '', rec) # 64.74%
                clean_rec = re.sub(r'\b\d{2}\s?%\b', '', clean_rec) # 80%
                clean_rec = re.sub(r'\(First Class\)', '', clean_rec, flags=re.IGNORECASE)
                clean_rec = re.sub(r'\bDistinction\b', '', clean_rec, flags=re.IGNORECASE)
                clean_rec = re.sub(r'\(\d\.\d{1,2}\)', '', clean_rec) # (7.62)
                clean_rec = re.sub(r'\bCGPA\b', '', clean_rec, flags=re.IGNORECASE)
                
                # Cleanup spacing and commas
                clean_rec = re.sub(r'\s+', ' ', clean_rec).strip()
                clean_rec = re.sub(r',\s*,', ',', clean_rec)
                clean_rec = clean_rec.strip(' ,')
                
                prefix = "PhD" if is_phd else ("Master" if is_master else "Bachelor")
                filtered_records.append(f"{prefix} — {clean_rec}")
                
        # Return max 3 degrees
        return filtered_records[:3]

    sections["education"] = parse_education_strictly(sections["education"])
    
    # Filter experience to only lines that contain a timeline/date
    exp_merged = clean_and_merge_section(sections["experience"])
    sections["experience"] = [
        line for line in exp_merged 
        if re.search(r'\b(19|20)\d{2}\b', line) or re.search(r'\b(Present|Current)\b', line, re.IGNORECASE)
    ]
            
    return sections

def parse_resume_text(text: str, db: Session):
    """
    Master function to process the resume text and return structured data.
    """
    contact_info = extract_email_phone(text)
    entities = extract_entities(text)
    skills = extract_skills(text, db)
    sections = extract_sections(text)
    
    return {
        "contact": contact_info,
        "entities": {
            "name_guesses": entities["names"][:3], # Top 3 guesses for Person name
            "companies": entities["organizations"][:10], # Top 10 orgs
            "locations": entities["locations"][:5]
        },
        "matched_skills": skills, # Return all matched skills
        "sections": sections
    }
