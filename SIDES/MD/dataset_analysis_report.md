# Dataset Analysis Report

This report analyzes the structured resume dataset provided for the AI Resume Intelligence and Candidate Ranking System project.

## 1. File Details and Row Counts

Based on an inspection of the six provided CSV files, the dataset contains the following records (excluding headers):

| Filename | Row Count | Primary Purpose |
|----------|-----------|-----------------|
| `01_people.csv` | 54,934 | Contains the core candidate profile (ID, name, contact). |
| `02_abilities.csv` | 1,219,474 | Contains detailed tasks, responsibilities, or abilities extracted from resumes. |
| `03_education.csv` | 76,000 | Contains candidate education history (institution, program, dates). |
| `04_experience.csv` | 265,405 | Contains candidate work experience (job title, firm, dates, location). |
| `05_person_skills.csv` | 2,483,377 | Maps a candidate to their specific skills. |
| `06_skills.csv` | 226,761 | A master vocabulary list of all unique skills found in the dataset. |

## 2. Column Structure and Data Types

* **`01_people.csv`**
  * `person_id` (Integer) - Primary Key
  * `name` (String)
  * `email` (String) - High missing values rate
  * `phone` (String) - High missing values rate
  * `linkedin` (String) - High missing values rate

* **`02_abilities.csv`**
  * `person_id` (Integer) - Foreign Key
  * `ability` (String) - Text description of a capability or bullet point from a resume.

* **`03_education.csv`**
  * `person_id` (Integer) - Foreign Key
  * `institution` (String)
  * `program` (String)
  * `start_date` (String)
  * `location` (String)

* **`04_experience.csv`**
  * `person_id` (Integer) - Foreign Key
  * `title` (String) - Job role/title
  * `firm` (String) - Company name
  * `start_date` (String)
  * `end_date` (String)
  * `location` (String)

* **`05_person_skills.csv`**
  * `person_id` (Integer) - Foreign Key
  * `skill` (String) - Skill name matching the vocabulary in `06_skills.csv`.

* **`06_skills.csv`**
  * `skill` (String) - Primary Key / Unique skill identifier.

## 3. Relationships and Cardinality

The dataset follows a classic **one-to-many** relational structure centered around the candidate:

* **Primary Key:** `person_id` in `01_people.csv` uniquely identifies each of the ~54K candidates.
* **Foreign Keys:** Every other table (except `06_skills.csv`) uses `person_id` to link back to the candidate.
* **Cardinality Check:** One person can have multiple rows in the related files. For example, `person_id` 1 has multiple abilities, multiple experience records, and multiple skills. 
* **Skill Mapping:** The `05_person_skills.csv` table does not use a numerical ID for skills; instead, it directly uses the string value (e.g., "Database administration"). This directly links to the vocabulary list in `06_skills.csv`.

## 4. Missing Values and Duplicates (Estimates based on inspection)

* **People:** The contact info (`email`, `phone`, `linkedin`) is mostly missing or blank based on initial row sampling.
* **Experience & Education:** Dates and locations are frequently missing or inconsistently formatted (e.g., "07/2013" vs "06/07" vs "June 2007").
* **Duplicates:** With ~2.5 million skills mapping to 54K candidates, there's an average of ~45 skills per candidate. There may be near-duplicate skills (e.g., "Sql server" and "Sql server 2005") that will need normalization.

## 5. Machine Learning Labels (Job Role Prediction)

* **Target Labels:** The `title` column in `04_experience.csv` is the perfect candidate for job role prediction labels. By aggregating the experience records for a candidate, we can extract their most recent or most frequent job title to serve as the ground truth label for training the ML model.

## 6. Recommended Database Structure (Phase 4 Preparation)

For the PostgreSQL database design, I recommend:
1. **`candidates` table:** `id` (PK, maps to person_id), `name`, `email`, `phone`, `linkedin`
2. **`skills` table:** `id` (PK), `name` (unique)
3. **`candidate_skills` table:** `candidate_id` (FK), `skill_id` (FK) - Many-to-Many resolution
4. **`experiences` table:** `id` (PK), `candidate_id` (FK), `title`, `company`, `start_date`, `end_date`
5. **`educations` table:** `id` (PK), `candidate_id` (FK), `institution`, `program`, `start_date`
6. **`abilities` table:** `id` (PK), `candidate_id` (FK), `description`

*(Note: We should convert the string-based skill mapping in the CSV to a proper Integer-based Foreign Key mapping in PostgreSQL to save space and improve query speed).*

## 7. Recommended Strategy for Candidate-Level Dataset (Phase 3 Preparation)

To create a single processed CSV for NLP/ML where one row = one candidate:
1. **Load Dataframes:** Load all 6 files using `pandas`.
2. **Group By `person_id`:** 
   - `02_abilities`: Join abilities into a single string (e.g., `", ".join(abilities)`).
   - `05_person_skills`: Join skills into a single string or list.
   - `03_education`: Concatenate degrees and institutions.
   - `04_experience`: Concatenate job titles and descriptions. Extract a list of `job_titles`.
3. **Calculate Total Experience:** Attempt to parse `start_date` and `end_date` from `04_experience.csv` to calculate total years of experience.
4. **Merge:** Join all aggregated dataframes onto `01_people.csv` using a left join on `person_id`.
5. **Create `combined_profile_text`:** Create a new column that concatenates the aggregated skills, abilities, education, and experience text into one large text block per candidate. This column will be TF-IDF vectorized later.
