import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, classification_report
import pickle
import os

def process_and_train():
    data_path = 'data/hr_administrative_records.csv'
    if not os.path.exists(data_path):
        print("Data not found. Please run generate_data.py first.")
        return
        
    df = pd.read_csv(data_path)
    
    # --- 3.1 Core Metric Definitions (KPI Formulations) ---
    # Overtime Ratio (OTR)
    df['Overtime_Ratio'] = df['Overtime_Hours'] / df['Standard_Hours']
    
    # Compa-Ratio (CR)
    df['Compa_Ratio'] = df['Base_Salary'] / df['Pay_Range_Midpoint']
    
    # Absenteeism Rate (ABR)
    df['Absenteeism_Rate'] = df['Unplanned_Absences'] / df['Available_Days']
    
    # Revenue per FTE (RPE) - optional feature
    df['Revenue_per_FTE'] = df['Total_Revenue_Generated'] / df['FTE']
    
    # --- 3.2 Weighted Composite Productivity Index (PI) ---
    w1, w2, w3, w4 = 0.30, 0.30, 0.20, 0.20
    df['Productivity_Index'] = (
        w1 * (df['Time_Valid'] / df['Time_Target']) +
        w2 * df['Focus_Quality'] +
        w3 * (1 - df['Tool_Friction']) +
        w4 * df['Business_Deliverables']
    )
    
    # Features for the model
    features = ['Base_Salary', 'Overtime_Ratio', 'Compa_Ratio']
    X = df[features]
    y = df['Separated']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # --- 4.1 Logistic Regression Framework ---
    # As per 4.4, match statsmodels' unpenalized results by setting penalty=None (or 'none' in older sklearn)
    # Using newton-cg solver
    model = LogisticRegression(penalty=None, solver='newton-cg', max_iter=1000)
    model.fit(X_train, y_train)
    
    # Predictions
    y_pred = model.predict(X_test)
    
    # --- 4.3 Model Evaluation Metrics ---
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    print("--- Model Evaluation (Confusion Matrix) ---")
    print(f"True Positive (TP) - At-risk correctly flagged: {tp}")
    print(f"False Positive (FP) - Stable falsely flagged: {fp}")
    print(f"True Negative (TN) - Stable correctly identified: {tn}")
    print(f"False Negative (FN) - At-risk missed: {fn}")
    
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    print(f"\nRecall (Prioritized Metric): {recall:.2%}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save the model
    with open('retention_model.pkl', 'wb') as f:
        pickle.dump(model, f)
        
    print("Model saved to retention_model.pkl")
    
    # Save processed data for Dashboard
    df.to_csv('data/processed_hr_data.csv', index=False)

if __name__ == "__main__":
    process_and_train()
