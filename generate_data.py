import pandas as pd
import numpy as np
import os

def generate_hr_data(num_records=8000):
    """
    Generates synthetic HR data based on the SRS requirements.
    Supports 8,000+ observations as per Section 7.2.
    """
    np.random.seed(42)
    
    data = {
        'Employee_ID': [f'EMP_{i:05d}' for i in range(1, num_records + 1)],
        'Department': np.random.choice(['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'], num_records),
        'Tenure_Years': np.round(np.random.uniform(0.5, 15.0, num_records), 1),
        
        # Payroll
        'Base_Salary': np.random.uniform(60000, 150000, num_records),
        'Pay_Range_Midpoint': np.random.uniform(70000, 140000, num_records), # Will be used for Compa-Ratio
        
        # Time and Attendance
        'Overtime_Hours': np.random.uniform(0, 50, num_records),
        'Standard_Hours': np.full(num_records, 160), # Monthly standard hours
        'Unplanned_Absences': np.random.uniform(0, 10, num_records),
        'Available_Days': np.full(num_records, 20), # Monthly available days
        
        # Productivity Inputs
        'Time_Valid': np.random.uniform(100, 160, num_records),
        'Time_Target': np.full(num_records, 160),
        'Focus_Quality': np.random.uniform(0.4, 1.0, num_records),
        'Tool_Friction': np.random.uniform(0.0, 0.5, num_records),
        'Business_Deliverables': np.random.uniform(0.5, 1.0, num_records),
        
        # Performance & Revenue
        'Performance_Rating': np.random.uniform(1.0, 5.0, num_records),
        'Total_Revenue_Generated': np.random.uniform(10000, 100000, num_records),
        'FTE': np.full(num_records, 1.0)
    }
    
    df = pd.DataFrame(data)
    
    # Introduce correlation for target variable 'Separated' (Attrition)
    # Higher overtime, lower compa-ratio, higher absenteeism -> higher risk
    
    otr = df['Overtime_Hours'] / df['Standard_Hours']
    cr = df['Base_Salary'] / df['Pay_Range_Midpoint']
    
    # Log-odds
    z = -3.0 + (otr * 10) - (cr * 2) + (df['Tool_Friction'] * 3) - (df['Performance_Rating'] * 0.5)
    
    # Sigmoid to probability
    prob_separation = 1 / (1 + np.exp(-z))
    
    # Generate binary outcome
    df['Separated'] = np.random.binomial(1, prob_separation)
    
    # Ensure directory exists (if saving to a specific folder)
    output_dir = 'data'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    output_path = os.path.join(output_dir, 'hr_administrative_records.csv')
    df.to_csv(output_path, index=False)
    print(f"Generated {num_records} records and saved to {output_path}")

if __name__ == "__main__":
    generate_hr_data()
