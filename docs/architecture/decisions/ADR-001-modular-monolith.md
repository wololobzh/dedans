# ADR-001 — Start with a modular monolith

Status: Accepted

## Decision
Build one deployable backend initially while preserving domain boundaries in packages/modules.

## Reason
The product is early, cross-domain transactions are common, and operational simplicity is more valuable than independent service scaling.

## Consequence
No microservice may be added without a new ADR describing the concrete problem it solves.
