# Machine Learning Architecture: Job Role Predictor

The AI Resume Intelligence platform leverages a multi-modal Machine Learning classification model to predict a candidate's most likely job role based on their resume data. This document outlines the dataset preparation, feature engineering, modeling techniques, and inference pipeline.

## 1. Goal and Algorithm
The core ML task is a **Multi-Class Classification** problem. We aim to predict a candidate's `target_role` (e.g., "Software Engineer", "Data Scientist", "Project Manager") out of the top 50 most common roles in the database.

The chosen algorithm is a **Linear Support Vector Classifier (`LinearSVC`)**. Support Vector Machines are highly effective in high-dimensional spaces, making them ideal for text classification (TF-IDF) combined with numerical features.

## 2. Dataset Preparation
The raw data comes from a relational schema (People, Abilities, Education, Experience, Skills). Before modeling, the data undergoes heavy preprocessing:
- **Date Standardization**: Text dates like "August 2020" or "Present" are parsed into standardized `datetime` objects.
- **Experience Calculation**: `start_date` and `end_date` are subtracted to calculate the duration of each job in years.
- **Aggregation**: For each `person_id`, all skills, abilities, and educational programs are grouped and concatenated into single strings.

## 3. Feature Engineering
The model is "multi-modal", meaning it learns from both unstructured text and structured numerical data simultaneously. We use Scikit-Learn's `ColumnTransformer` to process these features in parallel:

### Feature 1: `profile_text` (Unstructured Text)
- **What it is**: A massive concatenated string combining a candidate's `aggregated_skills`, `aggregated_abilities`, and `aggregated_education`.
- **How it's processed**: Handled via `TfidfVectorizer`.
  - **TF-IDF**: Converts text into a matrix of TF-IDF features, emphasizing rare but important keywords.
  - **Hyperparameters**: Extracts both unigrams and bigrams (`ngram_range=(1,2)`), limits to the top 10,000 features, removes English stop words, and applies sublinear TF scaling (`sublinear_tf=True`) to reduce the dominance of repeated words.

### Feature 2: `total_experience_years` (Structured Numerical)
- **What it is**: A float representing the sum of all experience durations across the candidate's career.
- **How it's processed**: Handled via `StandardScaler`.
  - Standardizing this feature (mean = 0, variance = 1) ensures it sits on a comparable scale to the TF-IDF matrix.
  - **Why it matters**: This feature allows the model to distinguish between seniority levels. For example, two resumes might have identical Python and React skills, but the model can classify one as "Front End Developer" and the other as "Senior Front End Developer" based purely on the years of experience.

## 4. Model Training Pipeline
The final pipeline integrates the preprocessor and the classifier:
```python
pipeline = Pipeline([
    ('preprocessor', ColumnTransformer(
        transformers=[
            ('text', TfidfVectorizer(ngram_range=(1, 2), max_features=10000, stop_words='english', sublinear_tf=True), 'profile_text'),
            ('exp', StandardScaler(), ['total_experience_years'])
        ]
    )),
    ('clf', LinearSVC(C=1.0, random_state=42, max_iter=3000))
])
```
The model was trained on an 80/20 train-test split of 18,771 valid candidate samples, achieving a highly robust **97.52% accuracy**.

## 5. Inference and Integration
Once trained, the `Pipeline` is exported to disk as `job_role_predictor.pkl`. 

In the FastAPI backend (`backend/app/utils/ml.py`), the model is lazily loaded via `joblib` on the first prediction request to optimize startup time. The `predict_job_role(resume_text, experience_years)` function dynamically constructs a Pandas DataFrame matching the training schema and passes it through the pipeline to instantly infer the candidate's role.
