"""
Train the real fraud detection model from the official Bank of Baroda hackathon dataset.
Uses ExtraTreesClassifier with SMOTE oversampling — replicating the notebook exactly.

Usage:
    python train_model.py

Reads:  ../../new ai model/Cleaned data.csv
Writes: ./fraud_model.pkl
"""

import os
import sys
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import ExtraTreesClassifier
from sklearn.metrics import accuracy_score, classification_report
from imblearn.over_sampling import SMOTE
import joblib


def main():
    # Locate the cleaned dataset
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
    csv_path = os.path.join(project_root, "new ai model", "Cleaned data.csv")

    if not os.path.exists(csv_path):
        print(f"ERROR: Dataset not found at: {csv_path}")
        sys.exit(1)

    print(f"Loading dataset from: {csv_path}")
    df = pd.read_csv(csv_path, index_col=0)
    print(f"Dataset shape: {df.shape}")
    print(f"Columns: {df.columns.tolist()}")

    # Verify target column exists
    if "F3924" not in df.columns:
        print("ERROR: Target column 'F3924' not found in dataset.")
        sys.exit(1)

    # Separate features and target
    x = df.drop(["F3924"], axis=1)
    y = df["F3924"]

    print(f"\nFeature columns ({len(x.columns)}): {x.columns.tolist()}")
    print(f"Target distribution:\n{y.value_counts()}")

    # Train/test split (stratified, same as notebook)
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.3, stratify=y, random_state=42
    )

    # SMOTE oversampling on training set
    print("\nApplying SMOTE oversampling...")
    smote = SMOTE(random_state=42, k_neighbors=5)
    x_train, y_train = smote.fit_resample(x_train, y_train)
    print(f"Post-SMOTE training shape: {x_train.shape}")

    # Train ExtraTreesClassifier (same hyperparams as notebook)
    print("\nTraining ExtraTreesClassifier...")
    model = ExtraTreesClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(x_train, y_train)

    # Evaluate
    y_pred_train = model.predict(x_train)
    y_pred_test = model.predict(x_test)

    train_acc = accuracy_score(y_train, y_pred_train)
    test_acc = accuracy_score(y_test, y_pred_test)

    print(f"\n{'='*50}")
    print(f"Training Accuracy: {train_acc:.6f}")
    print(f"Test Accuracy:     {test_acc:.6f}")
    print(f"{'='*50}")

    print("\nTest Classification Report:")
    print(classification_report(y_test, y_pred_test))

    # Save model
    model_path = os.path.join(script_dir, "fraud_model.pkl")
    joblib.dump(model, model_path)
    print(f"\nModel saved to: {model_path}")
    print(f"Model file size: {os.path.getsize(model_path) / 1024 / 1024:.2f} MB")

    # Save the expected feature column order for reference
    columns_path = os.path.join(script_dir, "feature_columns.txt")
    with open(columns_path, "w") as f:
        for col in x.columns.tolist():
            f.write(col + "\n")
    print(f"Feature columns saved to: {columns_path}")


if __name__ == "__main__":
    main()
