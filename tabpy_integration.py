import pickle
import numpy as np

# This is an example snippet representing the SCRIPT_REAL calculation in Tableau via TabPy
# It expects _arg1 (Salary), _arg2 (OvertimeRatio), _arg3 (CompaRatio) from Tableau.

def tabpy_retention_scoring(_arg1, _arg2, _arg3):
    """
    5.1 Real-Time Scoring with TabPy
    The system shall integrate Python scripts within Tableau using SCRIPT_REAL.
    Dynamic feature vectors are passed via _arg mapping to a serialized Scikit-learn model.
    """
    # Deserialization of the pre-trained model
    # Note: Ensure the path to retention_model.pkl is absolute or correct relative to TabPy server
    with open('retention_model.pkl', 'rb') as f:
        model = pickle.load(f)
        
    # Mapping dynamic features from Tableau
    # _arg1: Salary, _arg2: OvertimeRatio, _arg3: CompaRatio
    X_input = np.column_stack([_arg1, _arg2, _arg3])
    
    # Return the probability of attrition (Y=1)
    return model.predict_proba(X_input)[:, 1].tolist()
