import os
import sys
import pandas as pd
import joblib
from sqlalchemy import text
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database.database import engine

def train_job_role_model():
    print("=== Starting ML Job Role Model Training ===")
    
    # 1. Fetch training data from PostgreSQL
    # Instead of a massive JOIN that creates a Cartesian product, we fetch them separately and merge in Pandas.
    print("Fetching data from database (optimized)...")
    
    # Get the latest job title per candidate
    exp_query = """
    SELECT DISTINCT ON (candidate_id) candidate_id, title as job_label 
    FROM experiences 
    WHERE title IS NOT NULL 
    ORDER BY candidate_id, start_date DESC NULLS LAST
    """
    df_labels = pd.read_sql(exp_query, engine)
    print(f"Fetched {len(df_labels)} candidates with job labels.")
    
    # Get aggregated abilities
    ab_query = "SELECT candidate_id, STRING_AGG(description, ' ') as abilities FROM abilities GROUP BY candidate_id"
    df_abilities = pd.read_sql(ab_query, engine)
    
    # Get aggregated skills
    skill_query = """
    SELECT cs.candidate_id, STRING_AGG(s.name, ' ') as skills 
    FROM candidate_skills cs 
    JOIN skills s ON cs.skill_id = s.id 
    GROUP BY cs.candidate_id
    """
    df_skills = pd.read_sql(skill_query, engine)
    
    # Merge datasets in memory (Instantaneous)
    df = df_labels.merge(df_abilities, on='candidate_id', how='left')
    df = df.merge(df_skills, on='candidate_id', how='left')
    
    # 2. Clean and preprocess the dataset
    print("Preprocessing text data...")
    # Combine abilities and skills into a single text profile
    df['abilities'] = df['abilities'].fillna('')
    df['skills'] = df['skills'].fillna('')
    df['profile_text'] = df['abilities'] + ' ' + df['skills']
    
    # Drop rows where we have no text data
    df = df[df['profile_text'].str.strip() != '']
    
    # Clean labels (convert to title case, keep top N most common labels to avoid extreme sparsity)
    df['job_label'] = df['job_label'].str.title()
    top_labels = df['job_label'].value_counts().head(50).index # Keep top 50 roles
    df = df[df['job_label'].isin(top_labels)]
    
    print(f"Training on {len(df)} samples across top 50 job roles.")
    
    if len(df) < 100:
        print("Not enough data to train. Exiting.")
        return
        
    X = df['profile_text']
    y = df['job_label']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 3. Build ML Pipeline
    print("Training TF-IDF + LinearSVC Pipeline...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(stop_words='english', max_features=5000, ngram_range=(1,2))),
        ('clf', LinearSVC(C=1.0, random_state=42, max_iter=2000))
    ])
    
    pipeline.fit(X_train, y_train)
    
    # 4. Evaluate
    print("Evaluating model...")
    y_pred = pipeline.predict(X_test)
    print(classification_report(y_test, y_pred, zero_division=0))
    
    # 5. Save the model
    model_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml_models")
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "job_role_predictor.pkl")
    
    joblib.dump(pipeline, model_path)
    print(f"✅ Model trained and saved successfully to {model_path}")

if __name__ == "__main__":
    train_job_role_model()
