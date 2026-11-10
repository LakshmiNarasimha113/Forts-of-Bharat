# AssetGuard AI

Predictive maintenance and repair-job advisory platform for Meridian Heavy Industries.

AssetGuard AI cleans industrial maintenance data, trains machine-learning models, searches maintenance documents, and runs a human-approved multi-agent workflow that drafts traceable repair jobs. A model may recommend action, but no machine is taken out of service until a maintenance supervisor approves the repair job.

## Core capabilities

- Cleans and profiles five raw CSV datasets with missing values, inconsistent categories, mixed date formats, units, duplicates, invalid readings, and text artifacts.
- Predicts whether a machine may break down within the next 30 days.
- Estimates repair downtime in hours.
- Classifies technician notes into a maintenance problem type.
- Builds a searchable knowledge base from 16 maintenance manuals, policies, safety rules, guides, and catalogues.
- Uses a sequential multi-agent workflow to interpret model and document facts.
- Pauses at a durable human-review gate before a repair job is approved or rejected.
- Exposes machine, fleet, advisory, review, chat, and audit functions through a REST API.
- Provides a role-based Streamlit dashboard for supervisors, engineers, and technicians.
- Stores advisory runs, repair jobs, decisions, LLM calls, accounts, and manual-chat activity for audit.

## System workflow

1. Load and profile the five raw datasets.
2. Clean and save processed datasets.
3. Train and evaluate two tabular ML models and one NLP model.
4. Extract and chunk the 16 maintenance PDFs.
5. Create embeddings and store document chunks in a persistent vector database.
6. Score the current fleet and identify machines at risk.
7. Run the advisory agents for a selected machine.
8. Draft and persist a repair job.
9. Pause the workflow for supervisor review.
10. Resume after an `APPROVE`, `MODIFY`, or `REJECT` decision.
11. Store the final outcome and complete audit trail.

## Machine-learning components

| Component | Task | Output |
|---|---|---|
| Breakdown risk model | Binary classification | Probability of breakdown within 30 days |
| Downtime model | Regression | Estimated repair duration in hours |
| Problem-type model | NLP text classification | Problem type inferred from technician notes |

Candidate models from different algorithm families are trained on the same data, evaluated consistently, and compared using a primary metric. The selected tabular models are saved with their preprocessing pipelines and ordered feature schemas. The text classifier is saved with its fitted text vectorizer.

### Recognised problem types

- Bearing Wear
- Shaft Misalignment
- Poor Lubrication
- Seal Leak
- Overheating
- Electrical Fault
- Blade Damage
- Belt Wear

## Knowledge base and grounded answers

The knowledge base is built from 16 documents under `data/docs/`, including machine manuals, safety rules, maintenance guides, a parts catalogue, priority and warranty policies, and a past-problems casebook.

Each PDF is extracted, divided into overlapping chunks, embedded, and stored with its source document and chunk position. Retrieved passages remain attributable to their original documents.

The manual assistant:

- Uses exactly one LLM call per question.
- Answers procedure, safety, and parts questions only from retrieved documents.
- Answers a named machine's status from fleet data and the breakdown model.
- Refuses unsupported questions rather than guessing.
- Logs every question, answer, source, machine code, and latency.

## Agentic advisory workflow

The workflow runs sequentially:

1. `load_machine_context`
2. `plan_investigation`
3. `assess_machine_condition`
4. `identify_problem_type`
5. `retrieve_procedure`
6. `compose_repair_job`
7. `request_supervisor_review`
8. `finalize_repair_job` when not rejected
9. `persist_review_outcome`

Six agents are used:

- Work Planner
- Condition Analyst
- Problem Analyst
- Procedure Advisor
- Repair Job Writer
- Repair Job Finalizer

Deterministic tools and trained models calculate risk, priority, problem type, downtime, and retrieved evidence. Agents only interpret the supplied facts and write human-readable judgements. They do not recalculate model outputs or search independently.

A normal advisory makes five LLM calls before pausing. Approval or modification makes one finalizer call. Rejection skips the finalizer and therefore uses one fewer call.

## Human-in-the-loop safety

Every drafted repair job is saved before review. The workflow then pauses on disk, allowing the application process to stop and restart without losing state or repeating earlier LLM calls.

A maintenance supervisor records one of:

- `APPROVE`
- `MODIFY`
- `REJECT`

The original reviewed draft is retained for audit. Risk scores and model outputs are recommendations only and never independently authorise shutdown.

## Project structure

```text
Project/
├── .streamlit/
│   └── config.toml
├── access/
│   ├── password_security.py
│   └── permissions.py
├── agentic/
│   ├── agents.py
│   ├── graph.py
│   ├── nodes.py
│   └── state.py
├── api/
│   ├── routes.py
│   └── schemas.py
├── chat/
│   ├── conversation_memory.py
│   ├── machine_status_answer.py
│   └── manual_assistant.py
├── config/
│   └── config.py
├── dashboard/
│   ├── api_client.py
│   ├── audit_trail.py
│   ├── fleet_overview.py
│   ├── machine_detail.py
│   ├── manual_chat.py
│   └── review_queue.py
├── data/
│   ├── docs/
│   └── input/
├── data_pipeline/
│   ├── breakdown_cleaning.py
│   ├── common_cleaning.py
│   ├── dataset_loader.py
│   ├── downtime_cleaning.py
│   ├── feature_builder.py
│   ├── quality_profiler.py
│   └── technician_note_cleaning.py
├── knowledge/
│   ├── chunk_splitting.py
│   ├── pdf_extraction.py
│   ├── procedure_retrieval.py
│   └── vector_index.py
├── modeling/
│   ├── breakdown_model.py
│   ├── downtime_model.py
│   ├── model_evaluation.py
│   ├── model_registry.py
│   └── problem_type_model.py
├── persistence/
│   ├── database.py
│   ├── models.py
│   └── repository.py
├── processed/
├── tools/
│   ├── machine_data_tools.py
│   ├── prediction_tools.py
│   └── retrieval_tools.py
├── .env.example
├── requirements.txt
├── run_api_service.py
├── run_dashboard.py
├── run_data_preparation.py
├── run_database_setup.py
├── run_knowledge_indexing.py
└── run_model_training.py
```

## Data inputs

Place these raw files under `data/input/`:

- `machine_breakdown_train.csv`
- `machine_breakdown_eval.csv`
- `repair_downtime_train.csv`
- `repair_downtime_eval.csv`
- `technician_notes.csv`
- `current_fleet.csv`

The training files contain targets. Evaluation files are held out for final model assessment. `current_fleet.csv` represents live scoring data and must not contain the target the breakdown model predicts.

## Installation

Run all commands from the `Project` folder.

```bash
cd Project
python3 -m pip install -r requirements.txt
```

Create the environment file from the supplied example and add the configured Gemini API key and model settings:

```bash
cp .env.example .env
```

Do not commit `.env`, API keys, generated databases, model artifacts, or session tokens.

## Run the project

The six entry points must be run in order.

### 1. Create the database and seed accounts

```bash
python3 run_database_setup.py
```

This creates the application database, required tables, password hashes and salts, and configured user accounts.

### 2. Profile and clean the data

```bash
python3 run_data_preparation.py
```

Expected cleaned dataset shapes from the specification:

- Breakdown training: `(30000, 43)`
- Breakdown evaluation: `(8400, 43)`
- Downtime training: `(28464, 35)`
- Downtime evaluation: `(5840, 35)`
- Technician notes: `(26891, 13)`

The command also writes a combined data-quality report.

### 3. Train and evaluate the models

```bash
python3 run_model_training.py
```

This saves:

- Breakdown model
- Downtime model
- Problem-type classifier
- Text vectorizer
- Breakdown and downtime feature schemas
- Combined model metrics report

### 4. Build the maintenance knowledge index

```bash
python3 run_knowledge_indexing.py
```

The index is rebuilt from scratch so rerunning this command does not duplicate chunks. The command also executes sample semantic searches to validate retrieval.

### 5. Start the REST API

```bash
python3 run_api_service.py
```

The API documentation is available at:

```text
http://localhost:8081/docs
```

Keep this process running.

### 6. Start the dashboard

In another terminal, from the `Project` folder:

```bash
python3 -m streamlit run run_dashboard.py
```

The expected local dashboard address is:

```text
http://localhost:8080
```

## Important API endpoints

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/signin` | Sign in and receive a session token |
| POST | `/auth/signout` | Invalidate the current session token |

### Fleet and machines

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/machines/{machine_code}` | Latest machine profile |
| GET | `/machines/{machine_code}/risk` | Breakdown probability, risk band and priority |
| GET | `/machines/{machine_code}/notes` | Technician-note classification and recent notes |
| GET | `/fleet/risk?risk_band=ALL` | Fleet risk table ordered highest risk first |

### Advisory and review

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/advisories` | Run agents to the review gate and create a draft |
| GET | `/repairjobs?status_value=PENDING` | List repair jobs by status |
| GET | `/repairjobs/{repair_job_id}` | Get full repair-job details |
| POST | `/repairjobs/{repair_job_id}/review` | Submit approve, modify or reject decision |
| GET | `/repairjobs/{repair_job_id}/reviews` | Get review history |
| GET | `/runs/{run_id}/calls` | Get the LLM call budget and timings |

### Manual assistant and audit

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/chat/ask` | Ask a grounded maintenance question |
| GET | `/audit/chat-turns` | Read recent logged chat turns |

All guarded requests must include the configured session-token header.

## Roles and access control

AssetGuard AI uses role-based access control for:

- Supervisor
- Engineer
- Technician

The service checks permissions for every guarded endpoint. Hiding a page in the dashboard is only a convenience and is not treated as security. In particular, an engineer may raise an advisory but cannot approve the resulting shutdown request. A technician is limited to the manual-chat capability configured for that role.

Passwords are salted and hashed before storage. Plain-text passwords are never stored. A successful sign-in issues an unpredictable session token, and signing in again replaces the previous token for that account.

## Dashboard pages

Depending on the signed-in role, the dashboard can expose:

- Fleet overview
- Machine detail
- Review queue
- Audit trail
- Manual chat

Every number shown by the dashboard comes from the REST service. The dashboard does not load models, read raw files, calculate risk, or connect directly to the database.

## Generated outputs

A complete run creates artifacts such as:

```text
processed/                       # Cleaned CSV datasets
output/data_quality_report.json # Raw-data quality evidence
output/model_metrics.json       # Final model scores
output/models/                  # Saved models, vectorizer and schemas
database/assetguard.db          # Application audit database
database/chroma_store/          # Persistent document vector store
```

Exact paths and thresholds must come from `config/config.py` rather than being duplicated in implementation modules.

## Auditability

The database records:

- Agent runs and their lifecycle status
- Drafted and finalized repair jobs
- Supervisor decisions and the draft seen during review
- Individual LLM calls, character counts and latency
- User accounts and active session tokens
- Manual-assistant questions, answers, sources and latency

This allows a reviewer to trace a repair recommendation back to model outputs, retrieved documents, agent calls, and the named human decision.

## Design principles

- Models produce predictions; agents interpret them.
- Tools calculate facts; agents do not recalculate facts.
- Retrieved maintenance documents are the only source for procedural instructions.
- Unsupported manual questions are refused rather than guessed.
- The API is the single source of truth for the dashboard.
- Training and scoring use the same preprocessing artifacts and feature order.
- Configuration values, paths, mappings, thresholds, and business rules live in `config/config.py`.
- All consequential repair jobs pass through a durable human-approval gate.

## License

Add the applicable project licence here before public distribution.
