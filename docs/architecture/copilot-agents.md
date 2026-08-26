# GitHub Copilot development agents

## Purpose

The repository uses multiple specialized GitHub Copilot agents to help design and implement the ERP. They are development tooling only and never run inside the application.

## Topology

```text
                    Product
                       |
                   Architect
                       |
          +------------+------------+
          |            |            |
       Database     Backend      Frontend
          |            |            |
          +------------+------------+
                       |
                       QA
                       |
                    Reviewer
```

## Responsibilities

### Product
Turns a business request into precise terminology, business rules, metrics and acceptance criteria.

### Architect
Chooses boundaries and contracts, identifies impacted modules, and prevents unnecessary coupling.

### Database
Owns schema design, constraints, indexes, migrations and persistence concerns.

### Backend
Implements domain behavior, application use cases and API adapters.

### Frontend
Implements the user experience while keeping business rules outside React.

### QA
Tests business-critical behavior, edge cases and regressions.

### Reviewer
Challenges the implementation and actively looks for architecture, security, correctness and maintainability issues.

## Rules

- Agents collaborate on repository development only.
- No development-agent prompt becomes application runtime logic.
- No LLM SDK is required by the ERP.
- The database and application code remain deterministic sources of truth.
- For simple changes, the workflow can use fewer agents.
