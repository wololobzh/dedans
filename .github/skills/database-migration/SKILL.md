---
name: database-migration
description: Design and review a safe PostgreSQL/Prisma schema migration with constraints, indexes and data preservation.
---

# Database migration

Before migration:
1. describe old and new shape;
2. identify existing data impact;
3. specify backfill strategy if needed;
4. define constraints and indexes;
5. plan rollback or explain why rollback is unsafe;
6. test the migration on representative data.

Never silently destroy historical enrollment or exam data.
