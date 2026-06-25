# Clinical Trial Matching Agent

An AWS reference implementation that uses the [Strands Agents SDK](https://github.com/strands-agents/sdk-python) with **Claude Sonnet 4** on [Amazon Bedrock](https://aws.amazon.com/bedrock/) to match synthetic patient profiles against real, currently-recruiting clinical trials from [ClinicalTrials.gov](https://clinicaltrials.gov/).

The agent orchestrates four purpose-built tools to fetch patient data, search live trials, retrieve detailed eligibility criteria from a Knowledge Base, and evaluate per-criterion eligibility with structured reasoning — all from a Jupyter notebook you can run end-to-end.

> **⚠️ Disclaimer:** This project is for **illustrative and educational purposes only**. It uses entirely synthetic patient data and is **not intended for real clinical decision-making**. All patient profiles are fictional. A qualified physician must verify eligibility before any clinical trial enrollment decisions are made.

## Scenario

Matching patients to clinical trials is a complex, time-intensive process. Clinicians must cross-reference a patient's medical history, biomarkers, and demographics against hundreds of eligibility criteria across thousands of active studies.

This sample demonstrates how **agentic AI** can assist with that workflow:

1. A synthetic patient profile is provided (e.g., 52-year-old female with HER2+ breast cancer)
2. The agent searches ClinicalTrials.gov for currently recruiting studies
3. For each candidate trial, the agent evaluates every inclusion/exclusion criterion
4. Results are ranked by match score and returned with per-criterion reasoning

The agent uses **deterministic business logic** for verdict aggregation and borderline detection — the LLM reasons about individual criteria, but the final eligibility verdict is computed by fixed rules for testability and safety.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Jupyter Notebook                              │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Strands Agent                               │  │
│  │              (Claude Sonnet 4 on Bedrock)                     │  │
│  │                                                               │  │
│  │  System Prompt: workflow, safety rules, output contract        │  │
│  └──────────┬──────────┬──────────────┬──────────────┬───────────┘  │
│             │          │              │              │               │
│     ┌───────▼──┐  ┌───▼────────┐  ┌──▼───────┐  ┌──▼────────────┐  │
│     │get_patient│  │search_trials│  │retrieve_ │  │evaluate_      │  │
│     │_profile   │  │            │  │trial_kb  │  │eligibility    │  │
│     └───────┬───┘  └───┬────────┘  └──┬───────┘  └──┬────────────┘  │
│             │          │              │              │               │
└─────────────┼──────────┼──────────────┼──────────────┼───────────────┘
              │          │              │              │
              ▼          ▼              ▼              ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
       │In-Memory │ │ClinicalTr│ │Bedrock   │ │Bedrock       │
       │Patient   │ │ials.gov  │ │Knowledge │ │Runtime       │
       │Profiles  │ │API v2    │ │Base      │ │(Claude)      │
       └──────────┘ └──────────┘ └──────────┘ └──────────────┘
                                       │
                                  ┌────▼─────┐
                                  │OpenSearch│
                                  │Serverless│
                                  └────┬─────┘
                                       │
                                  ┌────▼─────┐
                                  │S3 Bucket │
                                  │(trials/) │
                                  └──────────┘
```

### Tools

| Tool | Purpose | Data Source |
|------|---------|-------------|
| `get_patient_profile` | Retrieve a synthetic patient record | In-memory (12 profiles embedded in notebook) |
| `search_trials` | Find recruiting trials by condition + location | ClinicalTrials.gov API v2 (live, unauthenticated) |
| `retrieve_trial_kb` | Get detailed eligibility criteria for a trial | Amazon Bedrock Knowledge Base (OpenSearch Serverless) |
| `evaluate_eligibility` | Assess patient against each criterion | Claude Sonnet 4 via Bedrock + deterministic verdict logic |

### Deterministic Logic

The agent delegates per-criterion reasoning to Claude, but final decisions are computed by pure Python functions:

- **Verdict aggregation** — If any inclusion criterion fails or any exclusion criterion is met → `not_eligible`. If any criterion is unknown → `needs_review`. Otherwise → `eligible`.
- **Borderline flag** — If a patient's age is within 1 year of a threshold, or a biomarker is within 10% of a numeric cutoff → flag for physician review.

## Getting Started

### Prerequisites

- **Python 3.12+**
- **AWS credentials** configured (`aws configure`) with access to Amazon Bedrock
- **Amazon Bedrock model access** enabled for:
  - `anthropic.claude-sonnet-4-20250514-v1:0` (Claude Sonnet 4)
  - `amazon.titan-embed-text-v2:0` (only needed for Knowledge Base setup)

Enable model access in the [Amazon Bedrock console](https://console.aws.amazon.com/bedrock/home#/modelaccess).

### Quick Start (No Infrastructure Required)

The main notebook works with **just Bedrock model access** — no DynamoDB, no S3, no Knowledge Base needed.

```bash
# Clone the repo
git clone https://github.com/aws-samples/clinical-trial-matching-agent.git
cd clinical-trial-matching-agent

# Install dependencies
pip install -r requirements.txt
pip install jupyter

# Launch the notebook
jupyter notebook clinical_trial_matching_agent.ipynb
```

Run cells top-to-bottom. The agent will:
1. Load 12 synthetic patient profiles from memory
2. Search ClinicalTrials.gov for live recruiting trials
3. Evaluate eligibility using Claude Sonnet 4
4. Return ranked matches with per-criterion reasoning

### With Knowledge Base (Optional — Richer Results)

For enhanced results with detailed eligibility criteria from a vector store, run the setup notebook first:

```bash
# Launch the setup notebook
jupyter notebook setup_knowledge_base.ipynb
```

This creates:
- An S3 bucket with ~500 trial documents from ClinicalTrials.gov
- An OpenSearch Serverless vector collection
- A Bedrock Knowledge Base backed by the collection
- Syncs the trial data into the KB

After setup, set the Knowledge Base ID in the main notebook:
```python
KNOWLEDGE_BASE_ID = "your-kb-id-here"
```

## Project Structure

```
.
├── clinical_trial_matching_agent.ipynb   # Main agent notebook (run this)
├── setup_knowledge_base.ipynb            # KB infrastructure setup (optional)
├── requirements.txt                      # Python dependencies
├── README.md                             # This file
├── LICENSE                               # MIT-0 license
├── CONTRIBUTING.md                       # Contribution guidelines
├── CODE_OF_CONDUCT.md                    # Code of conduct
└── NOTICE                                # Third-party attributions
```

## Notebooks

### `clinical_trial_matching_agent.ipynb`

The complete agent in a single notebook:

1. **Setup** — Imports and configuration
2. **Patient Profiles** — 12 synthetic profiles embedded in-memory
3. **Data Models** — Dataclasses for structured results
4. **Business Logic** — Verdict aggregation + borderline detection (pure functions with inline tests)
5. **Tools** — Four `@tool`-decorated functions
6. **Agent** — System prompt + Strands Agent construction
7. **Execution** — Run the agent with sample patients
8. **Display** — Parse and pretty-print structured results

**Dependencies:** `strands-agents`, `boto3`, `requests`

### `setup_knowledge_base.ipynb`

One-time infrastructure provisioning:

1. Creates an S3 bucket
2. Ingests ~500 trials from ClinicalTrials.gov into S3
3. Creates an IAM role for the KB
4. Creates an OpenSearch Serverless collection with security policies
5. Creates the vector index (kNN, 1024-dim, HNSW/faiss)
6. Creates the Bedrock Knowledge Base
7. Adds the S3 data source and syncs
8. Outputs the `KNOWLEDGE_BASE_ID` for the main notebook
9. Includes a cleanup cell to destroy all resources

**Additional dependencies:** `opensearch-py`, `requests-aws4auth` (auto-installed by the notebook)

## Synthetic Patient Profiles

| ID | Name | Condition | Location |
|----|------|-----------|----------|
| P-001 | Maria Santos | Breast cancer (HER2+/ER+/PR−) | Boston, MA |
| P-002 | Linda Chen | Breast cancer (HER2−/ER+/PR+) | San Francisco, CA |
| P-003 | Angela Rivera | Breast cancer (HER2+/ER−/PR−) | Houston, TX |
| P-004 | James Walker | NSCLC (EGFR L858R, PD-L1 80%) | Chicago, IL |
| P-005 | Priya Patel | NSCLC (ALK+, PD-L1 30%) | Seattle, WA |
| P-006 | Robert Johnson | Type 2 diabetes (HbA1c 8.2%) | Atlanta, GA |
| P-007 | Susan Kim | Type 2 diabetes (HbA1c 7.5%) | Los Angeles, CA |
| P-008 | William Davis | Heart failure (LVEF 30%) | Cleveland, OH |
| P-009 | Dorothy Martinez | Heart failure (LVEF 40%) | Miami, FL |
| P-010 | Harold Thompson | Alzheimer's disease (amyloid+) | Phoenix, AZ |
| P-011 | Eleanor Wright | Alzheimer's disease (APOE4 homozygous) | Denver, CO |
| P-012 | Michael Okafor | ALS (FVC 72%) | Baltimore, MD |

All profiles are **entirely fictional** and tagged with `synthetic: true`.

## Example Output

```
🏆 Top 3 Match Results

1. A Phase 3 Study of Novel HER2-Targeted Therapy
   NCT ID: NCT05xxxxx | Phase: PHASE3 | Location: Boston, MA
   Score: 92% | Verdict: ✅ eligible
     ✅ [INC] Age >= 18 years
        → Patient age 52 meets minimum
     ✅ [INC] HER2-positive disease
        → Patient biomarker confirms HER2+
     ✅ [INC] ECOG performance status ≤ 2
        → Patient ECOG status is 1
     ✅ [EXC] Prior cardiac events
        → No cardiac history in comorbidities
```

## Cost Considerations

- **Bedrock (Claude Sonnet 4)** — Per-token pricing for agent reasoning + eligibility evaluation. A full matching run (1 patient, ~5 trials evaluated) typically costs $0.05–$0.15.
- **ClinicalTrials.gov API** — Free, unauthenticated, no rate limiting for reasonable use.
- **Knowledge Base (optional)** — OpenSearch Serverless has a minimum cost (~$0.24/hour for OCU). Consider running the cleanup cell in `setup_knowledge_base.ipynb` when done.

## Safety & Responsible AI

- **Synthetic data only** — No real patient data is used, stored, or processed.
- **Mandatory disclaimer** — The agent includes a disclaimer in every response.
- **Refuse real data** — The system prompt instructs the agent to refuse requests containing real patient identifiers.
- **Deterministic verdicts** — Final eligibility decisions use fixed rules, not LLM generation.
- **Physician referral** — Borderline matches always recommend physician review.

## Cleanup

To remove all AWS resources created by the Knowledge Base notebook, run the cleanup cell in `setup_knowledge_base.ipynb`. This deletes:
- S3 bucket and all trial documents
- OpenSearch Serverless collection and policies
- Bedrock Knowledge Base and data source
- IAM role

The main agent notebook creates no AWS resources.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file.
