# AI Resume Intelligence — project bug and error report

Review date: 12 September 2026

The project has a frontend startup blocker and several defects affecting resume persistence, candidate ranking, filtering, and fresh installation. A successful frontend build does **not** mean the application can run correctly.

## Scope and method

Reviewed the React routes, pages, authentication context, API client and build configuration; FastAPI routes, schemas, models, authentication, NLP, scoring and ML inference; database/import/training utilities; notebook code and saved outputs; dataset headers; and README setup instructions.

Executed a production frontend build, the configured lint command, a focused ESLint `no-undef` check, Python syntax checks, dependency consistency checks, and synthetic API/function probes. Backend probes use an isolated in-memory SQLite database and temporary upload directory. Upload persistence probes mock PDF/NLP/ML output to isolate what the endpoint saves; they do not establish extraction accuracy on real resumes. No existing PostgreSQL records, resumes, credentials, or trained models were modified. The build regenerated `frontend/dist`.

Evidence files:

- `audit_checks.py`: repeatable synthetic backend audit; run from the project root with `backend/venv/Scripts/python.exe audit_checks.py`.
- `audit_check_results.json`: actual outputs of the audit run. These are diagnostic observations, not a passing regression suite.

Severity: **Critical** blocks the application; **High** materially breaks core behavior or creates a serious security risk; **Medium** affects particular inputs/workflows; **Low** affects documentation or development tooling.

## Findings at a glance

| ID | Severity | Finding | Evidence type |
|---|---|---|---|
| 01 | Critical | Undefined `zC` prevents frontend initialization | Focused ESLint + import-path inspection |
| 02 | High | Uploads do not persist extracted ranking data | Reproduced with synthetic upload |
| 03 | High | Top candidates are selected from only 100 arbitrary matches | Reproduced through API |
| 04 | High | Import leaves PostgreSQL candidate sequence behind | Source-confirmed; PostgreSQL reproduction not run |
| 05 | High | Fresh import omits location and filtering metrics | Source and CSV-header inspection |
| 06 | High | Public fallback JWT signing key | Conditional configuration risk |
| 07 | High | Required runtime dependency `pandas` is undeclared | Dependency/source inspection |
| 08 | Medium | Common multiword and punctuation skills are missed | Reproduced |
| 09 | Medium | Experience calculations discard months and double-count overlap | Reproduced |
| 10 | Medium | Degree values differ across collections, Explore and scoring | Reproduced |
| 11 | Medium | State/country suggestions are submitted as cities | Reproduced API contract |
| 12 | Medium | Default “Any” search searches the literal word “Any” | Reproduced |
| 13 | Medium | Allowed null target role causes HTTP 500 | Reproduced |
| 14 | Medium | Explore sorts only within each arbitrary page | Reproduced + source |
| 15 | Medium | Every uploaded resume is predicted with two years' experience | Reproduced call argument |
| 16 | Medium | Degree normalization corrupts fields and misses PhDs | Reproduced |
| 17 | Medium | PDF export can use different criteria from displayed results | Source-confirmed |
| 18 | Medium | Partial dataset imports cannot safely resume | Source-confirmed failure path |
| 19 | Medium | Registration validation errors are rendered as React objects | API response + source |
| 20 | Medium | Extracted profile cannot retrieve saved detailed sections | API/UI contract inspection |
| 21 | Medium | Notebook preprocessing calls a module as a function | Source-confirmed |
| 22 | Medium | Training/preprocessing use frozen “current” dates | Source-confirmed |
| 23 | Low | Configured lint command is broken | Command failed |
| 24 | Low | README database and PDF endpoint instructions are incorrect | Source comparison |

## Detailed findings

### 01 — Undefined expression prevents frontend startup

**Location:** `frontend/src/pages/UploadResume.jsx:23`; imported eagerly by `frontend/src/App.jsx`.

The module contains `}; zC`. `zC` has no declaration. This expression executes during module initialization, before React mounts, so the impact extends to the entire application, including the landing and login routes.

**Evidence:** focused ESLint returned `src/pages/UploadResume.jsx:23 'zC' is not defined.` The production build still completed because this is a runtime reference error, not invalid JavaScript syntax. Browser rendering was not separately exercised.

**Fix:** remove the stray expression and enable `no-undef` in the normal lint configuration. Verify initial loading and all route entry points afterward.

### 02 — Uploaded information is never saved into searchable profile relations

**Location:** `backend/app/routes/upload.py:86–104`; `backend/app/models/models.py`; `backend/app/routes/search.py`.

The endpoint saves an `UploadedResume`, raw profile text, phone/name under limited conditions, and predicted role. It never saves extracted skills, experiences, educations, abilities, location, `total_experience_years`, or `highest_degree_level`. Search and scoring read those relations/columns rather than re-parsing the raw text.

**Reproduction:** a synthetic successful upload with Python, a Master's degree and dated experience returned success, but the candidate retained zero skills, experiences, educations and abilities; experience and degree metrics stayed zero.

**Impact:** uploaded candidates lose skill/experience/education points and are excluded by strict Explore filters. Re-uploading also cannot refresh those structured fields.

**Fix:** persist normalized extracted data and derived metrics in one transaction, with an explicit replacement policy for re-uploads.

### 03 — Ranking discards potentially stronger candidates before scoring

**Location:** `backend/app/routes/search.py:128`, `:146`, `:215–222`.

Both name and role search apply `.limit(100)` without ranking before loading/scoring candidates. `total_filtered` reports the truncated list length, not the full matching population. The final slice returns six results despite the README promising five.

**Reproduction:** seeded 101 matching Engineers. Candidate 101 alone had the requested Python skill plus education and abilities. The endpoint reported 100 filtered candidates and returned IDs 1–6, omitting candidate 101.

**Fix:** calculate a valid ranking across all matches, or use a documented approximate shortlist with defensible ordering and accurate counts. Set a consistent top-result count across API, UI and documentation.

### 04 — Dataset import does not synchronize the candidate ID sequence

**Location:** `backend/scripts/import_dataset.py:44–55`; separate workaround in `backend/scripts/fix_sequence.py`.

The importer inserts explicit `person_id` values into `candidates.id`. PostgreSQL sequences do not advance from explicit ID inserts, and the importer never invokes the sequence repair. Later candidate registration can allocate an already-used ID and fail with a primary-key conflict.

**Evidence:** source-confirmed PostgreSQL failure path; the repository already contains a separate sequence-repair utility. This audit did not execute destructive imports or reproduce the conflict against the existing PostgreSQL database.

**Fix:** synchronize the sequence as part of a successful import, including an integration check that registering a new candidate works immediately afterward.

### 05 — Fresh imports omit fields used by Explore filters

**Location:** `backend/scripts/import_dataset.py:44–55`; `backend/app/routes/search.py:255–275`; `calculate_db_metrics.py`.

The provided people CSV contains `City`, `State` and `Country`, but the import mapping omits them. It also omits `total_experience_years` and `highest_degree_level`. SQLAlchemy's Python-side column defaults are not server defaults applied by Pandas `to_sql`, so omitted metrics can be NULL on a fresh schema. The separate metrics script is not integrated into the importer and does not populate locations.

**Impact:** freshly imported candidates disappear from location and positive experience/degree filtering even when source data qualifies them.

**Fix:** map source locations and populate validated metrics during import. Include these steps in a single documented setup workflow.

### 06 — Missing secret configuration silently enables a known JWT key

**Location:** `backend/app/utils/auth.py:13`.

If `SECRET_KEY` is absent, the backend signs and verifies tokens using a public string embedded in source. Someone who knows an existing user's email could forge a token for that account under that configuration; knowing an admin email would enable admin access because the database account supplies the effective role.

**Evidence:** conditional source-confirmed vulnerability. This report does not claim the current private `.env` uses the fallback, and no live token forgery was attempted.

**Fix:** require an explicitly configured strong secret and fail startup when it is missing or a known placeholder.

### 07 — Clean installations are missing a runtime dependency

**Location:** `backend/app/utils/ml.py:27`; `backend/requirements.txt`; import/training scripts.

ML inference imports `pandas`, but `pandas` is absent from requirements. The installed virtual environment happens to contain it. The declared runtime dependencies do not guarantee its installation.

**Impact:** on a clean environment, the upload endpoint's ML import can raise `ModuleNotFoundError`, producing a pipeline HTTP 500; import/training scripts fail as well.

**Fix:** declare pandas explicitly and validate installation in a fresh environment. Declare notebook-only tooling separately. `pip check` passing in the existing environment does not detect missing application declarations.

### 08 — Skill tokenizer cannot recognize common resume skills

**Location:** `backend/app/utils/nlp.py:91–109`.

The matcher looks up single regex tokens as complete skill names. Multiword skills never match; trailing `+`/`#` are dropped by the word-boundary pattern, and dots split tokens.

**Reproduction:** with Python, Machine Learning, C++, C# and Node.js in the synthetic vocabulary, the text `Python Machine Learning C++ C# Node.js` returned only Python.

**Fix:** use phrase matching with explicit boundaries that preserve skill punctuation and support multiword names. Also reconsider the unconditional 20-skill truncation at line 278.

### 09 — Experience totals are inaccurate

**Location:** `backend/app/utils/scoring.py:5–33`.

`parse_date` extracts only the year and substitutes January 1. `calculate_total_experience` sums each job independently.

**Reproduction:** January–December 2020 became **0.0 years**, rather than approximately 0.9 years. Two simultaneous 2020–2022 jobs became **4.0 years** of elapsed career experience rather than 2.0.

**Fix:** parse supported month/year formats, distinguish missing and ongoing dates, validate years, and merge overlapping intervals for elapsed experience. Share this logic with training and filtering metrics.

### 10 — Inconsistent degree strings silently bypass degree requirements

**Location:** `frontend/src/pages/AdminDashboard.jsx:10–13`, `:911–912`; `frontend/src/pages/ExploreDashboard.jsx:199–200`; `backend/app/utils/scoring.py:130–140`.

Collections and Explore use `Bachelor's`/`Master's`; scoring recognizes only `Bachelor`/`Master`. Unknown strings fall through to the “Any” branch. The main admin dropdown uses the canonical strings, making behavior differ by entry point.

**Reproduction:** a Bachelor candidate with an ability received 15 education/ability points for `Master's`, but only 5 for canonical `Master`. Explore's database filter partly normalizes these strings, but its scoring still does not.

**Fix:** enforce one enum in API schemas and frontend payloads, normalize existing saved collections, and reject unsupported values.

### 11 — Country and state suggestions lead to city-only searches

**Location:** `frontend/src/pages/ExploreDashboard.jsx:47`; `backend/app/routes/search.py:227–246`, `:255–260`.

Autocomplete combines cities, states and countries into untyped strings. The frontend sends every selection as `city`.

**Reproduction:** candidates in Ahmedabad, Gujarat, India produced the suggestion `India`; sending that selection as the frontend does (`{"city":"India"}`) returned zero matches.

**Fix:** return typed suggestions and submit the appropriate field, or introduce one location query that searches city/state/country with OR semantics.

### 12 — Default search treats “Any” as a literal role

**Location:** `backend/app/schemas/search.py:5`; `backend/app/routes/search.py:133–143`.

`SearchQuery` defaults the role to `Any`, but search builds `%Any%` and filters titles with it.

**Reproduction:** POST `/api/search/candidates` with `{}` returned zero matches despite 101 Engineer candidates. It can also accidentally match titles containing that substring.

**Fix:** skip role filtering for the explicit “Any” sentinel and define consistent neutral-role scoring for search, Explore, name search and PDF export.

### 13 — Valid schema input crashes scoring

**Location:** `backend/app/schemas/search.py:5`, `:47`; `backend/app/utils/scoring.py:54`.

The schemas accept `target_job_role: null`, but scoring calls `.lower()` unconditionally.

**Reproduction:** POST `/api/search/explore` with `{"target_job_role":null}` returned **500 Internal Server Error** when candidates existed.

**Fix:** normalize null to the documented default or disallow it with validation. Add bounds for pagination and experience values while tightening these schemas.

### 14 — Explore results are not globally ranked or stably paginated

**Location:** `backend/app/routes/search.py:308–320`, `:369`; `frontend/src/pages/ExploreDashboard.jsx:55–57`.

The database applies offset/limit without an explicit order. Scoring and sorting occur only afterward, within that page. The frontend appends subsequent pages without globally sorting them.

**Reproduction:** the first 16-result page excluded the stronger synthetic candidate 101. Source inspection confirms later page scores cannot alter the first page's ordering. Lack of stable ordering also makes pagination unreliable when database query plans/data change.

**Fix:** define stable ordering before pagination. If the UI promises score order, compute that order across the full eligible set and use a deterministic ID tie-breaker.

### 15 — ML inference supplies a fabricated experience feature

**Location:** `backend/app/routes/upload.py:62`; `backend/app/utils/ml.py:41–45`.

Every uploaded resume passes `experience_years=2.0`, regardless of its actual employment history. The multimodal training pipeline uses experience as a numerical feature.

**Evidence:** the synthetic upload probe captured the constant `2.0` call argument even though parsed output included dated experience.

**Fix:** derive experience from parsed structured dates and use the same feature definition as training. This is a feature-contract defect; this audit did not quantify its effect on prediction accuracy.

### 16 — Degree normalization corrupts field names and drops doctoral levels

**Location:** `backend/app/utils/nlp.py:114–136`; `backend/app/utils/scoring.py:121–128`.

The code removes every occurrence of `of` and `in`, including characters inside words. It has no PhD/doctorate normalization branch, and scoring's highest-degree logic recognizes only Bachelor and Master.

**Reproduction:** `Bachelor of Engineering` produced field **Engeerg**. `PhD in Computer Science` produced degree **null**. A doctoral candidate can therefore fail higher-degree logic or be assigned level zero during extraction/import.

**Fix:** remove connector words using token boundaries and apply one degree hierarchy across parsing, metrics, search and scoring.

### 17 — PDF export can disagree with the displayed match score

**Location:** `frontend/src/pages/AdminDashboard.jsx:190–218`; `frontend/src/pages/ExploreDashboard.jsx:127–135`.

Exports use current editable form/filter state, not the criteria that generated the displayed results. Editing filters after searching and exporting an existing card recomputes the report with different requirements. Admin name search also exports using unrelated role-search form state.

**Reproduction path:** search using requirement A, leave the results visible, change the form to B without searching, then export a displayed candidate. The export payload contains B.

**Fix:** store the submitted criteria alongside each result set and use that snapshot for export and pagination. Decide whether editing filters clears stale results.

### 18 — Partial imports leave a database that the importer refuses to finish

**Location:** `backend/scripts/import_dataset.py:28–30`, `:55–144`.

Each `to_sql` call uses the engine separately, so the import is not one transaction. If skills/experience/education import fails after candidates commit, a second run exits merely because any candidate exists. The same guard blocks initial dataset import after one user registers.

**Impact:** recovery currently points toward resetting the database, which would discard existing users and other records.

**Fix:** use a deliberate import transaction or checkpointed/idempotent import with conflict handling. Separate imported records from registered profiles when deciding whether an import is complete.

### 19 — Registration can crash when displaying FastAPI validation errors

**Location:** `frontend/src/pages/Register.jsx:22`, `:34`.

FastAPI validation errors use a `detail` array of objects. The frontend assigns that array directly to `error` and renders `{error}`. React cannot render those objects as children.

**Reproduction path:** a backend-rejected email such as `audit@localhost` produces HTTP 422 with an array-valued detail. Browser email checks and Pydantic email validation need not accept identical addresses. This can also be triggered by a mocked 422 response.

**Fix:** convert validation objects to readable strings before rendering, and use a shared API-error formatter for other pages with the same pattern.

### 20 — “My Extracted Profile” does not provide the promised detailed profile

**Location:** `backend/app/schemas/candidate.py:10–24`; `frontend/src/pages/ExtractedProfile.jsx:28–35`; `frontend/src/pages/CandidateDashboard.jsx`.

The dashboard promises skills, abilities and work experience, but the profile response and UI expose only basic contact information and job role. Detailed upload output exists only in the upload component's state and disappears on navigation/reload.

**Fix:** after fixing persistence, include structured data and latest resume metadata in the profile response and show it on the profile page.

### 21 — Preprocessing notebook calls the IPython display module

**Location:** `data_preprocessing.ipynb`, code cell at zero-based index 6.

The cell uses `from IPython import display` followed by `display(df_people.info())` and `display(df_people.head(3))`. That import refers to the display module, not its callable display function, so execution raises a module-not-callable TypeError.

**Fix:** use `from IPython.display import display`; call `df_people.info()` separately because it prints its output and returns None. Full notebook execution was not performed.

### 22 — Training and preprocessing freeze ongoing experience at past dates

**Location:** `backend/scripts/rebuild_model_pipeline.py:62`; `rebuild_model.ipynb`, cell index 15; `data_preprocessing.ipynb`, cell index 12.

The training script substitutes 1 August 2026 for ongoing jobs; the rebuilding notebook substitutes `08/2026`; preprocessing uses `current_year = 2024`. Re-running them later generates inconsistent/stale experience features, whereas live scoring uses the current time.

**Fix:** pass an explicit, documented dataset snapshot date into all pipelines and use the same date semantics for evaluation/inference, or consistently derive today's date where appropriate.

### 23 — The provided lint command cannot run

**Location:** `frontend/package.json:9`; missing ESLint configuration.

**Evidence:** `npm run lint` failed with “ESLint couldn't find a configuration file.” A focused ad hoc check detected finding 01.

**Fix:** add the configuration and ignore generated `dist` files, then make lint a required check. No pre-existing automated application tests were found in the source tree.

### 24 — README setup and API instructions contradict the implementation

**Location:** `README.md:19`, `:41`, `:102`; `backend/app/database/database.py:8`; `backend/app/routes/export.py:367`.

The README describes SQLite development, then instructs creating PostgreSQL database `ai_resume_db`. The application default and database-creation script instead use `airesumedb`. The documented `GET /api/export/pdf/{candidate_id}` does not exist; the implementation is `POST /api/export/candidate/{candidate_id}/pdf` with a search body. Dataset import, metrics calculation and sequence repair are not integrated into setup instructions. Ranking documentation also differs from current behavior.

**Fix:** provide one verified setup path, an example environment file without real credentials, and API documentation generated from or checked against OpenAPI.

## Additional observations and verification limits

- The configured production build passed: 2,133 modules transformed; the principal JavaScript bundle was approximately 708 kB before gzip. Vite emitted plugin-deprecation and bundle-size warnings. These warnings are not the frontend startup failure.
- `npm ls --depth=0` completed without reporting invalid direct installed dependencies. `pip check` reported no broken installed requirements. A fresh installation was not attempted and package vulnerability advisories were not audited.
- Python parsing passed for 37 files, including the new audit helper: 36 pre-existing Python source files had no syntax errors. Runtime behavior still contains the defects above.
- Synthetic API smoke checks passed for health, registration, login and PDF export (HTTP 200 with a `%PDF-` header). Anonymous search returned 401 and candidate-role search returned 403 as expected. PDF layout was not visually reviewed.
- The bundled model loaded and returned a prediction for a synthetic text. This is an inference smoke check, not validation of accuracy, fairness, calibration or training-data quality.
- `scoring_notebook.ipynb` contains a saved kernel-crash output. Its root cause is not established. Its first cell also tries `!pip install re, datetime`; `re` and `datetime` are standard-library modules and this installation command should be removed. No packages were installed by this audit.
- Search role statistics and exported experience order compare date strings lexicographically (`search.py:47`, `export.py:223–227`), so `12/2019` can be treated as later than `01/2024`. Parse dates before ordering. The saved-candidate trend also emits zero for every day (`search.py:99`) rather than calculating actual daily values.
- Upload handling reads the entire file before enforcing 5 MB, performs synchronous NLP/database work inside an async route, and incorporates the client filename into a disk path. Use bounded reading, controlled worker execution and generated server filenames. No load test or malicious filesystem-write test was run.
- The API creates tables at import time in both `main.py` and `routes/export.py`; `create_all` is not a migration mechanism for existing schemas. Production startup, deployed CORS configuration and schema migration state were not verified.
- Browser interaction, visual PDF layout, fresh PostgreSQL import, full dataset integrity, full notebook execution and retraining were outside executed verification. API and module behavior were tested in isolation. Existing private `.env` values were not printed or incorporated into this report.
- The directory was not a Git repository, so no Git baseline or historical regression attribution was available.

## Recommended repair order

1. Remove the frontend startup blocker and restore lint checks.
2. Persist uploaded data; unify experience, degree and skill normalization.
3. Correct ranking, filters, pagination and result/export criteria snapshots.
4. Make import/setup reliable, declare pandas and enforce secret configuration.
5. Repair profile/error UX and notebook/documentation issues, then validate complete candidate/admin workflows against PostgreSQL and in a browser.

Application source fixes were not applied; this delivery is an audit report with supporting reproducible checks.
