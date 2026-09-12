import os
import re
import time
import pandas as pd
import numpy as np
from datetime import datetime
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score

# Set base dataset path
DATASET_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dataset")
if not os.path.exists(DATASET_DIR):
    DATASET_DIR = "./backend/dataset"

print(f"🚀 Starting High-Performance Model Rebuilding Pipeline...")
print(f"Dataset folder: {DATASET_DIR}")
t_start = time.time()

# ----------------------------------------------------
# Step 1: Load and Clean Datasets
# ----------------------------------------------------
def load_csv(filename):
    path = os.path.join(DATASET_DIR, filename)
    print(f"Loading {filename}...")
    df = pd.read_csv(path, low_memory=False).dropna(how='all')
    if 'person_id' in df.columns:
        df = df[df['person_id'].notna()]
        df['person_id'] = df['person_id'].astype(int)
    return df

people_filename = "01_people_FINAL.csv" if os.path.exists(os.path.join(DATASET_DIR, "01_people_FINAL.csv")) else "01_people.csv"
df_people = load_csv(people_filename)
df_abilities = load_csv("02_abilities.csv")
df_education = load_csv("03_education.csv")
df_experience = load_csv("04_experience.csv")
df_person_skills = load_csv("05_person_skills.csv")

# ----------------------------------------------------
# Step 2: Date Standardization & Experience Calculation
# ----------------------------------------------------
print("Processing dates & calculating experience durations...")
MONTH_MAP = {
    'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
    'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6, 'jul': 7, 'july': 7,
    'aug': 8, 'august': 8, 'sep': 9, 'september': 9, 'oct': 10, 'october': 10,
    'nov': 11, 'november': 11, 'dec': 12, 'december': 12
}

def parse_date_fast(val):
    if pd.isna(val) or not val:
        return None
    val_str = str(val).strip()
    if not val_str or val_str.lower() in ['nan', 'none', '']:
        return None
    if re.search(r'present|current|now|ongoing', val_str, re.IGNORECASE):
        return datetime.now()
    
    # MM/YYYY or MM/YY
    if '/' in val_str:
        parts = val_str.split('/')
        if len(parts) == 2 and parts[0].strip().isdigit() and parts[1].strip().isdigit():
            m, y = int(parts[0]), int(parts[1])
            y = y + 2000 if y < 100 else y
            return datetime(y, max(1, min(12, m)), 1)
            
    # Month Name Year
    parts = re.sub(r'[,.-]', ' ', val_str).split()
    if len(parts) == 2:
        p0, p1 = parts[0].lower(), parts[1]
        if p0 in MONTH_MAP and p1.isdigit():
            y = int(p1)
            return datetime(y + 2000 if y < 100 else y, MONTH_MAP[p0], 1)
        if p1.lower() in MONTH_MAP and p0.isdigit():
            y = int(p0)
            return datetime(y + 2000 if y < 100 else y, MONTH_MAP[p1.lower()], 1)
            
    # 4-digit Year
    year_match = re.search(r'\b(19\d\d|20\d\d)\b', val_str)
    if year_match:
        return datetime(int(year_match.group(1)), 1, 1)
    return None

df_exp_clean = df_experience.dropna(subset=['person_id']).copy()
df_exp_clean['start_dt'] = df_exp_clean['start_date'].apply(parse_date_fast)
df_exp_clean['end_dt'] = df_exp_clean['end_date'].apply(parse_date_fast)

def get_duration(row):
    s, e = row['start_dt'], row['end_dt']
    if s is None or e is None:
        return 0.5
    months = (e.year - s.year) * 12 + (e.month - s.month)
    return max(0.0, round(months / 12.0, 2))

df_exp_clean['exp_duration'] = df_exp_clean.apply(get_duration, axis=1)

# Total exp per candidate
df_total_exp = df_exp_clean.groupby('person_id')['exp_duration'].sum().reset_index().rename(columns={'exp_duration': 'total_experience_years'})

# Latest title
df_exp_sorted = df_exp_clean.sort_values(by=['person_id', 'end_dt'], ascending=[True, False])
df_latest_title = df_exp_sorted.drop_duplicates(subset=['person_id'], keep='first')[['person_id', 'title']].rename(columns={'title': 'latest_job_title'})

# ----------------------------------------------------
# Step 3: Fast Feature Aggregation
# ----------------------------------------------------
print("Fast-aggregating skills, abilities, and education...")
# Skills
df_ps_clean = df_person_skills.dropna(subset=['person_id', 'skill']).copy()
df_ps_clean['skill'] = df_ps_clean['skill'].astype(str)
df_agg_skills = df_ps_clean.groupby('person_id')['skill'].agg(' '.join).reset_index().rename(columns={'skill': 'aggregated_skills'})

# Abilities
ability_col = 'ability' if 'ability' in df_abilities.columns else 'description'
df_ab_clean = df_abilities.dropna(subset=['person_id', ability_col]).copy()
df_ab_clean[ability_col] = df_ab_clean[ability_col].astype(str)
df_agg_abilities = df_ab_clean.groupby('person_id')[ability_col].agg(' '.join).reset_index().rename(columns={ability_col: 'aggregated_abilities'})

# Education
df_edu_clean = df_education.dropna(subset=['person_id', 'program']).copy()
df_edu_clean['program'] = df_edu_clean['program'].astype(str)

def get_degree_level(program_str):
    text_lower = str(program_str).lower()
    master_patterns = [r'\bmaster\b', r'\bmsc\b', r'\bm\.sc\b', r'\bmtech\b', r'\bm\.tech\b', r'\bms\b', r'\bm\.s\b', r'\bma\b', r'\bm\.a\b', r'\bmba\b']
    if any(re.search(pat, text_lower) for pat in master_patterns): return 2.0
    bachelor_patterns = [r'\bbachelor\b', r'\bbsc\b', r'\bb\.sc\b', r'\bbtech\b', r'\bb\.tech\b', r'\bbs\b', r'\bb\.s\b', r'\bba\b', r'\bb\.a\b', r'\bbba\b']
    if any(re.search(pat, text_lower) for pat in bachelor_patterns): return 1.0
    return 0.0

df_edu_clean['degree_level'] = df_edu_clean['program'].apply(get_degree_level)
df_max_degree = df_edu_clean.groupby('person_id')['degree_level'].max().reset_index()

df_agg_edu = df_edu_clean.groupby('person_id')['program'].agg(' '.join).reset_index().rename(columns={'program': 'aggregated_education'})
df_agg_edu = df_agg_edu.merge(df_max_degree, on='person_id', how='left')

# ----------------------------------------------------
# Step 4: Master Dataset Merge
# ----------------------------------------------------
print("Building master candidate dataset...")
# Drop unused metadata columns + real person 'Name' to avoid leakage
df_p_clean = df_people.drop(columns=['email', 'phone', 'linkedin', 'Name'], errors='ignore')

df_master = df_p_clean.merge(df_latest_title, on='person_id', how='left')
df_master = df_master.merge(df_total_exp, on='person_id', how='left')
df_master = df_master.merge(df_agg_skills, on='person_id', how='left')
df_master = df_master.merge(df_agg_abilities, on='person_id', how='left')
df_master = df_master.merge(df_agg_edu, on='person_id', how='left')

df_master['total_experience_years'] = df_master['total_experience_years'].fillna(0.0)
df_master['aggregated_skills'] = df_master['aggregated_skills'].fillna('')
df_master['aggregated_abilities'] = df_master['aggregated_abilities'].fillna('')
df_master['aggregated_education'] = df_master['aggregated_education'].fillna('')
df_master['degree_level'] = df_master['degree_level'].fillna(0.0)

# Determine target role
role_fallback = df_master['Role'] if 'Role' in df_master.columns else (df_master['name'] if 'name' in df_master.columns else None)
df_master['target_role'] = df_master['latest_job_title'].fillna(role_fallback)

# Profile text
df_master['profile_text'] = (
    df_master['aggregated_skills'] + ' ' + 
    df_master['aggregated_abilities'] + ' ' + 
    df_master['aggregated_education']
).str.strip()

# ----------------------------------------------------
# Step 5: High-Speed ML Model Training
# ----------------------------------------------------
print("Training LinearSVC Classifier...")
df_model_data = df_master[
    (df_master['profile_text'].str.len() > 15) & 
    (df_master['target_role'].notna()) & 
    (df_master['target_role'].astype(str).str.strip() != '')
].copy()

df_model_data['target_role'] = df_model_data['target_role'].astype(str).str.title().str.strip()
top_roles = df_model_data['target_role'].value_counts().head(50).index
df_train_subset = df_model_data[df_model_data['target_role'].isin(top_roles)].copy()

print(f"Training on {len(df_train_subset):,} samples across top {len(top_roles)} roles.")

X = df_train_subset[['profile_text', 'total_experience_years', 'degree_level']]
y = df_train_subset['target_role']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

preprocessor = ColumnTransformer(
    transformers=[
        ('text', TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=10000,
            stop_words='english',
            sublinear_tf=True
        ), 'profile_text'),
        ('exp_and_degree', StandardScaler(), ['total_experience_years', 'degree_level'])
    ]
)

pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('clf', LinearSVC(
        C=1.0,
        dual=False, # 10x faster primal optimization
        random_state=42,
        max_iter=2000
    ))
])

pipeline.fit(X_train, y_train)

y_pred = pipeline.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\n🎯 Model Accuracy on Test Set: {acc * 100:.2f}%")

# ----------------------------------------------------
# Step 6: Export Model
# ----------------------------------------------------
output_dir = os.path.join(os.path.dirname(DATASET_DIR), "ml_models")
os.makedirs(output_dir, exist_ok=True)
output_file = os.path.join(output_dir, "job_role_predictor.pkl")
joblib.dump(pipeline, output_file)
print(f"💾 Model saved to: {output_file}")
print(f"⏱️ Entire pipeline completed in {time.time() - t_start:.1f} seconds!")
