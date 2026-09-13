🚀 Project: AI Resume Intelligence & Candidate Ranking System
1. Tech Stack
Frontend
| Technology           | Purpose                                  |
| -------------------- | ---------------------------------------- |
| **React + Vite**     | Frontend application                     |
| **JavaScript**       | Main frontend language                   |
| **Tailwind CSS**     | UI styling                               |
| **React Router DOM** | Public/Admin routing                     |
| **Axios**            | API communication                        |
| **Recharts**         | Top 5 candidate bar charts and analytics |
| **Lucide React**     | Icons                                    |

Backend
| Technology           | Purpose                      |
| -------------------- | ---------------------------- |
| **Python**           | Main backend and ML language |
| **FastAPI**          | REST API development         |
| **SQLAlchemy**       | Database ORM                 |
| **Pydantic**         | Request/response validation  |
| **JWT**              | Authentication               |
| **bcrypt / passlib** | Password hashing             |
| **Uvicorn**          | Run FastAPI server           |

Database : 
| Technology     | Purpose                            |
| -------------- | ---------------------------------- |
| **PostgreSQL** | Main database                      |
| **DBeaver**    | Database management and inspection |

Main database data:
Users
Candidates
Skills
Candidate_Skills
Education
Experience
Abilities
Job_Roles
Uploaded_Resumes
Plus the imported 54K dataset.

NLP + Machine Learning
| Technology              | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| **Pandas**              | Dataset processing                          |
| **NumPy**               | Data manipulation                           |
| **scikit-learn**        | ML models                                   |
| **spaCy**               | NLP processing                              |
| **PyMuPDF**             | PDF text extraction                         |
| **TF-IDF**              | Convert resume text into numerical features |
| **Logistic Regression** | Job role classification                     |
| **Linear SVM**          | Compare model performance                   |
| **Cosine Similarity**   | Candidate/job matching                      |

PDF Generation
| Technology    | Purpose                                      |
| ------------- | -------------------------------------------- |
| **ReportLab** | Generate downloadable candidate analysis PDF |

2. Overall Project Process
PHASE 1 : Project Setup
    ↓
PHASE 2 : Dataset Understanding
    ↓
PHASE 3 : Dataset Cleaning & Combining
    ↓
PHASE 4 : Database Design & Import
    ↓
PHASE 5 : Authentication & Roles
    ↓
PHASE 6 : Resume PDF Upload & Text Extraction
    ↓
PHASE 7 : NLP Information Extraction
    ↓
PHASE 8 : ML Job Role Prediction
    ↓
PHASE 9 : Candidate Search & Ranking
    ↓
PHASE 10 : Admin Analytics & Top 5
    ↓
PHASE 11 : PDF Report Export
    ↓
PHASE 12 : Frontend Integration
    ↓
PHASE 13 : Testing & Deployment

🟢 PHASE 1 — Project Setup
Goal:

Create the basic frontend and backend structure.

Tasks:
Frontend : React + Vite
Tailwind CSS
React Router
Axios
Recharts


Create pages : 
/
├── Login
├── Register
├── Candidate Dashboard
├── Upload Resume
├── Extracted Profile
├── Admin Dashboard
├── Candidate Search
├── Top 5 Results
├── Candidate Details
└── PDF Report Page


Backend 

Create FastAPI structure:

backend/
│
├── app/
│   ├── main.py
│   ├── database/
│   ├── models/
│   ├── schemas/
│   ├── routes/
│   ├── services/
│   ├── ml/
│   └── utils/
│
├── dataset/
├── trained_models/
└── requirements.txt
Result:

Frontend and backend are running and connected.


