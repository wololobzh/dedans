# School ERP — Agent collaboration

The custom agents in `.github/agents/` are development assistants only. They are not part of the ERP runtime.

## Preferred feature workflow

1. **Product** — clarifies the business need and acceptance criteria.
2. **Architect** — designs the vertical slice and identifies impacted files/layers.
3. **Database** — implements persistence when needed.
4. **Backend** — implements domain/application/API behavior.
5. **Frontend** — implements the user interface against the API contract.
6. **QA** — validates acceptance criteria and adds missing tests.
7. **Reviewer** — performs final critical review and gives a merge verdict.

**Delivery** can be used as the entry point for a complete feature, but must respect the same sequence.

## Shared rules
- Read `.github/copilot-instructions.md` first.
- Read relevant `docs/` before introducing a new business concept.
- Keep changes scoped to the requested feature.
- Do not introduce AI runtime agents into the ERP.
- Preserve `docker compose up` as the local startup contract.
- Prefer simple, explicit architecture over clever abstractions.
