# AI Resume Intelligence — Advanced Features Proposal

**Internship submission:** 15 September 2026  
**Prepared:** 12 September 2026  
**Purpose:** Select useful, technically meaningful additions that can be explained and demonstrated to faculty.

## My recommendation for your submission

Build **evidence-backed match explanations** and a **personalized skill-gap report** first. Both can share the same matching logic and extend your existing FastAPI, React and scoring code. If those are finished and tested, add a small **candidate comparison view**.

Choose **semantic job-description matching** as the alternative main feature if your faculty particularly values NLP experimentation and you have time to validate a new model dependency. Do not attempt every feature before September 15.

Your strongest presentation will connect a real problem, a working solution and measurable evidence: “The system shows why a candidate matches, identifies missing requirements, and lets a recruiter verify the source information.” Faculty reactions cannot be guaranteed, but this gives you concrete technical work to defend in the viva.

These are **proposals**, not implemented features. Effort estimates are rough focused-development estimates for a small demo by someone familiar with this codebase. They exclude existing bug fixes, major data cleanup and deployment troubleshooting; allow additional integration/testing time.

## First: make the existing demonstration reliable

Your project already contains authentication, resume text extraction, role prediction, weighted ranking, dashboards and PDF export. Present these as existing capabilities rather than new features.

Before extending them, verify:

- The frontend loads and candidate/admin login works.
- Uploads save extracted skills, education and experience into database records. The upload code inspected for this proposal still saves raw text and selected basic fields without those relations.
- Ranking evaluates the intended matching population and uses consistent experience and degree values.
- A newly uploaded candidate can be found, inspected and exported after a page refresh.

Advanced features that depend on missing structured data will otherwise produce attractive but incorrect results. Recheck the earlier audit findings against the current code before deciding which repairs remain.

## Feature shortlist

| Feature | What faculty can see | Small demo estimate | Deadline decision |
|---|---|---:|---|
| 1. Evidence-backed explanations | Every score has reasons and resume evidence | 5–8 hours | Recommended first |
| 2. Personalized skill-gap report | Missing requirements become an action plan | 3–5 hours after feature 1 | Recommended second |
| 3. Candidate comparison | Compare three candidates under identical criteria | 3–5 hours | Add if time remains |
| 4. Semantic job-description matching | Retrieve related experience beyond exact keywords | 8–16 hours | Alternative main feature/stretch |
| 5. Model evaluation dashboard | Show measured strengths and failure cases | 5–10 hours if evaluation data is ready | Strong academic addition |
| 6. Top-three role suggestions | Show plausible alternatives and uncertainty | 3–5 hours for margins; 8–16 with calibration | Optional |
| 7. Scanned-resume OCR | Extract text from an image-only resume | 6–10 hours | Optional; setup risk |
| 8. Resume version comparison | Show what changed between two uploads | 5–8 hours | Future work unless storage is ready |
| 9. Resume-grounded interview questions | Questions refer to actual projects and gaps | 3–5 hours using templates | Quick alternative |
| 10. Human review and decision history | Recruiter records decisions with reasons | 6–10 hours | Future work |

## 1. Evidence-backed match explanations

**Problem:** A score alone does not explain whether the ranking is trustworthy.

**Add:** An expandable “Why this match?” panel showing the score contribution for each criterion, matched/missing skills and the exact supporting resume text. Use “Not found in this resume” rather than asserting that the person lacks a skill.

**Example display — illustrative, not a measured result:**

| Requirement | Finding | Evidence |
|---|---|---|
| Python | Mention found | “Built a Python service for document processing.” |
| SQL | Mention found | “Designed PostgreSQL queries and indexes.” |
| Docker | Not found | No matching evidence located |
| Two years of experience | Needs verification | Employment dates require confirmation |

**Implementation:** Extend `backend/app/utils/scoring.py` with structured explanation objects. Enhance `backend/app/utils/nlp.py` to retain matched text spans. Display them in `frontend/src/pages/CandidateModal.jsx` and/or `AdminDashboard.jsx`. Start with text snippets; PDF page highlights require storing page and coordinate metadata during extraction.

**What makes it advanced:** Traceability from extracted evidence to scoring decisions. The existing project already has a score breakdown; evidence links and verification are the new work. Call this explainable rule-based ranking, not a causal explanation of the SVM classifier.

**Completion check:** Every displayed snippet occurs in the uploaded resume; totals equal the shown contributions; absent evidence remains visibly absent.

**Faculty demo:** Expand a matched skill, show its source sentence, then show a requirement that was not found.

## 2. Personalized skill-gap and resume-improvement report

**Problem:** Candidates receive a prediction but little guidance on improving their application for a specific role.

**Add:** A candidate selects a target job and receives matched requirements, missing resume evidence and a short learning/project plan.

**Example:** “Docker was not found in this resume. If you have used it, add a truthful project example. Otherwise, a useful practice task is to containerize your resume-analysis API.”

**Implementation:** Reuse feature 1's requirement analysis. Keep an editable local mapping from skills to practice tasks and learning topics. Separate actual skill gaps from information that may simply be omitted from the resume. Offer a report download using the existing PDF infrastructure after the on-screen report works.

**Dependencies:** Correct skill normalization, persistent profiles and a target-role requirement definition. A paid AI API is unnecessary for the first version.

**Completion check:** Different target requirements produce different reports; already-matched skills are not marked missing; advice never invents experience or accomplishments.

**Faculty demo:** Change the target from backend developer to data analyst and explain why the recommendations change.

## 3. Side-by-side candidate comparison

**Problem:** Recruiters must repeatedly open profiles to understand trade-offs.

**Add:** Select up to three candidates and compare skill coverage, verified experience, education evidence and score components in one table. A small bar chart can supplement the table using existing Recharts components.

**Implementation:** Add a comparison selection state and a `CandidateComparison.jsx` component. Reuse the same search-result snapshot and criteria for every candidate. The existing backend may already return enough information for a minimal version.

**Completion check:** Every compared score uses identical requirements; changing current form fields does not silently change the criteria attached to old results.

**Faculty demo:** Explain why a candidate with more experience may still have weaker required-skill coverage. Keep the final selection under recruiter control.

## 4. Semantic matching against a pasted job description

**Problem:** Exact keyword matching may miss related descriptions of the same work.

**Add:** An admin pastes a job description. The system retrieves relevant resume passages and combines semantic relevance with transparent requirement checks.

**Implementation:** First version: TF-IDF cosine similarity as a measurable baseline. Advanced version: use a local Sentence Transformers embedding model, encode resume sections and the job description, then compare embeddings. Cache resume embeddings rather than recomputing them on every search. Sentence Transformers documents this query/document retrieval pattern. [Official semantic-search guide](https://www.sbert.net/examples/sentence_transformer/applications/semantic-search/README.html)

**Important design choice:** Keep explicit must-have requirements separate from semantic similarity. Related wording is not proof of a specific skill. Label similarity as a relevance score, not a hiring probability. Evaluate synonym examples rather than assuming all similar phrases will match correctly.

**Small demo scope:** A clearly labeled set of 20–50 synthetic resumes and 5–10 job descriptions. Show keyword and semantic results side by side. A vector database is unnecessary for this small demonstration.

**Completion check:** Record relevance judgments, top-result quality and query latency on the same examples for both methods. Document where semantic retrieval performs worse too.

**Faculty demo:** Find a passage about “building REST services” for a query about API development, then inspect its evidence.

## 5. Model evaluation and experiment dashboard

**Problem:** One accuracy number cannot explain performance across job roles or demonstrate a sound experiment.

**Add:** An “Evaluation” view with test-set size, class distribution, macro F1, per-role precision/recall, confusion matrix, inference latency and selected misclassifications.

**Implementation:** Export a versioned evaluation JSON from the training pipeline and render it with React/Recharts. Compare a majority-class baseline with the current TF-IDF + LinearSVC pipeline. Add a semantic model comparison only if it has actually been evaluated for the same task.

**Experiment rules:** Keep duplicate resumes and the same person's records out of both train and test sets. Fit learned preprocessing only on training data. Record the split method, random seed, model version and evaluated dataset. Reproduce the accuracy claimed in `ml_architecture.md` before presenting it as current verified performance.

**Completion check:** Every chart is generated from actual saved evaluation output. Separate role-classification metrics from search-ranking metrics; they measure different tasks.

**Faculty demo:** Explain one misclassified role and what additional data or feature might help. This demonstrates understanding of the model's limitations.

## 6. Top-three job-role suggestions with uncertainty

**Problem:** A single label hides ambiguity between related roles.

**Add:** Return three likely role suggestions and an “uncertain” state for weak distinctions.

**Implementation:** Extend `backend/app/utils/ml.py` to rank class decision scores. Initially label these as relative model scores, without percentage signs. If you need estimated probabilities, calibrate with suitable held-out data or cross-validation and validate the result. SVM decision scores are not probabilities. [Official scikit-learn calibration guide](https://scikit-learn.org/stable/modules/calibration.html)

**Completion check:** Score-to-class mapping is correct; ambiguous examples display uncertainty; raw margins are never presented as “95% confident.”

**Faculty demo:** Show a resume combining software development and analytics, then discuss its alternative role suggestions.

## 7. OCR fallback for scanned resumes

**Problem:** Image-only PDFs have no ordinary text layer, so the existing extractor cannot process them.

**Add:** Detect pages without usable text and run OCR on those pages, with a visible “OCR used — please verify” label.

**Implementation:** Extend `backend/app/utils/pdf.py`. PyMuPDF supports OCR through Tesseract, which must be installed separately. Cache OCR results and show processing status because OCR is more expensive than ordinary extraction. [Official PyMuPDF OCR guide](https://pymupdf.readthedocs.io/en/latest/recipes-ocr.html)

**Completion check:** Test text-only, scanned and mixed PDFs; process mixed pages without duplicating text. Handle unreadable images and missing OCR installation gracefully.

**Faculty demo:** Upload a scanned synthetic resume and compare its extracted text with the original image.

## 8. Resume version history and improvement tracking

**Add:** Treat each upload as a separate version containing file metadata, parsed fields, parser/model version and timestamp. Compare newly added skills and changed experience entries between two versions.

**Implementation:** Extend the existing `UploadedResume` records with structured extraction snapshots; compare versions using stable normalized fields. Always compare match-score changes against the same job requirements and scoring version.

**Completion check:** The older version remains inspectable; re-upload does not overwrite its evidence; a changed target job is not misrepresented as resume improvement.

**Faculty demo:** Upload a revised resume with a genuine new project and show the specific differences.

## 9. Resume-grounded interview question generator (at user side)

**Add:** Generate questions based on actual resume projects, claimed skills and requirements needing clarification.

**Implementation:** Start with deterministic templates: “Your resume mentions [project]. How did you validate [claimed outcome]?” Attach the triggering evidence snippet to each question. This works offline and avoids a new service dependency. A later LLM version should use only supplied evidence and handle model failure.

**Completion check:** Every question references a real resume claim or is explicitly a general role question. The system does not fabricate projects or provide invented answers on the candidate's behalf.

**Faculty demo:** Open two different resumes and show how their questions differ.

## 10. Human review workflow and decision history

**Add:** Recruiters move candidates through “New,” “Under review,” “Shortlisted” and “Interview,” with notes and a timestamped decision history.

**Implementation:** Add review/status records linked to candidate and recruiter. Save the search criteria and score snapshot associated with each decision. Your existing export/search history can inform the design, but review decisions need their own records.

**Completion check:** Only authorized users can change status; changes survive refresh; notes are not exposed through candidate-facing endpoints unintentionally.

**Faculty demo:** Show an AI recommendation, explain the recruiter's different judgment, and record the reason. This makes the system a decision-support tool with accountability.

## Suggested plan before September 15

| Date | Main work | Exit condition |
|---|---|---|
| September 12 | Repair blockers and verify the upload-to-search flow; define the new feature's data contract | One uploaded resume remains correctly searchable after refresh |
| September 13 | Implement evidence explanations and the shared skill-gap logic | Evidence and missing-requirement results are correct on several examples |
| September 14, first half | Finish UI/report; add comparison only if the first two features are stable | A complete, understandable demonstration |
| September 14, second half | Freeze features; test, prepare screenshots, rehearse and back up the project | Repeatable demo with documented limitations |
| September 15 | Submit and demonstrate | No untested dependency or model changes immediately before presentation |

If you have **fewer than 8 hours** available after fixes, choose only feature 1. If you have **8–16 hours**, aim for features 1 and 2. Treat feature 3 as optional. If the faculty specifically expects a new NLP experiment, substitute feature 4 for the feature bundle rather than adding it on top.

## A six-minute faculty demonstration

1. **0:00–0:40 — Problem:** Explain why manual screening needs searchable data and verifiable explanations.
2. **0:40–1:40 — Extraction:** Upload a synthetic resume and show the persisted profile.
3. **1:40–2:40 — Matching:** Enter target requirements and inspect the results.
4. **2:40–3:40 — Main contribution:** Open score explanations and their source evidence.
5. **3:40–4:40 — Candidate benefit:** Show the skill-gap report; optionally compare candidates.
6. **4:40–6:00 — Engineering:** Explain the architecture, actual test/evaluation results, one limitation and the future-work roadmap.

Prepare a few synthetic resumes, a scanned example only if OCR is implemented, screenshots and an offline backup. Label illustrative data and distinguish completed functionality from future work in your report and slides.

## Useful viva preparation

- **“Where is the AI?”** Explain spaCy extraction and the trained role classifier; if implemented, distinguish semantic embeddings from deterministic scoring rules.
- **“Why this candidate?”** Trace requirements to evidence and score contributions rather than referring only to the final number.
- **“How did you validate it?”** Show actual checks and a documented held-out evaluation; never invent a performance improvement.
- **“Is this an ATS score?”** Describe it as your project's compatibility/readability assessment, not a universal score used by all employers.
- **“What remains?”** Discuss extraction errors, domain coverage, uncertain predictions and the need for human review.

**Suggested description after the recommended features are implemented:** “AI Resume Intelligence combines resume extraction and role prediction with evidence-backed matching and personalized skill-gap feedback.”

This proposal adds no application functionality; it is a prioritized implementation and demonstration plan.
