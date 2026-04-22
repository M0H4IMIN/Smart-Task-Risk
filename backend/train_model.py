"""
Run this once from the backend folder:
    python train_model.py

Generates synthetic data, trains the model, saves risk_model.pkl
"""
import numpy as np
import pickle
import os
import csv
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from features import FEATURE_NAMES

np.random.seed(42)
N = 2000


def generate_data(n):
    X, y, rows = [], [], []
    for _ in range(n):
        priority             = int(np.random.choice([1,2,3,4], p=[0.2,0.4,0.3,0.1]))
        days_until_deadline  = round(float(np.random.uniform(0, 30)), 2)
        hours_remaining      = round(float(np.random.uniform(0, 1)), 4)
        deadline_pressure    = round(float(np.random.uniform(0, 10)), 4)
        session_count        = int(np.random.randint(0, 20))
        days_since_active    = int(np.random.randint(0, 15))
        user_completion_rate = round(float(np.random.uniform(0, 1)), 4)
        user_abandon_rate    = round(float(np.random.uniform(0, 0.6)), 4)
        category_rate        = round(float(np.random.uniform(0, 1)), 4)
        avg_pauses           = round(float(np.random.uniform(0, 8)), 4)
        effort_accuracy      = round(float(np.random.uniform(0.5, 2.5)), 4)
        avg_session_dur      = round(float(np.random.uniform(0, 120)), 4)

        risk  = (deadline_pressure / 10)        * 0.25
        risk += (1 - user_completion_rate)       * 0.20
        risk += hours_remaining                  * 0.15
        risk += (days_since_active / 15)         * 0.15
        risk += (user_abandon_rate / 0.6)        * 0.10
        risk += (1 - category_rate)              * 0.08
        risk += ((priority - 1) / 3)             * 0.04
        risk += min(effort_accuracy / 2.5, 1.0)  * 0.03
        risk += float(np.random.normal(0, 0.07))
        risk  = float(np.clip(risk, 0, 1))
        label = 1 if risk > 0.5 else 0

        row = [priority, days_until_deadline, hours_remaining, deadline_pressure,
               session_count, days_since_active, user_completion_rate, user_abandon_rate,
               category_rate, avg_pauses, effort_accuracy, avg_session_dur, label]
        X.append(row[:-1])
        y.append(label)
        rows.append(row)

    return np.array(X), np.array(y), rows


def save_csv(rows):
    out = os.path.join(os.path.dirname(__file__), "..", "dataset")
    os.makedirs(out, exist_ok=True)
    path = os.path.join(out, "synthetic_task_dataset.csv")
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(FEATURE_NAMES + ["label_at_risk"])
        w.writerows(rows)
    print(f"  Dataset saved → {os.path.abspath(path)}")


def train():
    print("=" * 50)
    print("  Smart Task Risk — Model Training")
    print("=" * 50)

    print("\n[1/3] Generating 2000 synthetic samples...")
    X, y, rows = generate_data(N)
    save_csv(rows)
    print(f"  At-risk: {sum(y)} | On-track: {N - sum(y)}")

    print("\n[2/3] Training Random Forest...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestClassifier(
        n_estimators=150, max_depth=8,
        min_samples_leaf=5, random_state=42,
        class_weight="balanced"
    )
    model.fit(X_train, y_train)

    print("\n[3/3] Evaluation:")
    print(classification_report(y_test, model.predict(X_test), target_names=["on-track","at-risk"]))

    print("Feature importances:")
    for name, imp in sorted(zip(FEATURE_NAMES, model.feature_importances_), key=lambda x: -x[1]):
        print(f"  {name:<30} {'█' * int(imp*50)} {imp:.3f}")

    with open("risk_model.pkl", "wb") as f:
        pickle.dump(model, f)
    print("\nModel saved → risk_model.pkl")
    print("=" * 50)


if __name__ == "__main__":
    train()
