from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session, selectinload
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Frame, PageTemplate, BaseDocTemplate, FrameBreak, NextPageTemplate, PageBreak
)
from reportlab.graphics.shapes import Drawing, Rect, Circle, String as RLString
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import io
import html
import os

from ..database.database import get_db, engine
from ..models.models import User, Candidate, ExportHistory, Base
from ..schemas.search import SearchQuery

# Ensure tables exist (specifically ExportHistory which was added dynamically)
Base.metadata.create_all(bind=engine)
from ..utils.auth import get_current_user
from ..utils.scoring import score_candidate
from ..utils.learning import get_learning_advice
from ..schemas.candidate import GapReportRequest

router = APIRouter(prefix="/api/export", tags=["export"])

# ── Color palette matching the template ──────────────────────────
ACCENT      = colors.HexColor("#E05C6A")  # Salmon/red accent
DARK_BG     = colors.HexColor("#2D2D2D")  # Dark sidebar
LIGHT_BG    = colors.HexColor("#FDF0F0")  # Light pink sidebar
WHITE       = colors.white
BLACK       = colors.HexColor("#222222")
GREY        = colors.HexColor("#555555")
LIGHT_GREY  = colors.HexColor("#888888")
SECTION_BG  = colors.HexColor("#FAE8E8")


def safe(val, default="N/A"):
    """Safely escape and stringify a value for PDF rendering."""
    if not val:
        return default
    return html.escape(str(val))


def clean_role_title(text):
    """Deduplicate repeated phrases/words like 'Data Analyst Data Analyst Data Analyst'."""
    if not text:
        return "Professional"
    words = text.split()
    if not words:
        return "Professional"
    for phrase_len in range(1, len(words) // 2 + 1):
        phrase = words[:phrase_len]
        repeats = len(words) // phrase_len
        if phrase * repeats == words[:phrase_len * repeats] and len(words) == phrase_len * repeats:
            return " ".join(phrase).title()
    deduped = []
    for w in words:
        if not deduped or deduped[-1].lower() != w.lower():
            deduped.append(w)
    return " ".join(deduped).title()


def build_resume_pdf(candidate, breakdown, target_role=""):
    """
    Build a clean, beautifully organized 2-page PDF report:
    - Page 1: Two-column Candidate Resume (Left: Name, Contact, Education, Skills; Right: Work Experience)
    - Page 2: Full-width AI Candidate Match Intelligence & Verification Report (Score breakdown & Why This Match)
    """
    buffer = io.BytesIO()
    page_w, page_h = letter  # 612 x 792 points

    # ── Register Garamond fonts from Windows ──────────────────────
    FONTS_DIR = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")
    try:
        pdfmetrics.registerFont(TTFont("Garamond", os.path.join(FONTS_DIR, "GARA.TTF")))
        pdfmetrics.registerFont(TTFont("Garamond-Bold", os.path.join(FONTS_DIR, "GARABD.TTF")))
        pdfmetrics.registerFont(TTFont("Garamond-Italic", os.path.join(FONTS_DIR, "GARAIT.TTF")))
        FONT = "Garamond"
        FONT_BOLD = "Garamond-Bold"
    except Exception:
        FONT = "Helvetica"
        FONT_BOLD = "Helvetica-Bold"

    # ── Styles ────────────────────────────────────────────────────
    styles = getSampleStyleSheet()

    s_name = ParagraphStyle(
        "ResumeName", parent=styles["Normal"],
        fontName=FONT_BOLD, fontSize=20, leading=24,
        textColor=BLACK, alignment=TA_LEFT,
    )
    s_role_badge = ParagraphStyle(
        "RoleBadge", parent=styles["Normal"],
        fontName=FONT_BOLD, fontSize=10, leading=14,
        textColor=ACCENT, alignment=TA_LEFT,
    )
    s_section = ParagraphStyle(
        "SectionHead", parent=styles["Normal"],
        fontName=FONT_BOLD, fontSize=11, leading=15,
        textColor=BLACK, spaceBefore=10, spaceAfter=4,
    )
    s_section_accent = ParagraphStyle(
        "SectionHeadAccent", parent=styles["Normal"],
        fontName=FONT_BOLD, fontSize=12, leading=16,
        textColor=ACCENT, spaceBefore=6, spaceAfter=6,
    )
    s_normal = ParagraphStyle(
        "ResumeNormal", parent=styles["Normal"],
        fontName=FONT, fontSize=8.5, leading=12,
        textColor=colors.HexColor("#334155"),
    )
    s_normal_dark = ParagraphStyle(
        "ResumeNormalDark", parent=styles["Normal"],
        fontName=FONT_BOLD, fontSize=9, leading=13,
        textColor=colors.HexColor("#0F172A"),
    )
    s_bold = ParagraphStyle(
        "ResumeBold", parent=styles["Normal"],
        fontName=FONT_BOLD, fontSize=10, leading=14,
        textColor=colors.HexColor("#0F172A"),
    )
    s_company = ParagraphStyle(
        "ResumeCompany", parent=styles["Normal"],
        fontName=FONT_BOLD, fontSize=9.5, leading=13,
        textColor=ACCENT,
    )
    s_meta = ParagraphStyle(
        "ResumeMeta", parent=styles["Normal"],
        fontName=FONT, fontSize=8, leading=11,
        textColor=colors.HexColor("#475569"),
    )
    s_bullet = ParagraphStyle(
        "ResumeBullet", parent=styles["Normal"],
        fontName=FONT, fontSize=8.5, leading=12,
        textColor=colors.HexColor("#334155"), leftIndent=10, bulletIndent=0,
        spaceBefore=1, spaceAfter=1,
    )
    s_contact_label = ParagraphStyle(
        "ContactLabel", parent=styles["Normal"],
        fontName=FONT, fontSize=8.5, leading=13,
        textColor=colors.HexColor("#334155"),
    )
    s_edu_inst = ParagraphStyle(
        "EduInst", parent=styles["Normal"],
        fontName=FONT_BOLD, fontSize=8.5, leading=12,
        textColor=ACCENT,
    )
    s_skills_body = ParagraphStyle(
        "SkillsBody", parent=styles["Normal"],
        fontName=FONT, fontSize=8.5, leading=13,
        textColor=colors.HexColor("#334155"),
    )

    # Styles for Page 2 Match Intelligence Report
    s_report_title = ParagraphStyle(
        "ReportTitle", parent=styles["Normal"],
        fontName=FONT_BOLD, fontSize=15, leading=19,
        textColor=colors.HexColor("#0F172A"),
    )
    s_report_sub = ParagraphStyle(
        "ReportSub", parent=styles["Normal"],
        fontName=FONT, fontSize=9, leading=13,
        textColor=colors.HexColor("#475569"),
    )
    s_score_num = ParagraphStyle(
        "ScoreNum", parent=styles["Normal"],
        fontName=FONT_BOLD, fontSize=20, leading=24,
        textColor=ACCENT,
    )

    # ── Build LEFT column content (Page 1) ────────────────────────
    left_items = []

    # Name
    candidate_name = safe(candidate.name, "Unknown Candidate")
    name_parts = candidate_name.split()
    if len(name_parts) >= 2:
        first_name = " ".join(part.capitalize() for part in name_parts[:-1])
        last_name = name_parts[-1].capitalize()
        left_items.append(Paragraph(f"{first_name}<br/><b>{last_name}</b>", s_name))
    else:
        left_items.append(Paragraph(f"<b>{candidate_name.capitalize()}</b>", s_name))

    # Role badge
    raw_role = candidate.predicted_job_role or candidate.role
    role_text = safe(clean_role_title(raw_role), "Professional")
    left_items.append(Spacer(1, 4))
    left_items.append(Paragraph(f"<u>{role_text}</u>", s_role_badge))
    left_items.append(Spacer(1, 14))

    # ── CONTACT ──
    left_items.append(Paragraph("<b>CONTACT</b>", s_section))
    left_items.append(Spacer(1, 4))

    if candidate.email:
        left_items.append(Paragraph(safe(candidate.email), s_contact_label))
    if candidate.phone:
        left_items.append(Paragraph(safe(candidate.phone), s_contact_label))
    if candidate.linkedin:
        left_items.append(Paragraph(safe(candidate.linkedin), s_contact_label))
    if not candidate.email and not candidate.phone:
        left_items.append(Paragraph("No contact info recorded", s_contact_label))
    left_items.append(Spacer(1, 12))

    # ── EDUCATION ──
    left_items.append(Paragraph("<b>EDUCATION</b>", s_section))
    left_items.append(Spacer(1, 4))

    if candidate.educations:
        for edu in candidate.educations[:4]:
            deg_title = ""
            if edu.degree:
                deg_title += safe(edu.degree)
            if edu.specific_field:
                if deg_title:
                    deg_title += ", "
                deg_title += safe(edu.specific_field)
            if deg_title:
                left_items.append(Paragraph(deg_title, s_normal_dark))

            if edu.institution:
                left_items.append(Paragraph(safe(edu.institution), s_edu_inst))

            parts = [safe(edu.start_date, ""), safe(edu.location, "")]
            date_loc = "   |   ".join([p for p in parts if p and p != "N/A"])
            if date_loc:
                left_items.append(Paragraph(date_loc, s_meta))
            left_items.append(Spacer(1, 8))
    else:
        left_items.append(Paragraph("No education recorded", s_normal))

    left_items.append(Spacer(1, 10))

    # ── SKILLS ──
    left_items.append(Paragraph("<b>SKILLS</b>", s_section))
    left_items.append(Spacer(1, 4))

    if candidate.skills:
        skill_names = [safe(skill.name) for skill in candidate.skills if skill.name]
        
        # Calculate available width based on left frame width (2.3 inch - 16 points padding)
        avail_width = (2.3 * inch) - 16
        
        # s_bullet leading is 12. Limit to 20 lines: 20 * 12 = 240 points
        max_height = 20 * 12
        current_height = 0
        
        for s_name in skill_names:
            p = Paragraph(f"•  {s_name}", s_bullet)
            w, h = p.wrap(avail_width, 800)
            if current_height + h > max_height:
                break
            left_items.append(p)
            current_height += h
    else:
        left_items.append(Paragraph("No skills recorded", s_normal))

    # ── Build RIGHT column content (Page 1) ───────────────────────
    right_items = []

    # ── WORK EXPERIENCE ──
    right_items.append(Paragraph("<b>WORK EXPERIENCE</b>", s_section_accent))
    right_items.append(Spacer(1, 6))

    if candidate.experiences:
        sorted_exps = sorted(
            candidate.experiences,
            key=lambda e: e.end_date or "9999",
            reverse=True
        )

        for i, exp in enumerate(sorted_exps):
            right_items.append(Paragraph(f"<b>{safe(exp.title, 'Untitled Role')}</b>", s_bold))

            if exp.firm:
                right_items.append(Paragraph(safe(exp.firm), s_company))

            meta_parts = []
            if exp.start_date or exp.end_date:
                date_str = f"{safe(exp.start_date, '?')} - {safe(exp.end_date, 'Present')}"
                meta_parts.append(date_str)
            if exp.location:
                meta_parts.append(safe(exp.location))
            if meta_parts:
                right_items.append(Paragraph("   |   ".join(meta_parts), s_meta))

            if i == 0 and candidate.abilities:
                right_items.append(Spacer(1, 3))
                for ab in candidate.abilities[:6]:
                    desc = safe(ab.description, "").strip()
                    if desc and desc != "N/A":
                        if len(desc) > 180:
                            desc = desc[:177] + "..."
                        right_items.append(
                            Paragraph(f"•  {desc}", s_bullet)
                        )

            right_items.append(Spacer(1, 10))
    else:
        right_items.append(Paragraph("No experience recorded.", s_normal))

    # ── Build Page 2 content (AI Match Intelligence Report) ────────
    match_items = []
    if breakdown and breakdown.get("total_score") is not None:
        match_items.append(Paragraph("<b>AI CANDIDATE MATCH INTELLIGENCE REPORT</b>", s_report_title))
        role_display = target_role or candidate.predicted_job_role or "General Evaluation"
        match_items.append(Paragraph(
            f"<b>Target Role:</b> {safe(role_display)}   &nbsp;|&nbsp;   "
            f"<b>Candidate:</b> {safe(candidate.name)}   &nbsp;|&nbsp;   "
            f"<b>Evaluation Status:</b> Completed",
            s_report_sub
        ))
        match_items.append(Spacer(1, 10))

        analysis = breakdown.get("analysis", {})
        rec = analysis.get("recommendation", "Consider")
        strengths = analysis.get("strengths", "Meets target qualifications.")
        weak = analysis.get("weak_areas", "None noted.")

        score_block = [
            Paragraph("<font size='8' color='#64748B'><b>OVERALL MATCH SCORE</b></font>", s_normal),
            Paragraph(f"<b>{breakdown['total_score']} / 100</b>", s_score_num),
            Paragraph(f"<b>Recommendation:</b> {safe(rec)}", s_normal_dark),
        ]
        finding_block = [
            Paragraph(f"<b>Strengths:</b> {safe(strengths)}", s_normal),
            Spacer(1, 4),
            Paragraph(f"<b>Areas for Review:</b> {safe(weak)}", s_normal),
        ]

        summary_table = Table([[score_block, finding_block]], colWidths=[2.2 * inch, 5.2 * inch])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#E2E8F0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ]))
        match_items.append(summary_table)
        match_items.append(Spacer(1, 12))

        cat_data = [
            ["Evaluation Category", "Weight", "Score Awarded", "Evaluation Finding"],
            ["Skills Match", "40%", f"{breakdown['skills_score']} / 40", "Core required & preferred technical skills evaluated"],
            ["Experience Match", "25%", f"{breakdown['experience_score']} / 25", "Total elapsed relevant career duration and depth"],
            ["Role Alignment", "20%", f"{breakdown['role_score']} / 20", "Historical job titles and AI role classification alignment"],
            ["Education & Abilities", "15%", f"{breakdown['education_abilities_score']} / 15", "Degree level qualification and verified capabilities"],
        ]
        cat_table = Table(cat_data, colWidths=[2.0 * inch, 1.0 * inch, 1.4 * inch, 3.0 * inch])
        cat_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#334155")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#FFFFFF")),
            ("BACKGROUND", (0, 2), (-1, 2), colors.HexColor("#F9FAFB")),
            ("BACKGROUND", (0, 3), (-1, 3), colors.HexColor("#FFFFFF")),
            ("BACKGROUND", (0, 4), (-1, 4), colors.HexColor("#F9FAFB")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        match_items.append(cat_table)
        match_items.append(Spacer(1, 14))

        explanations = breakdown.get("explanations", [])
        if explanations:
            match_items.append(Paragraph("<b>WHY THIS MATCH? (EVIDENCE & VERIFICATION)</b>", s_section_accent))
            match_items.append(Paragraph("Transparent mapping between job requirements and verified resume evidence.", s_meta))
            match_items.append(Spacer(1, 6))

            exp_data = [["Requirement / Criterion", "Evaluation Finding", "Resume Evidence & Context"]]
            for exp in explanations:
                req_p = Paragraph(safe(exp["requirement"]), s_bold)
                finding_str = safe(exp["finding"])
                finding_lower = finding_str.lower()
                if "not found" in finding_lower:
                    f_color = "#B91C1C"
                elif "verification" in finding_lower or "below" in finding_lower:
                    f_color = "#B45309"
                elif "past" in finding_lower or "predicted" in finding_lower:
                    f_color = "#0369A1"
                else:
                    f_color = "#15803D"

                finding_p = Paragraph(f"<font color='{f_color}'><b>{finding_str}</b></font>", s_normal)
                evidence_p = Paragraph(f"<i>{safe(exp['evidence'])}</i>", s_normal)
                exp_data.append([req_p, finding_p, evidence_p])

            exp_table = Table(exp_data, colWidths=[1.8 * inch, 1.6 * inch, 4.0 * inch])
            exp_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#334155")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]))
            for r_idx in range(1, len(exp_data)):
                bg = colors.HexColor("#FFFFFF") if r_idx % 2 == 1 else colors.HexColor("#F9FAFB")
                exp_table.setStyle(TableStyle([("BACKGROUND", (0, r_idx), (-1, r_idx), bg)]))

            match_items.append(exp_table)

    # ── Compose Document Layout ───────────────────────────────────
    LEFT_W = 2.3 * inch
    RIGHT_W = 4.5 * inch
    MARGIN = 36  # 0.5 inch
    FULL_W = page_w - 2 * MARGIN  # 7.5 inches

    frame_left = Frame(MARGIN, MARGIN, LEFT_W - 16, page_h - 2 * MARGIN, id='left', showBoundary=0)
    frame_right = Frame(MARGIN + LEFT_W + 16, MARGIN, RIGHT_W - 16, page_h - 2 * MARGIN, id='right', showBoundary=0)
    frame_full = Frame(MARGIN, MARGIN, FULL_W, page_h - 2 * MARGIN, id='full', showBoundary=0)

    def draw_resume_bg(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(LIGHT_BG)
        canvas.rect(0, 0, MARGIN + LEFT_W, page_h, fill=1, stroke=0)
        canvas.setStrokeColor(colors.HexColor("#F0D0D0"))
        canvas.setLineWidth(1)
        canvas.line(MARGIN + LEFT_W, 0, MARGIN + LEFT_W, page_h)
        canvas.restoreState()

    def draw_report_bg(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(ACCENT)
        canvas.rect(0, page_h - 4, page_w, 4, fill=1, stroke=0)
        canvas.setFont(FONT, 8)
        canvas.setFillColor(colors.HexColor("#94A3B8"))
        canvas.drawString(MARGIN, 18, "AI Resume Intelligence  •  Automated Match Verification Report")
        canvas.drawRightString(page_w - MARGIN, 18, "Page 2  •  Confidential")
        canvas.restoreState()

    template_two_col = PageTemplate(id='TwoCol', frames=[frame_left, frame_right], onPage=draw_resume_bg)
    template_right_only = PageTemplate(id='RightOnly', frames=[frame_right], onPage=draw_resume_bg)
    template_full = PageTemplate(id='ReportFull', frames=[frame_full], onPage=draw_report_bg)

    doc = BaseDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=MARGIN,
        leftMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
    )
    doc.addPageTemplates([template_two_col, template_right_only, template_full])

    flowables = []

    # Page 1 Left
    flowables.extend(left_items)
    # Break to Page 1 Right
    flowables.append(FrameBreak())
    # Page 1 Right
    flowables.extend(right_items)

    # Page 2 Full-Width Match Intelligence Report
    if match_items:
        flowables.append(NextPageTemplate('ReportFull'))
        flowables.append(PageBreak())
        flowables.extend(match_items)

    doc.build(flowables)
    buffer.seek(0)
    return buffer


@router.post("/candidate/{candidate_id}/pdf")
def export_candidate_pdf(
    candidate_id: int,
    search: SearchQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can export candidate reports",
        )

    candidate = (
        db.query(Candidate)
        .options(
            selectinload(Candidate.skills),
            selectinload(Candidate.experiences),
            selectinload(Candidate.educations),
            selectinload(Candidate.abilities),
        )
        .filter(Candidate.id == candidate_id)
        .first()
    )

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    skills_list = [s.name for s in candidate.skills if s.name]
    abilities_list = [a.description for a in candidate.abilities if a.description]
    edu_list = [f"{e.degree or ''} {e.specific_field or ''} ({e.institution or ''})".strip() for e in candidate.educations if (e.degree or e.specific_field or e.institution)]
    
    profile_parts = []
    if edu_list:
        profile_parts.append("EDUCATION DETAILS:\n" + "\n• ".join([""] + edu_list).strip())
    if abilities_list:
        profile_parts.append("ABILITIES & HIGHLIGHTS:\n" + "\n• ".join([""] + abilities_list).strip())
    if skills_list:
        profile_parts.append(f"SKILLS ({len(skills_list)}):\n" + ", ".join(skills_list))
        
    aggregated_profile_text = candidate.combined_profile_text or ("\n\n".join(profile_parts) if profile_parts else "No skills or abilities found in database.")

    breakdown = score_candidate(
        candidate=candidate,
        target_role=search.target_job_role,
        req_skills=search.required_skills,
        pref_skills=search.preferred_skills,
        min_exp=search.min_experience_years,
        req_degree=search.required_degree,
        profile_text=aggregated_profile_text
    )

    pdf_buffer = build_resume_pdf(candidate, breakdown, target_role=search.target_job_role or "")

    # Record the export in the audit history (robustly)
    try:
        export_record = ExportHistory(
            admin_id=current_user.id,
            candidate_id=candidate.id,
            candidate_name=candidate.name or f"Candidate {candidate.id}",
            job_role=search.target_job_role or "Any",
            action="Exported as PDF"
        )
        db.add(export_record)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error saving export history: {e}")

    filename = f"candidate_{candidate.id}_resume.pdf"

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@router.get("/history")
def get_export_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view export history")
        
    history = db.query(ExportHistory).order_by(ExportHistory.timestamp.desc()).limit(100).all()
    
    results = []
    for h in history:
        results.append({
            "id": h.id,
            "candidateName": h.candidate_name,
            "role": h.job_role,
            "action": h.action,
            "date": h.timestamp.strftime("%b %d, %Y at %I:%M %p")
        })
        
    return results

def build_gap_report_pdf(candidate, gap_data: dict):
    buffer = io.BytesIO()
    page_w, page_h = letter

    FONTS_DIR = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")
    try:
        pdfmetrics.registerFont(TTFont("Garamond", os.path.join(FONTS_DIR, "GARA.TTF")))
        pdfmetrics.registerFont(TTFont("Garamond-Bold", os.path.join(FONTS_DIR, "GARABD.TTF")))
        FONT = "Garamond"
        FONT_BOLD = "Garamond-Bold"
    except Exception:
        FONT = "Helvetica"
        FONT_BOLD = "Helvetica-Bold"

    styles = getSampleStyleSheet()
    s_title = ParagraphStyle(
        "Title", fontName=FONT_BOLD, fontSize=24, leading=28, textColor=BLACK, spaceAfter=20, alignment=TA_CENTER
    )
    s_h2 = ParagraphStyle(
        "H2", fontName=FONT_BOLD, fontSize=16, leading=20, textColor=ACCENT, spaceBefore=15, spaceAfter=10
    )
    s_norm = ParagraphStyle(
        "NormalText", fontName=FONT, fontSize=12, leading=16, textColor=BLACK, spaceAfter=8
    )
    s_alert = ParagraphStyle(
        "Alert", fontName=FONT, fontSize=12, leading=16, textColor=colors.HexColor("#A83232"), backColor=colors.HexColor("#FEE2E2"), borderPadding=8
    )

    doc = SimpleDocTemplate(
        buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    
    story = []
    
    story.append(Paragraph(f"Skill Gap & Improvement Report", s_title))
    story.append(Paragraph(f"Candidate: {candidate.name or candidate.user.email} | Target Role: {gap_data['target_role']}", s_norm))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("Matched Requirements", s_h2))
    if gap_data["matched_skills"]:
        for s in gap_data["matched_skills"]:
            story.append(Paragraph(f"✓ <b>{s}</b>", s_norm))
    else:
        story.append(Paragraph("No exact skill matches found based on the provided requirements.", s_norm))
        
    story.append(Spacer(1, 15))
    story.append(Paragraph("Missing Skills & Learning Plan", s_h2))
    if gap_data["missing_skills"]:
        for m in gap_data["missing_skills"]:
            skill_name = m["skill"]
            advice = m["advice"]
            story.append(Paragraph(f"<b>{skill_name}</b>", s_norm))
            story.append(Paragraph(advice, s_alert))
            story.append(Spacer(1, 10))
    else:
        story.append(Paragraph("Great! You meet all specified skill requirements.", s_norm))
        
    doc.build(story)
    return buffer

@router.post("/candidate-gap-report")
def export_gap_report(
    req: GapReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can access this")
        
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).options(
        selectinload(Candidate.skills),
        selectinload(Candidate.resumes)
    ).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
        
    latest_resume = None
    if candidate.resumes:
        latest_resume = sorted(candidate.resumes, key=lambda r: str(r.upload_date) if getattr(r, 'upload_date', None) else "", reverse=True)[0]
    
    profile_text = getattr(latest_resume, "extracted_text", "") if latest_resume else ""
        
    score_result = score_candidate(
        candidate=candidate,
        target_role=req.target_role,
        req_skills=req.req_skills,
        pref_skills=req.pref_skills,
        min_exp=req.min_exp,
        req_degree=req.req_degree,
        profile_text=profile_text
    )
    
    missing_skills_info = []
    matched_skills = []
    for explanation in score_result.get("explanations", []):
        req_name = explanation.get("requirement", "")
        if explanation.get("finding") == "Not found":
            if req_name:
                missing_skills_info.append({"skill": req_name, "advice": get_learning_advice(req_name)})
        elif explanation.get("finding") == "Mention found":
            if req_name:
                matched_skills.append(req_name)
                
    gap_data = {
        "target_role": req.target_role,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills_info
    }
    
    pdf_buffer = build_gap_report_pdf(candidate, gap_data)
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="Skill_Gap_Report.pdf"'},
    )
