from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import joblib

def train_risk_model():
    """
    A conceptual function to train a model to predict project risk score.
    In a real-world scenario, you would connect to your database to get training data.
    """
    # Sample data representing features that might influence risk.
    # This would come from your project_health table and other sources.
    data = {
        'bug_trend': [1, 0, 1, 0, 1],  # 1 for increasing/stable, 0 for decreasing
        'sprint_velocity': [35, 42, 30, 50, 25],
        'technical_debt': [2, 1, 3, 1, 3], # 1:low, 2:medium, 3:high
        'code_quality_index': [85, 92, 70, 95, 65],
        'risk_score': [78, 45, 85, 30, 90] # Target variable
    }
    df = pd.DataFrame(data)

    X = df[['bug_trend', 'sprint_velocity', 'technical_debt', 'code_quality_index']]
    y = df['risk_score']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = LinearRegression()
    model.fit(X_train, y_train)

    model_path = Path(__file__).parent / 'risk_model.pkl'
    print("Model training complete.")
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")
    return model

def predict_risk(bug_trend: int, sprint_velocity: int, technical_debt: int, code_quality_index: int) -> float:
    """
    Predict risk score given project metrics:
    - bug_trend: 1 (increasing/stable) or 0 (decreasing)
    - sprint_velocity: story points per sprint
    - technical_debt: 1 (low), 2 (medium), 3 (high)
    - code_quality_index: 0 to 100
    """
    model_path = Path(__file__).parent / 'risk_model.pkl'
    if not model_path.exists():
        train_risk_model()
    model = joblib.load(model_path)
    features = pd.DataFrame([{
        'bug_trend': bug_trend,
        'sprint_velocity': sprint_velocity,
        'technical_debt': technical_debt,
        'code_quality_index': code_quality_index
    }])
    pred = model.predict(features)[0]
    return float(max(0, min(100, round(pred, 2))))

if __name__ == '__main__':
    from pathlib import Path
    train_risk_model()
    # Sample inference
    sample_risk = predict_risk(bug_trend=1, sprint_velocity=35, technical_debt=2, code_quality_index=80)
    print(f"Sample Project Risk Prediction: {sample_risk}/100")