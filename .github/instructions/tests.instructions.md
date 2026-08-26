---
applyTo: "**/*.test.ts,**/*.spec.ts,tests/**"
---

# Test instructions

- Test behavior, not implementation details.
- Prioritize domain invariants, authorization, metrics definitions and agent tool boundaries.
- A bug fix should include a regression test whenever practical.
- Avoid brittle snapshot tests for business logic.
