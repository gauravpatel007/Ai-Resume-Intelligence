# AI Resume Intelligence

AI Resume Intelligence is an advanced NLP and ML-powered application that automates the screening, extraction, and ranking of candidate resumes. It provides a seamless experience for candidates to upload resumes and for recruiters/admins to intelligently search and rank them.

## 🚀 Key Features

* **Candidate Portal**: Candidates can register, upload PDF resumes, and view the AI-extracted data (skills, experience, education, predicted job role).
* **NLP Extraction**: Uses SpaCy to intelligently parse unstructured text from PDFs into structured data (Contact info, Entities, Matched Skills from a database).
* **AI Candidate Ranking**: Admins can search for specific job roles and required/preferred skills. The system calculates a weighted score (Skills 40%, Experience 25%, Role 20%, Education 15%) and returns the top 5 matches.
* **Admin Dashboard**: An interactive, single-page dashboard with real-time search, interactive charts, detailed candidate profiles, and PDF export functionality.
* **PDF Report Generation**: Exports comprehensive breakdown reports for candidates, dynamically handled in-memory using ReportLab.

## 🏗 Architecture 

The project is built using a modern, decoupled architecture:

* **Frontend**: React (Vite), TailwindCSS, Recharts.
* **Backend**: FastAPI (Python), SQLAlchemy, SpaCy.
* **Database**: PostgreSQL (`airesumedb`) with full relational tables.
* **Authentication**: JWT (JSON Web Tokens) with Role-Based Access Control.

## 🛠 Setup Instructions

## Backend :
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app.main:app --reload --port 8080
   ```
2. Create and activate a virtual environment:
```bash
cd frontend
npm install
npm run dev
```
### 1. Database Setup
Ensure you have PostgreSQL installed and running locally.
- Create a database named `airesumedb`
- *(Note: The database tables will be created automatically when you run the backend server or the setup scripts).*

### 2. Backend Setup
Navigate into the `backend` directory, create a virtual environment, and install all dependencies:
   ```bash
cd backend
python -m venv venv
# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate

# Install dependencies
   pip install -r requirements.txt

# Download the NLP model for spaCy
python -m spacy download en_core_web_sm

# Set up the `.env` file with a strong SECRET_KEY and DB credentials
echo "SECRET_KEY=generate_a_secure_key_here" > .env
echo "DATABASE_URL=postgresql://user:password@localhost/airesumedb" >> .env

# Import dataset and initialize sequence
python scripts/import_dataset.py
   ```

**Run the Backend Server:**
   ```bash
   uvicorn app.main:app --reload --port 8080
   ```
   *The API will be available at `http://localhost:8080`*

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The app will be available at `http://localhost:3200`*

## 🔌 API Endpoints Reference

### Auth (`/api/auth`)
- `POST /register`: Register a new candidate.
- `POST /login`: Authenticate and receive a JWT.
- `GET /me`: Get current logged-in user details.

### Candidate (`/api/candidate`)
- `GET /me`: Fetch the logged-in candidate's detailed profile.
- `PUT /me`: Update the candidate's profile information.

### Upload (`/api/upload`)
- `POST /resume`: Upload a PDF resume, trigger NLP extraction, and save to DB.

### Search (`/api/search`)
- `POST /candidates`: (Admin only) Search and rank candidates based on role and skills.

### Export (`/api/export`)
- `POST /candidate/{candidate_id}/pdf`: (Admin only) Generate and download a PDF breakdown report using the provided search criteria.

## 🧠 ML Approach & NLP

We use **SpaCy (`en_core_web_sm`)** to process the raw text extracted from PDF resumes.
- **Named Entity Recognition (NER)**: Extracts PERSON, ORG, and GPE tags to identify names, companies, and locations.
- **Skill Matching**: Uses tokenization and regex to extract alphanumeric tokens, matching them efficiently against the SQL database of predefined skills.
- **Role Prediction**: A custom ML component (TF-IDF/Heuristics) analyzes the extracted text to predict the most likely job role.

## 📊 Ranking Formula

The Admin search utilizes a custom scoring algorithm (`score_candidate`) that outputs a score out of 100:

1. **Skills (40 Points max)**: 
   - Proportional to matches on required skills and preferred skills.
2. **Experience (25 Points max)**:
   - Calculates true elapsed experience across intervals. Proportional score up to 25 based on the Admin's `min_experience_years`.
3. **Role Alignment (20 Points max)**:
   - Matches the target role or "Any" role context.
4. **Education (15 Points max)**:
   - Base points awarded via a degree hierarchy (PhD=15, Master=10, Bachelor=5).

## 🗄 Database Design

The relational database relies on SQLAlchemy ORM:
- `users`: Authentication details and roles.
- `candidates`: Core profile information (linked 1:1 with users).
- `skills`: Predefined dictionary of skills.
- `candidate_skills`: Many-to-Many association table linking candidates and skills.
- `experiences`: One-to-Many table for past jobs.
- `educations`: One-to-Many table for degrees/certifications.
- `uploaded_resumes`: Tracks uploaded PDFs and raw text.
