from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import joblib

def train_risk_model():
    """
    Train regression model using datasets/module5_project_risk_telemetry_dataset.csv.
    """
    dataset_path = Path(__file__).parent.parent / 'datasets' / 'module5_project_risk_telemetry_dataset.csv'
    
    if dataset_path.exists():
        print(f"Loading training data from: {dataset_path}")
        df = pd.read_csv(dataset_path)
        # Encode categorical variables for training
        bug_map = {'increasing': 1, 'stable': 1, 'decreasing': 0}
        debt_map = {'high': 3, 'medium': 2, 'low': 1}
        df['bug_trend_num'] = df['bug_trend'].str.lower().map(lambda x: bug_map.get(x, 1))
        df['tech_debt_num'] = df['technical_debt'].str.lower().map(lambda x: debt_map.get(x, 2))
        X = df[['bug_trend_num', 'sprint_velocity', 'tech_debt_num', 'code_quality_index']]
        X.columns = ['bug_trend', 'sprint_velocity', 'technical_debt', 'code_quality_index']
        y = df['risk_score']
    else:
        print("Using default benchmark distribution.")
        data = {
            'bug_trend': [1, 0, 1, 0, 1, 0, 1, 0],
            'sprint_velocity': [35, 42, 30, 50, 25, 48, 20, 45],
            'technical_debt': [2, 1, 3, 1, 3, 1, 3, 1],
            'code_quality_index': [85, 92, 70, 95, 65, 90, 58, 86],
            'risk_score': [78, 45, 85, 30, 90, 28, 92, 37]
        }
        df = pd.DataFrame(data)
        X = df[['bug_trend', 'sprint_velocity', 'technical_debt', 'code_quality_index']]
        y = df['risk_score']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = LinearRegression()
    model.fit(X_train, y_train)

    model_path = Path(__file__).parent / 'risk_model.pkl'
    joblib.dump(model, model_path)
    print("Model training complete.")
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