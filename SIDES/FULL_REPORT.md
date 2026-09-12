# AI Resume Intelligence - Full Feature Report

This document provides a comprehensive overview of the features available in the **AI Resume Intelligence** platform, categorized by user roles: Candidates and Administrators (Recruiters).

---

## 1. Candidate Side Features (User Portal)

The candidate side is designed to provide a seamless experience for users to upload their resumes and view the AI's understanding of their professional profile.

*   **Registration and Authentication:** Secure user registration and login using JWT (JSON Web Tokens) with Role-Based Access Control.
*   **Resume Upload & NLP Processing:** 
    *   Candidates can upload their resumes in PDF format.
    *   The system uses advanced NLP (SpaCy) to intelligently parse unstructured text.
    *   Automatically extracts Contact Information, Named Entities (Names, Companies, Locations), and matches skills against a predefined database.
*   **Automated Profile Generation:** 
    *   The platform automatically builds a structured profile from the parsed resume data, extracting specific details like Education, Past Experiences, and Skills.
*   **Job Role Prediction:** A custom ML component (TF-IDF/Heuristics) analyzes the extracted text to predict the candidate's most likely job role based on their resume content.
*   **Profile Management & Visualization:** Candidates can view their extracted data (skills, experience, education, predicted job role) in a clear, structured dashboard. They can also update their profile information.

### *Proposed Advanced Features (Candidate)*
*   **Personalized Skill-Gap Report:** A feature to select a target job role and receive an automated report highlighting missing requirements and providing a short learning/project plan based on the resume.

---

## 2. Administrator Side Features (Recruiter Dashboard)

The administrator side provides recruiters with powerful AI-driven tools to search, filter, rank, and evaluate candidate profiles efficiently.

*   **Secure Admin Dashboard:** An interactive, single-page dashboard built with React and TailwindCSS, featuring real-time search and interactive charts (via Recharts).
*   **Intelligent Candidate Search:** Admins can search for candidates based on specific criteria, including:
    *   Target Job Role
    *   Required Skills
    *   Preferred/Optional Skills
    *   Minimum Experience Years
*   **AI Candidate Ranking Algorithm:** The system evaluates all candidates against the search criteria and calculates a custom weighted score (out of 100) to return the top matches:
    *   **Skills (40%):** Matches on required and preferred skills.
    *   **Experience (25%):** Calculates true elapsed experience across intervals against the admin's minimum requirements.
    *   **Role Alignment (20%):** Matches the target role or "Any" role context.
    *   **Education (15%):** Base points awarded via a degree hierarchy (PhD=15, Master=10, Bachelor=5).
*   **Detailed Candidate Inspection:** Admins can view comprehensive candidate profiles, including the exact extracted text, matched skills, and experience history.
*   **Dynamic PDF Report Generation:** Admins can export a comprehensive breakdown report for any candidate as a PDF. This report is dynamically generated in-memory using ReportLab and includes the candidate's score breakdown against the specific search criteria.

### *Proposed Advanced Features (Admin)*
*   **Evidence-Backed Match Explanations:** An expandable "Why this match?" panel showing the exact resume text snippet that serves as evidence for a matched skill or requirement.
*   **Side-by-Side Candidate Comparison:** A dedicated view to select up to three candidates and compare their skill coverage, experience, and score components under identical search criteria in a single table.
*   **Semantic Job-Description Matching:** Ability to paste an entire job description and use semantic relevance to retrieve matching candidates beyond exact keyword hits.
