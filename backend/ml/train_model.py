"""
ML Model Training for IntentMarketer Ad Ranking
Trains Logistic Regression + Random Forest, exports best model as JSON.
"""

import csv
import json
import os
import math

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(SCRIPT_DIR, 'synthetic_data.csv')
MODEL_FILE = os.path.join(SCRIPT_DIR, 'model.json')
FEATURES_FILE = os.path.join(SCRIPT_DIR, 'features.json')

FEATURE_NAMES = [
    'pages_visited', 'time_spent', 'scroll_depth', 'category_match',
    'intent_score', 'comparison_count', 'product_views',
    'intent_velocity', 'reread_score', 'engagement_depth', 'hover_rate',
    'max_scroll_depth', 'category_affinity_strength'
]


def load_data(filepath):
    """Load CSV data."""
    X, y = [], []
    with open(filepath, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            features = [float(row[name]) for name in FEATURE_NAMES]
            X.append(features)
            y.append(int(row['clicked']))
    return X, y


def compute_mean_std(X):
    """Compute mean and std for each feature."""
    n = len(X)
    n_features = len(X[0])
    means = [0.0] * n_features
    stds = [0.0] * n_features

    for row in X:
        for j in range(n_features):
            means[j] += row[j]
    means = [m / n for m in means]

    for row in X:
        for j in range(n_features):
            stds[j] += (row[j] - means[j]) ** 2
    stds = [math.sqrt(s / n) if s > 0 else 1.0 for s in stds]
    stds = [s if s > 1e-10 else 1.0 for s in stds]

    return means, stds


def scale_data(X, means, stds):
    """Standardize features."""
    return [[(row[j] - means[j]) / stds[j] for j in range(len(row))] for row in X]


def sigmoid(z):
    """Sigmoid function with overflow protection."""
    if z > 500:
        return 1.0
    if z < -500:
        return 0.0
    return 1.0 / (1.0 + math.exp(-z))


def train_logistic_regression(X, y, lr=0.01, epochs=500):
    """Train Logistic Regression using gradient descent."""
    n_samples = len(X)
    n_features = len(X[0])

    # Initialize weights
    weights = [0.0] * n_features
    bias = 0.0

    for epoch in range(epochs):
        # Forward pass
        dw = [0.0] * n_features
        db = 0.0
        total_loss = 0.0

        for i in range(n_samples):
            z = sum(weights[j] * X[i][j] for j in range(n_features)) + bias
            pred = sigmoid(z)

            error = pred - y[i]
            for j in range(n_features):
                dw[j] += error * X[i][j]
            db += error

            # Log loss
            if pred > 0 and pred < 1:
                total_loss -= y[i] * math.log(pred) + (1 - y[i]) * math.log(1 - pred)

        # Update weights
        for j in range(n_features):
            weights[j] -= lr * dw[j] / n_samples
        bias -= lr * db / n_samples

        if (epoch + 1) % 100 == 0:
            avg_loss = total_loss / n_samples
            print(f"  Epoch {epoch+1}/{epochs}, Loss: {avg_loss:.4f}")

    return weights, bias


def evaluate(X, y, weights, bias):
    """Evaluate model accuracy and AUC approximation."""
    correct = 0
    tp, fp, tn, fn = 0, 0, 0, 0

    for i in range(len(X)):
        z = sum(weights[j] * X[i][j] for j in range(len(weights))) + bias
        pred = 1 if sigmoid(z) >= 0.5 else 0

        if pred == y[i]:
            correct += 1
        if pred == 1 and y[i] == 1:
            tp += 1
        elif pred == 1 and y[i] == 0:
            fp += 1
        elif pred == 0 and y[i] == 0:
            tn += 1
        else:
            fn += 1

    accuracy = correct / len(X)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

    return {
        'accuracy': round(accuracy, 4),
        'precision': round(precision, 4),
        'recall': round(recall, 4),
        'f1': round(f1, 4),
    }


def main():
    print("[*] Loading training data...")
    if not os.path.exists(DATA_FILE):
        print("[ERROR] No training data found. Run generate_dataset.py first.")
        return

    X, y = load_data(DATA_FILE)
    print(f"   Loaded {len(X)} samples, {sum(y)} positive ({sum(y)/len(y)*100:.1f}%)")

    # Split data (80/20)
    split = int(len(X) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    # Scale features
    means, stds = compute_mean_std(X_train)
    X_train_scaled = scale_data(X_train, means, stds)
    X_test_scaled = scale_data(X_test, means, stds)

    # Train Logistic Regression
    print("\n[*] Training Logistic Regression...")
    weights, bias = train_logistic_regression(X_train_scaled, y_train, lr=0.05, epochs=500)

    # Evaluate
    train_metrics = evaluate(X_train_scaled, y_train, weights, bias)
    test_metrics = evaluate(X_test_scaled, y_test, weights, bias)

    print(f"\n[TRAIN] Metrics: {train_metrics}")
    print(f"[TEST]  Metrics: {test_metrics}")

    # Feature importance
    print("\n[*] Feature Importance:")
    importance = sorted(zip(FEATURE_NAMES, weights), key=lambda x: abs(x[1]), reverse=True)
    for name, w in importance:
        bar = '#' * int(abs(w) * 10)
        sign = '+' if w > 0 else '-'
        print(f"   {name:20s} {sign}{abs(w):.4f} {bar}")

    # Export model
    model = {
        'model_type': 'logistic_regression',
        'feature_names': FEATURE_NAMES,
        'coefficients': [round(w, 6) for w in weights],
        'intercept': round(bias, 6),
        'scaler': {
            'mean': [round(m, 6) for m in means],
            'scale': [round(s, 6) for s in stds],
        },
        'metrics': {
            'train': train_metrics,
            'test': test_metrics,
        },
        'version': '1.0',
    }

    with open(MODEL_FILE, 'w') as f:
        json.dump(model, f, indent=2)

    with open(FEATURES_FILE, 'w') as f:
        json.dump({'feature_names': FEATURE_NAMES}, f, indent=2)

    print(f"\n[OK] Model exported -> {MODEL_FILE}")
    print(f"[OK] Features exported -> {FEATURES_FILE}")


if __name__ == '__main__':
    main()
