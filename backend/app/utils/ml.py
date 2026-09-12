import os
import joblib

# Lazily load the ML model only when needed
_ml_pipeline = None

def get_job_role_predictor():
    """
    Loads the scikit-learn pipeline from disk (caches it in memory).
    Returns the loaded model, or None if the model file doesn't exist.
    """
    global _ml_pipeline
    if _ml_pipeline is None:
        model_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "ml_models",
            "job_role_predictor.pkl"
        )
        if os.path.exists(model_path):
            try:
                _ml_pipeline = joblib.load(model_path)
            except Exception as e:
                print(f"Warning: Failed to load ML model: {e}")
                return None
    return _ml_pipeline

import pandas as pd

def predict_job_role(resume_text: str, experience_years: float = 2.0, degree_level: float = 0.0) -> dict:
    """
    Predicts the most likely job roles for the given resume text, experience years, and degree level.
    Returns a dictionary with primary_role, alternative_roles (top 2 others with scores), and is_uncertain.
    """
    model = get_job_role_predictor()
    if not model:
        return None
        
    try:
        # Create input DataFrame matching ColumnTransformer feature names
        input_df = pd.DataFrame({
            'profile_text': [resume_text],
            'total_experience_years': [float(experience_years) if experience_years is not None else 2.0],
            'degree_level': [float(degree_level)]
        })
        
        try:
            if hasattr(model, "decision_function"):
                scores = model.decision_function(input_df)[0]
                classes = model.classes_
                
                # Sort indices by score descending
                import numpy as np
                sorted_indices = np.argsort(scores)[::-1]
                
                primary_idx = sorted_indices[0]
                primary_role = str(classes[primary_idx])
                primary_score = float(scores[primary_idx])
                
                alternative_roles = []
                for i in range(1, min(3, len(classes))):
                    idx = sorted_indices[i]
                    alternative_roles.append({
                        "role": str(classes[idx]),
                        "score": round(float(scores[idx]), 2)
                    })
                    
                # Calculate uncertainty based on margin between 1st and 2nd
                is_uncertain = False
                if len(sorted_indices) > 1:
                    margin = primary_score - scores[sorted_indices[1]]
                    if margin < 0.2:
                        is_uncertain = True
                        
                return {
                    "primary_role": primary_role,
                    "alternative_roles": alternative_roles,
                    "is_uncertain": is_uncertain
                }
            else:
                prediction = model.predict(input_df)
                return {
                    "primary_role": str(prediction[0]),
                    "alternative_roles": [],
                    "is_uncertain": False
                }
        except Exception as e:
            # Fallback if model was trained only on text array
            prediction = model.predict([resume_text])
            return {
                "primary_role": str(prediction[0]),
                "alternative_roles": [],
                "is_uncertain": False
            }
            
    except Exception as e:
        print(f"Warning: Prediction failed: {e}")
        return None
