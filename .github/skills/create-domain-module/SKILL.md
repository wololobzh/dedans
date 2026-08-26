---
name: create-domain-module
description: Create or extend a business domain module consistently across domain, application, persistence, API, docs and tests.
---

# Create domain module

1. Read `docs/product/glossary.md` and the nearest domain doc.
2. Define the ubiquitous language and invariants.
3. Create framework-independent types/entities in `packages/domain/src/<domain>`.
4. Define application ports and use cases in `packages/application/src/<domain>`.
5. Add persistence adapters only after the contracts are clear.
6. Expose API adapters if required.
7. Add tests for invariants and critical use cases.
8. Update `docs/domains/<domain>.md`.
9. If architecture changed, add/update an ADR.

Never create a second concept merely because the API/UI uses a different label.
