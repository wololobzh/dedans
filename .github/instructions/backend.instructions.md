---
applyTo: "apps/api/**,packages/application/**,packages/domain/**"
---

# Backend instructions

- Keep controllers thin.
- Controllers call application use cases.
- Application use cases enforce orchestration and authorization boundaries.
- Domain logic must be framework independent.
- Never import Prisma inside the domain layer.
- Return structured errors; do not leak infrastructure errors to consumers.
- Write tests around business rules before adding controller-level complexity.
