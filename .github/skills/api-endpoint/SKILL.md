---
name: api-endpoint
description: Add a thin NestJS endpoint backed by an application use case with validation and authorization boundaries.
---

# API endpoint

1. Define or reuse an application contract.
2. Validate request input.
3. Keep controller logic thin.
4. Pass actor context to the use case when authorization is relevant.
5. Map domain/application errors explicitly.
6. Add focused tests.
7. Update API documentation if a contract changes.
