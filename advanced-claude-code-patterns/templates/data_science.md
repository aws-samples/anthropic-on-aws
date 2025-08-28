# CLAUDE.md - Data Science & Machine Learning Project

This CLAUDE.md template is optimized for data science, machine learning, and AI projects using Python, Jupyter, and popular ML frameworks.

## Project Overview

This is a data science/ML project focused on [describe your specific use case]. Claude Code will assist with data analysis, model development, experiment tracking, and deployment.

## Project Structure

```
.
├── data/                      # Data directory
│   ├── raw/                   # Original, immutable data
│   ├── processed/             # Cleaned, transformed data
│   ├── interim/               # Intermediate data
│   └── external/              # External data sources
├── notebooks/                 # Jupyter notebooks
│   ├── exploratory/           # EDA and experiments
│   ├── modeling/              # Model development
│   └── evaluation/            # Results and analysis
├── src/                       # Source code
│   ├── data/                  # Data loading and processing
│   ├── features/              # Feature engineering
│   ├── models/                # Model definitions
│   ├── training/              # Training scripts
│   ├── evaluation/            # Evaluation metrics
│   └── visualization/         # Plotting utilities
├── models/                    # Trained models
│   ├── experiments/           # Experiment artifacts
│   └── production/            # Production-ready models
├── configs/                   # Configuration files
│   ├── model_config.yaml      # Model hyperparameters
│   └── data_config.yaml       # Data processing settings
├── requirements.txt           # Python dependencies
├── environment.yml            # Conda environment
└── mlflow/                    # MLflow tracking (if used)
```

## Commands and Workflows

### Environment Setup
```bash
# Create conda environment
conda env create -f environment.yml
conda activate ml-project

# Or using pip
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Data Processing
```bash
# Download and prepare data
python src/data/download_data.py
python src/data/preprocess.py --input data/raw --output data/processed

# Feature engineering
python src/features/build_features.py

# Data validation
great_expectations checkpoint run data_quality
```

### Model Development
```bash
# Train model
python src/training/train.py --config configs/model_config.yaml

# Hyperparameter tuning
python src/training/tune.py --trials 100

# Cross-validation
python src/training/cross_validate.py --folds 5

# Evaluate model
python src/evaluation/evaluate.py --model models/latest
```

### Experiment Tracking
```bash
# Start MLflow UI
mlflow ui --port 5000

# Track with Weights & Biases
wandb login
python train.py --track-wandb

# TensorBoard
tensorboard --logdir logs/
```

## Code Style Guidelines

### Python Data Science Conventions
```python
# Import order
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
import torch  # or tensorflow

# Type hints for data science
from typing import Tuple, Optional
import pandas as pd
import numpy.typing as npt

def preprocess_data(
    df: pd.DataFrame,
    target_col: str
) -> Tuple[npt.NDArray, npt.NDArray]:
    """Preprocess data for model training."""
    pass
```

### Notebook Best Practices
- Clear narrative structure with markdown cells
- Modular code in functions, not just scripts
- Save intermediate results to avoid re-running
- Version control notebooks with clear outputs
- Use notebook templates for consistency

### Data Handling
```python
# Always preserve raw data
df_raw = pd.read_csv("data/raw/dataset.csv")
df = df_raw.copy()  # Work on copy

# Explicit about data types
df['date'] = pd.to_datetime(df['date'])
df['category'] = df['category'].astype('category')

# Handle missing values explicitly
df['column'].fillna(df['column'].median(), inplace=True)
```

## Model Development Guidelines

### Experiment Structure
```python
# configs/experiment.yaml
experiment:
  name: "baseline_model_v1"
  description: "Initial baseline with default hyperparameters"
  
model:
  type: "RandomForest"
  parameters:
    n_estimators: 100
    max_depth: 10
    random_state: 42

data:
  train_split: 0.7
  val_split: 0.15
  test_split: 0.15
  
metrics:
  - accuracy
  - precision
  - recall
  - f1
  - roc_auc
```

### Model Training Template
```python
class ModelTrainer:
    """Standard model training interface."""
    
    def __init__(self, config: dict):
        self.config = config
        self.model = self._build_model()
        
    def train(self, X_train, y_train, X_val, y_val):
        """Train model with validation."""
        # Training logic
        pass
        
    def evaluate(self, X_test, y_test) -> dict:
        """Evaluate model performance."""
        # Return metrics dict
        pass
        
    def save(self, path: str):
        """Save model and metadata."""
        # Include preprocessing steps
        pass
```

## Testing Requirements

### Data Quality Tests
```python
# tests/test_data_quality.py
def test_no_missing_critical_columns(df):
    """Critical columns should have no missing values."""
    critical_cols = ['id', 'target', 'date']
    for col in critical_cols:
        assert df[col].isna().sum() == 0

def test_data_types(df):
    """Verify expected data types."""
    assert df['date'].dtype == 'datetime64[ns]'
    assert pd.api.types.is_numeric_dtype(df['amount'])
```

### Model Tests
```python
# tests/test_models.py
def test_model_predictions_shape(model, X_test):
    """Model outputs correct shape."""
    predictions = model.predict(X_test)
    assert predictions.shape[0] == X_test.shape[0]

def test_model_performance_threshold(model, X_test, y_test):
    """Model meets minimum performance."""
    score = model.score(X_test, y_test)
    assert score > 0.75  # Minimum acceptable score
```

## Custom Claude Code Configuration

### Agents for This Project
- `data-analyst`: Exploratory data analysis and insights
- `model-optimizer`: Hyperparameter tuning and architecture search
- `experiment-tracker`: Manage ML experiments and results
- `deployment-agent`: Package and deploy models

### Hooks for ML Workflows
```json
{
  "hooks": {
    "pre-training": {
      "actions": ["validate-data", "check-gpu", "log-experiment"]
    },
    "post-training": {
      "actions": ["evaluate-model", "save-artifacts", "update-leaderboard"]
    },
    "pre-deployment": {
      "actions": ["test-model", "validate-performance", "check-resources"]
    }
  }
}
```

### Recommended MCP Servers
```bash
# Jupyter notebook interaction
claude mcp add jupyter --env JUPYTER_TOKEN=${JUPYTER_TOKEN}

# Database for feature store
claude mcp add postgres --env DATABASE_URL=${DATABASE_URL}

# Cloud storage for datasets
claude mcp add s3 --env AWS_ACCESS_KEY=${AWS_ACCESS_KEY}
```

## Data Pipeline

### ETL Process
```python
# src/data/pipeline.py
from prefect import flow, task

@task
def extract_data(source: str) -> pd.DataFrame:
    """Extract data from source."""
    pass

@task
def transform_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and transform data."""
    pass

@task
def load_data(df: pd.DataFrame, destination: str):
    """Load data to destination."""
    pass

@flow
def data_pipeline():
    """Complete ETL pipeline."""
    raw_data = extract_data("source")
    processed_data = transform_data(raw_data)
    load_data(processed_data, "destination")
```

## Model Deployment

### Deployment Options
1. **REST API**: FastAPI + Docker
2. **Batch Processing**: Airflow + Kubernetes
3. **Real-time**: Kafka + TensorFlow Serving
4. **Edge Deployment**: ONNX + Mobile/IoT

### Model Serving Template
```python
# src/serving/api.py
from fastapi import FastAPI
import joblib

app = FastAPI()
model = joblib.load("models/production/model.pkl")

@app.post("/predict")
async def predict(features: dict):
    """Make prediction."""
    prediction = model.predict([features])
    return {"prediction": prediction.tolist()}
```

## Performance Optimization

### Data Processing
- Use vectorized operations (NumPy, Pandas)
- Leverage Dask for larger-than-memory datasets
- GPU acceleration with RAPIDS
- Efficient data formats (Parquet, Feather)

### Model Training
- Mixed precision training
- Gradient accumulation for large batches
- Early stopping to prevent overfitting
- Model pruning and quantization

### Inference Optimization
- Model caching
- Batch predictions
- ONNX conversion for speed
- TensorRT for GPU inference

## Monitoring and Maintenance

### Model Monitoring
```python
# Track model performance
metrics_to_track = {
    "accuracy": 0.95,
    "latency_p95": 100,  # ms
    "daily_predictions": 10000,
    "drift_score": 0.1
}

# Data drift detection
from evidently import ColumnDriftMetric
drift_report = Report(metrics=[
    ColumnDriftMetric(column_name="feature_1"),
])
```

### Retraining Strategy
- Schedule: Weekly/Monthly based on data volume
- Trigger: Performance degradation > 5%
- Data requirements: Minimum 1000 new samples
- Validation: A/B testing before full deployment

## Visualization Standards

```python
# Consistent plotting style
import matplotlib.pyplot as plt
import seaborn as sns

plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

# Standard figure size
fig, ax = plt.subplots(figsize=(10, 6))

# Always label axes
ax.set_xlabel('Feature', fontsize=12)
ax.set_ylabel('Target', fontsize=12)
ax.set_title('Clear, Descriptive Title', fontsize=14)

# Save high-resolution
plt.savefig('figures/plot.png', dpi=300, bbox_inches='tight')
```

## Environment Variables

```bash
# Data sources
DATA_PATH=/path/to/data
S3_BUCKET=my-ml-data
DATABASE_URL=postgresql://localhost/features

# Model registry
MLFLOW_TRACKING_URI=http://localhost:5000
WANDB_API_KEY=xxx
NEPTUNE_API_TOKEN=xxx

# Compute resources
CUDA_VISIBLE_DEVICES=0,1
NUM_WORKERS=4
BATCH_SIZE=32

# API keys for data sources
KAGGLE_USERNAME=xxx
KAGGLE_KEY=xxx
HF_TOKEN=xxx  # Hugging Face
```

## Common Tasks

### Adding New Features
1. Implement in `src/features/feature_engineering.py`
2. Update feature configuration
3. Validate feature importance
4. Test impact on model performance
5. Document feature logic

### Running Experiments
1. Define experiment config
2. Run training with tracking
3. Compare results in MLflow/W&B
4. Document findings in notebook
5. Version control best model

## Resources

- [Scikit-learn Best Practices](https://scikit-learn.org/stable/developers/develop.html)
- [PyTorch Performance Tuning](https://pytorch.org/tutorials/recipes/recipes/tuning_guide.html)
- [Google's ML Best Practices](https://developers.google.com/machine-learning/guides/rules-of-ml)
- [DVC for Data Version Control](https://dvc.org/)

## Notes for Claude Code

When working on this project:
- Always set random seeds for reproducibility
- Document data assumptions and limitations
- Track all experiments with proper versioning
- Validate data quality before training
- Use appropriate metrics for the problem type
- Consider fairness and bias in models
- Profile code for performance bottlenecks
- Keep notebooks clean and well-documented