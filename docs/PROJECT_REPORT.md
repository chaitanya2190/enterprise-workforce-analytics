# Project Report: Enterprise Workforce Analytics & Predictive Talent Retention System

## 1. Executive Summary
The **Predictive Talent Retention System** is designed to transition organizational human capital management from static headcount tracking to a dynamic, predictive analytics framework. Based on the provided Software Requirements Specification (SRS), this system proactively forecasts retention risks and optimizes labor allocation by transforming raw administrative records into actionable intelligence.

## 2. System Architecture
The project is built as an end-to-end analytics pipeline consisting of three primary components:
1. **Data Pipeline (Python/Pandas)**: Synthesizes and cleanses HRIS data (Payroll, ATS, LMS, Time-and-Attendance).
2. **Machine Learning Engine (Scikit-Learn)**: Executes multivariate exploratory data analysis and binary classification to predict attrition.
3. **Interactive Dashboard (HTML/CSS/JS/Chart.js)**: A three-tier visualization platform for stakeholders ranging from C-Suite executives to Talent Retention teams.

---

## 3. Data Pipeline & KPI Formulations
To simulate a real-world enterprise environment, a data generator (`generate_data.py`) was created to yield 8,000 synthetic employee records. 

The pipeline computes several mission-critical KPIs based on precise mathematical definitions:
* **Overtime Ratio (OTR)**: `Overtime_Hours / Standard_Hours`. Isolates work stress; a leading indicator of burnout.
* **Compa-Ratio (CR)**: `Base_Salary / Pay_Range_Midpoint`. Measures internal equity versus market benchmarks.
* **Absenteeism Rate (ABR)**: `Unplanned_Absences / Available_Days`. Captures lost labor time and disengagement.
* **Weighted Composite Productivity Index (PI)**: Synthesizes behavioral and operational inputs (Time Fidelity, Focus Quality, Tool Friction, and Business Deliverables) into a single normalized score.

---

## 4. Machine Learning & Predictive Modeling
The predictive core is implemented in `train_model.py` using a **Binary Logistic Regression Framework**.

* **Objective**: Predict employee separation ($Y=1$).
* **Model Configuration**: To match the unpenalized statistical inference of Statsmodels as requested by the SRS, the scikit-learn model is configured with `penalty=None` and the `newton-cg` solver.
* **Evaluation Strategy**: The model outputs a Confusion Matrix prioritizing **Recall** to minimize False Negatives. The organizational cost of replacing a missed at-risk employee is quantified as 1.5x – 2.0x their annual salary.
* **Production Integration**: The trained model is serialized into `retention_model.pkl` and can be queried in real-time by Tableau via TabPy (`tabpy_integration.py`).

---

## 5. Three-Tier Dashboard Interface
A responsive, dark-theme web dashboard was developed to surface insights tailored to specific organizational personas.

### Tier 1: Executive Overview
* **Audience**: C-Suite Leadership.
* **Metrics**: Macro-level indicators including Total Headcount, Annualized Attrition (vs. Target Caps), Macro Productivity Index, and Revenue per FTE.
* **Visuals**: Year-to-Date (YTD) Attrition Trend line chart comparing actuals against target caps.

### Tier 2: Departmental Intersectional Analysis
* **Audience**: Mid-level Managers.
* **Visuals**: A scatter plot comparing *Overtime Hours* vs. *Performance Ratings*. This specific visualization identifies clusters of high-performing employees who are highly susceptible to burnout (High Overtime + High Performance).

### Tier 3: Risk & Prescriptive Action
* **Audience**: Talent Retention Teams.
* **Functionality**: A granular table surfacing individuals with a risk probability $P > 0.70$.
* **Playbooks**: It recommends automated prescriptive interventions such as *Workload Redistribution* (capping OT) or *Targeted Compensation Alignment* (adjusting salaries towards market ranges for high-performers with low Compa-Ratios).

---

## 6. Conclusion & Future Roadmap
This project successfully establishes the foundational blueprint for a predictive HR analytics engine. 

**Next Steps for Deployment:**
1. **Real Data Integration**: Replace synthetic data with direct connections to live HRIS databases via REST APIs or SQL connectors.
2. **Framework Migration**: Migrate the vanilla HTML/JS dashboard to a robust frontend framework (like React or Next.js) or connect the TabPy script directly to a live Tableau Server environment.
3. **Continuous Training**: Implement automated CI/CD pipelines to retrain the logistic regression model on a scheduled cycle to capture evolving workforce behavioral patterns.
