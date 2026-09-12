from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import or_, func

from ..database.database import get_db
from ..models.models import User, Candidate, Experience, SearchHistory, UploadedResume
from ..schemas.search import SearchQuery, SearchResponse, CandidateMatch, ScoreBreakdown
from ..utils.auth import get_current_user
from ..utils.scoring import score_candidate

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("/roles/all")
def get_all_unique_roles(db: Session = Depends(get_db)):
    roles = db.query(Experience.title).filter(Experience.title.isnot(None)).distinct().all()
    unique_roles = sorted(list(set([r[0].strip() for r in roles if r[0] and r[0].strip()])))
    return {"roles": unique_roles}

@router.get("/stats/roles")
def get_role_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can access stats")
        
    from collections import Counter
    
    total_candidates = db.query(Candidate.id).count()
    if total_candidates == 0:
        return {"roles": []}
        
    # Fetch experiences to find the latest job title per candidate
    experiences = db.query(Experience.candidate_id, Experience.title, Experience.end_date).all()
    
    latest_exp = {}
    for exp in experiences:
        c_id = exp.candidate_id
        title = exp.title
        end_dt = exp.end_date or ""
        
        if not title or title.strip() == "":
            continue
            
        if c_id not in latest_exp:
            latest_exp[c_id] = (title, end_dt)
        else:
            current_latest_dt = latest_exp[c_id][1]
            # Simple string comparison works for ISO dates and "Present"
            if end_dt > current_latest_dt:
                latest_exp[c_id] = (title, end_dt)
                
    title_counts = Counter([val[0] for val in latest_exp.values()])
    top_roles = title_counts.most_common(3)
    
    results = []
    for role, count in top_roles:
        percentage = round((count / total_candidates) * 100, 1)
        results.append({
            "name": role,
            "percentage": percentage,
            "count": count
        })
        
    return {"roles": results}

@router.get("/stats/candidates")
def get_candidates_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can access stats")
        
    total_saved = db.query(Candidate.id).count()
    total_searches = db.query(SearchHistory.id).count()
    
    from datetime import datetime, timedelta
    
    today = datetime.now().date()
    start_date = today - timedelta(days=6)
    
    local_offset = datetime.now() - datetime.utcnow()
    start_datetime_local = datetime(start_date.year, start_date.month, start_date.day)
    start_datetime_utc = start_datetime_local - local_offset
    
    recent_searches = db.query(SearchHistory.timestamp).filter(
        SearchHistory.timestamp >= start_datetime_utc
    ).all()
    
    recent_saves = db.query(UploadedResume.upload_date).filter(
        UploadedResume.upload_date >= start_datetime_utc
    ).all()
    
    search_counts_by_date = {}
    for (ts,) in recent_searches:
        if ts:
            local_ts = ts + local_offset
            d_str = local_ts.date().strftime('%b %d')
            search_counts_by_date[d_str] = search_counts_by_date.get(d_str, 0) + 1
            
    save_counts_by_date = {}
    for (ts,) in recent_saves:
        if ts:
            local_ts = ts + local_offset
            d_str = local_ts.date().strftime('%b %d')
            save_counts_by_date[d_str] = save_counts_by_date.get(d_str, 0) + 1
            
    trend_data = []
    
    for i in range(6, -1, -1):
        date_obj = today - timedelta(days=i)
        date_str = date_obj.strftime('%b %d')
        
        trend_data.append({
            "name": date_str,
            "saved": save_counts_by_date.get(date_str, 0),
            "searched": search_counts_by_date.get(date_str, 0)
        })
        
    return {
        "saved": total_saved,
        "searches": total_searches,
        "trend": trend_data
    }

@router.get("/stats/trend")
def get_candidates_trend(period: str = "1M", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can access stats")
        
    from datetime import datetime, timedelta
    
    today = datetime.now().date()
    period = period.upper()
    
    if period == "1W":
        start_date = today - timedelta(days=6)
    elif period == "1M":
        start_date = today - timedelta(days=30)
    elif period == "2M":
        start_date = today - timedelta(days=60)
    elif period == "3M":
        start_date = today - timedelta(days=90)
    elif period == "6M":
        start_date = today - timedelta(days=180)
    else:
        start_date = today - timedelta(days=6)
        
    local_offset = datetime.now() - datetime.utcnow()
    start_datetime_local = datetime(start_date.year, start_date.month, start_date.day)
    start_datetime_utc = start_datetime_local - local_offset
        
    recent_searches = db.query(SearchHistory.timestamp).filter(
        SearchHistory.timestamp >= start_datetime_utc
    ).all()
    
    recent_saves = db.query(UploadedResume.upload_date).filter(
        UploadedResume.upload_date >= start_datetime_utc
    ).all()
    
    search_counts = {}
    for (ts,) in recent_searches:
        if ts:
            local_ts = ts + local_offset
            d_str = local_ts.date().strftime('%b %d')
            search_counts[d_str] = search_counts.get(d_str, 0) + 1
            
    save_counts = {}
    for (ts,) in recent_saves:
        if ts:
            local_ts = ts + local_offset
            d_str = local_ts.date().strftime('%b %d')
            save_counts[d_str] = save_counts.get(d_str, 0) + 1
            
    trend_data = []
    
    curr_date = start_date
    while curr_date <= today:
        d_str = curr_date.strftime('%b %d')
        trend_data.append({
            "name": d_str,
            "saved": save_counts.get(d_str, 0),
            "searched": search_counts.get(d_str, 0)
        })
        curr_date += timedelta(days=1)
        
    return {"trend": trend_data}

@router.post("/candidates", response_model=SearchResponse)
def search_candidates(search: SearchQuery, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    # 1. Authorization: Only admins can search
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can access candidate search")
        
    # Log the search
    search_query_str = search.search_name if search.search_name else search.target_job_role
    new_search = SearchHistory(admin_id=current_user.id, query=search_query_str)
    db.add(new_search)
    db.commit()
        
    # 2. Fast Database Pre-Filtering
    if search.search_name:
        name_like = f"%{search.search_name}%"
        matching_ids_tuples = (
            db.query(Candidate.id)
            .filter(Candidate.name.ilike(name_like))
            .all()
        )
    else:
        target_role = search.target_job_role
        if target_role and target_role.lower() != "any":
            target_like = f"%{target_role}%"
            # Fetch matching candidate IDs without Cartesian product join
            matching_ids_tuples = (
                db.query(Candidate.id)
                .outerjoin(Experience, Candidate.id == Experience.candidate_id)
                .filter(
                    or_(
                        Candidate.predicted_job_role.ilike(target_like),
                        Experience.title.ilike(target_like)
                    )
                )
                .distinct()
                .all()
            )
        else:
            matching_ids_tuples = db.query(Candidate.id).all()
    
    matching_ids = [t[0] for t in matching_ids_tuples]
    total_candidates = db.query(Candidate.id).count()
    
    if not matching_ids:
        return SearchResponse(
            total_candidates=total_candidates,
            total_filtered=0,
            results=[]
        )
    
    # Load candidate models and relations efficiently via selectinload
    candidates = (
        db.query(Candidate)
        .options(
            selectinload(Candidate.skills),
            selectinload(Candidate.experiences),
            selectinload(Candidate.educations),
            selectinload(Candidate.abilities)
        )
        .filter(Candidate.id.in_(matching_ids))
        .all()
    )
    
    # 3. Detailed Scoring
    scored_candidates = []
    
    for c in candidates:
        # Aggregate profile text (Skills + Abilities + Education) matching the ML dataset format
        skills_list = [s.name for s in c.skills if s.name]
        abilities_list = [a.description for a in c.abilities if a.description]
        edu_list = [f"{e.degree or ''} {e.specific_field or ''} ({e.institution or ''})".strip() for e in c.educations if (e.degree or e.specific_field or e.institution)]
        
        profile_parts = []
        if edu_list:
            profile_parts.append(f"🎓 EDUCATION DETAILS:\n" + "\n• ".join([""] + edu_list).strip())
        if abilities_list:
            profile_parts.append(f"💡 ABILITIES & HIGHLIGHTS:\n" + "\n• ".join([""] + abilities_list).strip())
        if skills_list:
            profile_parts.append(f"📌 SKILLS ({len(skills_list)}):\n" + ", ".join(skills_list))
            
        aggregated_profile_text = c.combined_profile_text or ("\n\n".join(profile_parts) if profile_parts else "No skills or abilities found in database.")

        breakdown = score_candidate(
            candidate=c,
            target_role=search.target_job_role,
            req_skills=search.required_skills,
            pref_skills=search.preferred_skills,
            min_exp=search.min_experience_years,
            req_degree=search.required_degree,
            profile_text=aggregated_profile_text
        )

        match = CandidateMatch(
            candidate_id=c.id,
            name=c.name or f"Candidate #{c.id}",
            role=c.role,
            email=c.email,
            phone=c.phone,
            education_level=c.educations[0].degree if c.educations else None,
            predicted_job_role=c.predicted_job_role,
            calculated_experience_years=breakdown.pop("calculated_experience_years"),
            profile_text=aggregated_profile_text,
            score_breakdown=ScoreBreakdown(**breakdown)
        )
        scored_candidates.append(match)
        
    # 4. Sort by highest total_score and return Top 5 (with deterministic tie-breaker)
    scored_candidates.sort(key=lambda x: (-x.score_breakdown.total_score, x.candidate_id))
    top_5 = scored_candidates[:5]
    
    return SearchResponse(
        total_candidates=total_candidates,
        total_filtered=len(candidates),
        results=top_5
    )

from ..schemas.search import ExploreQuery

@router.get("/explore/locations")
def get_locations(q: str = "", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can access")
        
    query = f"%{q}%"
    
    # Simple strategy: search across city, state, country and union them up
    cities = db.query(Candidate.city).filter(Candidate.city.ilike(query)).distinct().limit(5).all()
    states = db.query(Candidate.state).filter(Candidate.state.ilike(query)).distinct().limit(5).all()
    countries = db.query(Candidate.country).filter(Candidate.country.ilike(query)).distinct().limit(5).all()
    
    results = []
    for (city,) in cities:
        if city and city not in results:
            results.append(city)
    for (state,) in states:
        if state and state not in results:
            results.append(state)
    for (country,) in countries:
        if country and country not in results:
            results.append(country)
            
    # Return top 7 unique matches
    return {"suggestions": results[:7]}

from ..models.models import Candidate, Skill
from sqlalchemy import or_, and_, func

@router.post("/explore", response_model=SearchResponse)
def explore_candidates(query: ExploreQuery, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can access")
        
    # Start building filter query
    q = db.query(Candidate)
    
    if query.location:
        q = q.filter(
            or_(
                Candidate.city.ilike(f"%{query.location}%"),
                Candidate.state.ilike(f"%{query.location}%"),
                Candidate.country.ilike(f"%{query.location}%")
            )
        )
        
    # 2. Strict Experience Filtering
    if query.min_experience_years and query.min_experience_years > 0:
        q = q.filter(Candidate.total_experience_years >= query.min_experience_years)
        
    # 3. Strict Degree Filtering
    if query.required_degree and query.required_degree != "Any":
        req_level = 0
        if "phd" in query.required_degree.lower() or "doctor" in query.required_degree.lower():
            req_level = 3
        elif "master" in query.required_degree.lower():
            req_level = 2
        elif "bachelor" in query.required_degree.lower():
            req_level = 1
        q = q.filter(Candidate.highest_degree_level >= req_level)
        
    # 4. Strict Job Role Filtering
    if query.target_job_role and query.target_job_role != "Any":
        q = q.filter(or_(
            Candidate.role.ilike(f"%{query.target_job_role}%"),
            Candidate.predicted_job_role.ilike(f"%{query.target_job_role}%")
        ))
        
    # 5. Strict Skills Filtering
    if query.required_skills and len(query.required_skills) > 0:
        skills_lower = [s.strip().lower() for s in query.required_skills if s.strip()]
        if len(skills_lower) > 0:
            if len(skills_lower) <= 2:
                # MUST have ALL skills
                for sk in skills_lower:
                    q = q.filter(Candidate.skills.any(func.lower(Skill.name) == sk))
            else:
                # MUST have AT LEAST ONE skill
                q = q.filter(Candidate.skills.any(func.lower(Skill.name).in_(skills_lower)))

    # Get total count before pagination
    total_filtered = q.count()
    
    # Fetch paginated candidates for scoring
    q = q.order_by(Candidate.id.desc())
    candidates = (
        q.options(
            selectinload(Candidate.skills),
            selectinload(Candidate.experiences),
            selectinload(Candidate.educations),
            selectinload(Candidate.abilities)
        )
        .offset(query.offset)
        .limit(query.limit)
        .all()
    )
    
    scored_candidates = []
    
    for c in candidates:
        breakdown = score_candidate(
            candidate=c,
            target_role=query.target_job_role,
            req_skills=query.required_skills,
            pref_skills=[],
            min_exp=query.min_experience_years,
            req_degree=query.required_degree
        )
        
        skills_list = [s.name for s in c.skills if s.name]
        abilities_list = [a.description for a in c.abilities if a.description]
        edu_list = [f"{e.degree or ''} {e.specific_field or ''} ({e.institution or ''})".strip() for e in c.educations if (e.degree or e.specific_field or e.institution)]
        
        profile_parts = []
        if edu_list:
            profile_parts.append(f"🎓 EDUCATION DETAILS:\n" + "\n• ".join([""] + edu_list).strip())
        if abilities_list:
            profile_parts.append(f"💡 ABILITIES & HIGHLIGHTS:\n" + "\n• ".join([""] + abilities_list).strip())
        if skills_list:
            profile_parts.append(f"📌 SKILLS ({len(skills_list)}):\n" + ", ".join(skills_list))
            
        loc_str = ", ".join(filter(None, [c.city, c.state, c.country]))
        if loc_str:
            profile_parts.insert(0, f"📍 LOCATION: {loc_str}")
            
        aggregated_profile_text = c.combined_profile_text or ("\n\n".join(profile_parts) if profile_parts else "No skills or abilities found in database.")

        match = CandidateMatch(
            candidate_id=c.id,
            name=c.name or f"Candidate #{c.id}",
            role=c.role,
            email=c.email,
            phone=c.phone,
            education_level=c.educations[0].degree if c.educations else None,
            predicted_job_role=c.predicted_job_role,
            calculated_experience_years=breakdown.pop("calculated_experience_years"),
            profile_text=aggregated_profile_text,
            score_breakdown=ScoreBreakdown(**breakdown)
        )
        scored_candidates.append(match)
        
    paginated_results = scored_candidates
    
    return SearchResponse(
        total_candidates=db.query(Candidate.id).count(),
        total_filtered=total_filtered,
        results=paginated_results
    )
