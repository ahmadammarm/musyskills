---
name: prd-generator
description: Generate a structured Product Requirements Document (PRD) by interviewing the user about a new feature or product idea, and save the result as a markdown file. Use whenever the user asks to write a PRD or define product requirements.
argument-hint: <feature-idea-or-topic>
---

# prd-generator

## Purpose

To systematically interview the user to extract all necessary product requirements for a new feature or product, and structure that information into a comprehensive Markdown Product Requirements Document (PRD). The goal is to ensure that development does not begin until the scope, user stories, and technical constraints are well-defined and agreed upon.

## Trigger

Activate this skill when the user:
- Asks to "write a PRD," "create a product requirements document," or "draft a PRD."
- Uses the explicit slash command `/prd-generator`.
- Asks to define, specify, or formalize a new feature's requirements before coding.

## Pre-flight Checks

Before beginning the interview process, the agent must:
1. Search the workspace for a PRD template (e.g., `docs/PRD_TEMPLATE.md` or `.github/PRD_TEMPLATE.md`). If found, use its structure as the target format.
2. Check if the user has provided an existing partial PRD, notes, or an issue ticket. If so, treat those as the base requirements and identify which sections are missing.
3. Check if there is an existing `docs/` folder in the project. If not, note that one may need to be created.

## Workflow

### Step 1: Initial Discovery
- If the user hasn't provided a specific feature idea, ask them for one.
- Ask clarifying questions to understand:
  - The primary problem being solved (the "Why").
  - The target audience and personas (who will use this feature).
  - Any known technical or business constraints.
- *Tip:* Use interactive questions (e.g., the `ask_question` tool) or present a small, focused list of questions in the chat. Do not overwhelm the user with a massive questionnaire.

### Step 2: Define Scope & Stories
- Based on the initial discovery, propose a discrete list of "In Scope" and "Out of Scope" (Non-Goals) items. This is crucial for preventing feature creep.
- Draft 3-5 core User Stories with basic Acceptance Criteria, following the format: *"As a [persona], I want to [action] so that [benefit]."*
- Ask the user to review, modify, or confirm the scope and user stories before proceeding to the full draft.

### Step 3: Draft the PRD
- Once the user confirms the scope and stories, generate the full PRD according to the **Output Format** defined below.
- Flesh out the remaining sections (Technical Considerations, UX/Design, Risks, and Success Metrics) based on best practices, standard patterns, and the context gathered in steps 1 and 2.

### Step 4: Save and Present
- Write the final PRD to a Markdown file in the project's documentation folder (e.g., `docs/PRD-[feature-name].md`).
- If the user named a location, save the file there.
- Otherwise, if a `docs/` folder does not exist, create it and save the file there. Tell the user the path so they can move it if they prefer another location.
- Inform the user that the file has been created, provide a direct link to it, and ask if any sections need further refinement.

## Rules

- **No hallucinated requirements:** Never generate an entire PRD from a single vague sentence without first confirming the scope and user stories with the user. The interview phase is mandatory.
- **Pacing:** Group questions logically and proceed conversationally. Do not dump all questions at once.
- **Save to a file:** The final PRD MUST be saved as an actual `.md` file in the project. Do not just print the entire PRD in the chat response, as this pollutes the context window.
- **Strict adherence to structure:** The final PRD must contain all sections listed in the Output Format. If a section is not applicable, include the heading and write "N/A" with a brief reason.

## Output Format

If a repository template is found in Pre-flight checks, use it exactly. Otherwise, the generated PRD must be formatted in Markdown and include the following sections exactly:

1. **Title & Meta Information**
   - Project/Feature Name, Author, Status (Draft/In Review/Approved), Date, Target Release.
2. **Overview & Problem Statement**
   - **What:** High-level summary of the feature.
   - **Why:** The specific problem this solves.
3. **Target Audience & Personas**
   - Who will use this feature and what are their specific needs.
4. **Goals & Non-Goals**
   - **In Scope:** What is being built.
   - **Out of Scope (Non-Goals):** What is explicitly NOT being built.
5. **User Stories & Functional Requirements**
   - Format: *"As a [persona], I want to [action] so that [benefit]."*
   - Acceptance Criteria for each story (bulleted list defining when the story is "done").
6. **User Experience (UX) & Design**
   - Core user flows, key interactions, or references to wireframes.
7. **Technical Considerations**
   - High-level architecture, required API endpoints, database schema changes, etc.
8. **Dependencies, Risks & Mitigations**
   - Blockers, security considerations, dependencies on other systems, and mitigations.
9. **Success Metrics**
   - Quantifiable metrics to measure the feature's success (e.g., adoption rate, performance metrics).
