# Enterprise Workforce Analytics & Predictive Talent Retention System

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.3%2B-orange.svg)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Completed-brightgreen.svg)]()

> An end-to-end predictive human capital analytics platform designed to forecast attrition risk, diagnose operational burnout, and trigger prescriptive retention interventions across enterprise workforces.

---

## 📌 Executive Summary

Organizations often struggle with reactive human capital management—relying on static headcount reporting and retrospective exit interviews after top performers have already separated. 

This system transitions HR operations from **descriptive reporting** to **decision-ready predictive intelligence**. By fusing multi-source administrative records (Payroll, ATS, LMS, Time & Attendance), calculating behavioral KPIs, and applying unpenalized binary logistic regression, the system proactively detects flight risk ($P > 0.70$) and provides tailored, actionable retention playbooks.

---

## 🏛️ System Architecture

```
                               ┌─────────────────────────────────┐
                               │     Integrated Data Sources     │
                               │  (Payroll, ATS, LMS, Attendance)│
                               └────────────────┬────────────────┘
                                                │
                                                ▼
                               ┌─────────────────────────────────┐
                               │  Data Pipeline & Preprocessing  │
                               │  (Cleansing, Standardization,   │
                               │    KPI Mathematical Modeling)   │
                               └────────────────┬────────────────┘
                                                │
                                                ▼
                               ┌─────────────────────────────────┐
                               │ Machine Learning Engine (Python)│
                               │ • Unpenalized Logistic Reg.     │
                               │ • Newton-CG Optimization (MLE)  │
                               │ • Recall Prioritization         │
                               └───────┬─────────────────┬───────┘
                                       │                 │
                   Serialized Model    │                 │ Direct Scoring
               (retention_model.pkl)   │                 │
                                       ▼                 ▼
             ┌───────────────────────────────┐   ┌──────────────────────────────┐
             │      TabPy & Tableau BI       │   │  3-Tier Web Dashboard        │
             │   Real-Time SCRIPT_REAL       │   │  • Tier 1: Executive C-Suite │
             │      Dynamic Vector Scoring   │   │  • Tier 2: Mid-Level Managers│
             └───────────────────────────────┘   │  • Tier 3: Talent Retention  │
                                                 └──────────────────────────────┘
```

---

## 📊 Quantitative KPI Formulations

The platform computes core organizational health metrics based on rigorous mathematical specifications:

| Metric Name | Mathematical Definition | Benchmark | Operational Significance |
|:---|:---|:---|:---|
| **Attrition Rate ($AR$)** | $\left( \frac{N_{\text{separations}}}{H_{\text{avg}}} \right) \times 100$ | $10.0\% - 12.0\%$ | Primary barometer of organizational stability and turnover velocity. |
| **Overtime Ratio ($OTR$)** | $\left( \frac{H_{\text{overtime}}}{H_{\text{standard}}} \right) \times 100$ | $< 10.0\%$ | Leading stress indicator isolating capacity bottlenecks and burnout risk. |
| **Compa-Ratio ($CR$)** | $\frac{\text{Actual Base Salary}}{\text{Pay Range Midpoint}}$ | $0.90 - 1.10$ | Pay equity barometer; values $< 0.90$ flag severe market vulnerability. |
| **Absenteeism Rate ($ABR$)** | $\left( \frac{D_{\text{unplanned}}}{D_{\text{available}}} \right) \times 100$ | $2.0\% - 3.6\%$ | Captures lost labor time; early signal of employee disengagement. |
| **Revenue per FTE ($RPE$)** | $\frac{\text{Total Enterprise Revenue}}{H_{\text{FTE}}}$ | $>\$300\text{k}$ | Evaluates labor capital efficiency against top-line output. |

### Weighted Composite Productivity Index ($PI$)
To synthesize behavioral and operational throughput into a unified metric:
$$PI = w_1 \cdot \left(\frac{T_{\text{valid}}}{T_{\text{target}}}\right) + w_2 \cdot F_{\text{quality}} + w_3 \cdot (1 - \text{Tool}_{\text{friction}}) + w_4 \cdot \left(\frac{O_{\text{achieved}}}{O_{\text{expected}}}\right)$$

* $w_1 = 0.30$ (Time Fidelity): Validated active time relative to goal thresholds.
* $w_2 = 0.30$ (Focus Quality): Ratio of deep-work sessions versus context-switching.
* $w_3 = 0.20$ (Tool Friction): Systemic software latency and operational overhead.
* $w_4 = 0.20$ (Business Deliverables): Normalized completion of targeted outputs.

---

## 🤖 Predictive Modeling & ML Engine

### 1. Binary Logistic Regression Framework
Attrition ($Y=1$ for separation, $Y=0$ for retention) is modeled via a sigmoid activation function mapping log-odds ($z$) to probability space $P \in (0, 1)$:
$$P(Y=1|\mathbf{X}) = \frac{1}{1 + e^{-z}}, \quad z = \beta_0 + \sum_{i=1}^{k} \beta_i X_i$$

### 2. Statistical Specification
* **Optimization**: Maximum Likelihood Estimation (MLE) using the unpenalized `newton-cg` solver (`penalty=None`).
* **Odds Ratio Interpretation**: Multiplicative change in odds per unit change ($OR_i = e^{\beta_i}$).
* **Evaluation Prioritization**: The loss matrix explicitly optimizes for **Recall** ($\frac{TP}{TP + FN}$), minimizing False Negatives because the replacement cost of an unplanned departure is $1.5\times - 2.0\times$ their annual salary.

---

## 🖥️ Three-Tier Interactive Dashboard

The client interface is designed according to the light-theme design specifications (`FRONTEND_SPEC.md`):

1. **Tier 1: Executive Overview (C-Suite)**
   - Macro KPIs: Total Headcount, Annualized Attrition vs. Cap, Productivity Index, and Revenue per FTE.
   - Interactive trend line chart tracking monthly attrition against enterprise caps.
2. **Tier 2: Departmental Intersectional Analysis (Mid-Level Managers)**
   - High-density scatter plot comparing **Overtime Hours vs. Performance Ratings**.
   - Pinpoints high performers in the "Burnout Zone" (high overtime, high rating).
3. **Tier 3: Risk & Prescriptive Action (Talent Retention Teams)**
   - Granular roster highlighting flight-risk individuals ($P > 0.70$).
   - Automated playbook recommendation engine based on driver diagnostics:
     - **Workload Redistribution**: Capping overtime at $10\%$ when $OTR > 18\%$.
     - **Targeted Compensation Alignment**: Salary adjustment toward $0.95 - 1.05$ midpoint when $CR < 0.88$ and $P > 0.60$.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- A modern web browser (Chrome, Edge, Firefox, Safari)

### 1. Clone the Repository
```bash
git clone https://github.com/chaitanya2190/enterprise-workforce-analytics.git
cd enterprise-workforce-analytics
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Generate Enterprise Dataset (8,000+ Records)
```bash
python generate_data.py
```
Outputs synthetic HRIS records to `data/hr_administrative_records.csv`.

### 4. Train Predictive Model & Output Artifacts
```bash
python train_model.py
```
Calculates feature KPIs, executes logistic regression, evaluates confusion matrix metrics, and exports `retention_model.pkl` & `data/processed_hr_data.csv`.

### 5. Launch the Dashboard
Open `index.html` directly in your browser or serve it locally:
```bash
# Python built-in HTTP server (optional)
python -m http.server 8000
```
Then navigate to `http://localhost:8000`.

---

## 🔗 TabPy Integration (Tableau)

For enterprise BI deployment, dynamic feature vectors can be scored in real-time within Tableau using `SCRIPT_REAL`:

```python
import pickle
import numpy as np

with open('retention_model.pkl', 'rb') as f:
    model = pickle.load(f)

# _arg1: Base_Salary, _arg2: Overtime_Ratio, _arg3: Compa_Ratio
X_input = np.column_stack([_arg1, _arg2, _arg3])
return model.predict_proba(X_input)[:, 1].tolist()
```

---

## 📁 Repository Structure

```
enterprise-workforce-analytics/
├── data/
│   ├── hr_administrative_records.csv   # Raw synthetic HRIS dataset (8,000 records)
│   └── processed_hr_data.csv           # Feature-engineered dataset with calculated KPIs
├── docs/
│   ├── FRONTEND_SPEC.md                # Comprehensive UI/UX & design system spec
│   └── PROJECT_REPORT.md               # End-to-end architecture & project report
├── generate_data.py                    # Multi-source HR data generator
├── index.html                          # 3-Tier analytics dashboard UI
├── requirements.txt                    # Project dependencies
├── retention_model.pkl                 # Pre-trained Scikit-Learn retention model
├── script.js                           # Dashboard interactivity & Chart.js logic
├── styles.css                          # Custom light-theme CSS tokens & responsive layout
├── tabpy_integration.py                # Tableau TabPy deployment module
└── train_model.py                      # Model training, evaluation & KPI pipeline
```

---

## ⚖️ Ethics, Compliance & Non-Functional Guarantees
- **Adverse Impact Analysis**: System incorporates the EEOC $4/5^{\text{ths}}$ rule to verify non-discriminatory outcome distribution across protected demographics.
- **Data Privacy**: Strictly role-partitioned views ensuring individual flight-risk scores are restricted to authorized Talent Retention personnel.
- **NLRA Section 7 Compliance**: Balances passive productivity telemetry with employee trust and legal requirements.

---

## 👤 Author
**Sri Krishna (Chaitanya)**
- GitHub: [@chaitanya2190](https://github.com/chaitanya2190)
