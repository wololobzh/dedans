---
applyTo: "packages/database/**"
---

# Database instructions

- PostgreSQL only.
- Use explicit foreign keys and uniqueness constraints.
- Add indexes for frequent joins and filters.
- Migrations must preserve data or document the destructive step clearly.
- Keep historical records when needed for auditability.
- Do not store derived metrics unless there is a documented performance reason.
- Prisma models are persistence models, not domain entities.
