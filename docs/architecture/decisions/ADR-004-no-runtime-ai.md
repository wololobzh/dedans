# ADR-004 — No runtime AI in the ERP

Status: Accepted

## Decision

The ERP does not embed AI agents, LLM calls, Copilot SDK, MCP clients or prompt orchestration in its runtime architecture.

GitHub Copilot is used as development tooling through repository agents, instructions, prompts and skills only.

## Rationale

The first objective is to build a reliable operational ERP with clear business rules, predictable behavior, strong authorization and auditable data. Runtime AI can be reconsidered later as a separate product decision if a concrete use case justifies it.
