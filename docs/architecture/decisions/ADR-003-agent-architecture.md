# ADR-003 — Specialized Copilot agents are development tooling only

Status: Accepted

## Context

We want to use agentic development workflows with GitHub Copilot while keeping the ERP runtime simple, deterministic and independent from LLM services.

## Decision

Use specialized GitHub Copilot agents under `.github/agents/` for product clarification, architecture, database, backend, frontend, QA and review.

Do not embed agents, an orchestrator, an LLM SDK or prompt-driven business logic inside the ERP runtime.

## Consequences

- Agentic collaboration accelerates development without becoming a production dependency.
- The deployed application remains a conventional web/API/database architecture.
- Product features do not depend on availability, cost or behavior of an LLM provider.
