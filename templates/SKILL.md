---
name: skill-name
description: One or two sentences on what the skill does and when to use it. Include the phrases a user would actually say, because the agent uses this text to decide when to run the skill.
argument-hint: <what-the-user-can-pass>
---

# skill-name

## Purpose

What the skill achieves and why it exists, in two or three sentences.

## Trigger

Activate this skill when the user:
- Runs the slash command `/skill-name`.
- Says "..." or any similar phrase.

## Pre-flight Checks

Before doing anything, perform the following in order:

1. Read-only checks that gather context (for example, `git status`).
2. Conditions that must stop the skill, and what to tell the user when they do.

## Workflow

### Step 1: ...
- Concrete actions, in order.

### Step 2: ...
- Points where the user must confirm before continuing.

## Rules

- Hard constraints the agent must never break.

## Output Format

What the agent reports at the end, as a numbered list of parts.
