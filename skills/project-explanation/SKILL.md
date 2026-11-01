---
name: project-explanation
description: Understand a project comprehensively and explain it clearly to the user. Then (unless the user asks for no questions) ask which feature the user wants to develop, explain that feature in depth, and confirm whether the user wants to proceed with development. Trigger when the user asks to understand, explore, summarize, or explain a codebase/project, or asks "what features does this project have" or "help me understand this project".
argument-hint: <project-name-or-feature>
---

# project-explanation

## Purpose

Deeply understand a project's structure, architecture, and features, then explain it clearly in plain language. After summarizing the project, guide the user interactively to select a feature for deeper exploration and, optionally, active development.

## Trigger

Activate this skill when the user:
- Runs the slash command `/project-explanation`.
- Asks to "understand this project," "explain this codebase," "give me a project overview," or similar.
- Asks "what does this project do," "what features exist," or "help me get up to speed on this repo."
- Wants an onboarding overview before deciding what to build or improve next.

## Interaction Mode

Determine the mode before starting:

- **Interactive (default)**: Pause at the two decision points (feature selection and development confirmation) and wait for the user's answer.
- **Non-interactive**: Use this mode when the user's request or the skill arguments ask for no questions (e.g., "no questions," "make no questions," "don't ask," "just summarize"). Do not ask the user anything and do not wait for input. Instead:
  - End Step 4 with a **Recommended Next Step** section in place of the feature-selection question: name one or two features or improvements worth developing first and give a one-sentence reason for each, based on evidence from the code.
  - Stop after Step 4. Do not perform the deep-dive or produce an implementation plan unless the user asks for one in a later message.

## Pre-flight Checks

Before exploring the project, perform the following in order:

1. Run `git status` to confirm the current branch and working-tree state.
2. List the root directory structure to understand the top-level layout and identify what type of project this is.
3. Read the `README.md` (or `readme.md`, `README.rst`, `docs/index.md`) if one exists. This is the primary source of intent and feature documentation.
4. Read configuration files relevant to the project type, such as:
   - `package.json` / `package-lock.json` for JavaScript/TypeScript projects.
   - `pyproject.toml` / `requirements.txt` for Python projects.
   - `Gemfile` for Ruby projects.
   - `go.mod` for Go projects.
   - `Cargo.toml` for Rust projects.
   - `.env.example` for environment variable requirements.
   - `docker-compose.yml` / `Dockerfile` for containerized deployments.
5. Identify the primary directories and their likely responsibilities (e.g., `src/`, `app/`, `api/`, `components/`, `services/`, `models/`, `tests/`, `scripts/`, `docs/`).

## Workflow

### Step 1: Identify the Tech Stack
- Determine the primary programming language(s) from file extensions and configuration files.
- Identify the main framework (e.g., Next.js, Django, Rails, Spring Boot, Express, FastAPI) from dependencies or configuration.
- Identify the database layer if evident (SQL, MongoDB, Redis, etc.).
- Identify the deployment or infrastructure approach (Docker, Kubernetes, serverless, etc.) if present.
- Note any significant external integrations (third-party APIs, authentication providers, payment systems).

### Step 2: Identify the Architecture Pattern
- Determine the overall architectural approach from the directory structure and code organization:
  - Frontend-only (SPA, static site)
  - Backend-only (API server, CLI tool, library)
  - Full-stack monolith
  - Full-stack monorepo with separate frontend and backend packages
  - Microservices
- Identify key architectural layers present (e.g., controllers/routes, services/use-cases, repositories/data access, models/entities, middleware, utilities).

### Step 3: Map the Features
- Read key source files and entry points (e.g., `main.ts`, `app.py`, `index.js`, route definitions, page components) to enumerate distinct features.
- A feature is any self-contained piece of user-facing or system-level functionality (e.g., user authentication, dashboard, report generation, background jobs, API endpoints, notification system).
- List every feature identified with a brief one-line description.

### Step 4: Present the Comprehensive Summary
Present the findings to the user in the following structure:
- **Project Name and Purpose** — what the project is and who it is for.
- **Tech Stack** — languages, frameworks, databases, and key integrations.
- **Architecture** — the overall pattern and how the main layers are organized.
- **Features** — a numbered list of all identified features with one-line descriptions.
- **Key Entry Points** — the main files a developer would start reading to understand the system.

After presenting the summary, ask the user:

> "From the features above, which one would you like to explore further?"

Wait for the user's response before continuing. Do not proceed to the next step without a selection.

In non-interactive mode, replace the question with the **Recommended Next Step** section described under Interaction Mode, then stop.

### Step 5: Deep-Dive on the Selected Feature
Once the user selects a feature:
- Read all files directly related to that feature (routes, controllers, services, models, components, tests).
- Explain how the feature currently works end-to-end: the entry point, data flow, business logic, data persistence, and any output or response.
- List every file that contributes to this feature and describe each file's role.
- Identify the dependencies this feature has on other parts of the system.
- Identify any limitations, known edge cases, missing tests, or improvement opportunities observable from the code.

After the detailed explanation, ask the user:

> "Would you like to proceed with developing or improving this feature now?"

Wait for the user's response before continuing.

### Step 6: Plan or Conclude
- If the user says **yes**, provide a concrete implementation plan:
  - The specific files that need to be created or modified.
  - A step-by-step technical approach.
  - An estimated complexity level (low / medium / high) and a rationale.
  - Any risks or prerequisites to address first.
- If the user says **no**, offer to return to the full feature list from Step 4 or to end the exploration session.

## Rules

- In interactive mode, always wait for the user's explicit response at the two decision points (feature selection and development confirmation) before continuing.
- In non-interactive mode, never ask a question or wait for input; end with the Recommended Next Step section after Step 4.
- Use plain, accessible language. Assume the user may be new to this codebase; provide enough context to be useful without overwhelming them with jargon.
- Do not modify any source files during this skill. It is read-only with respect to the codebase.
- If the repository has no README and minimal configuration, state this honestly and note that the exploration will rely on reading source files directly.
- Do not fabricate features or behaviors not evidenced by the code or documentation.

## Output Format

Deliver the output in up to three phases:

**Phase 1 (Steps 1-4)**: A structured project summary presented inline, followed by the interactive feature-selection question. In non-interactive mode, the summary is followed by the Recommended Next Step section and the output ends here.

**Phase 2 (Step 5)**: A detailed feature breakdown presented inline, including files, data flow, dependencies, and improvement opportunities, followed by the development confirmation question.

**Phase 3 (Step 6, if yes)**: An implementation plan with specific files, steps, complexity estimate, and any identified risks or prerequisites.