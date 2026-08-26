# ADR-002 — PostgreSQL as source of truth

Status: Accepted

## Decision
Use PostgreSQL for canonical ERP data, accessed through persistence adapters.

## Consequence
Agents, frontend and domain logic never query PostgreSQL directly.
