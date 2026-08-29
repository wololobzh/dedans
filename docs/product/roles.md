# Product roles

Initial roles to design for:

- National admin
- Campus director
- Pedagogical manager
- SWE / trainer
- Exam manager
- Read-only analyst

Roles are product concepts. Authorization should ultimately be permission-based rather than hard-coded solely by role name.

## Campus management baseline

The initial authorization proposal is:

| Role | Campus access | Scope |
| --- | --- | --- |
| National admin | `campus.read`, `campus.write` | All campuses; may create campuses |
| Campus director | `campus.read`, optionally `campus.write` | Explicitly assigned campuses; creation is not allowed until its parent scope is defined |
| Pedagogical manager | `campus.read` | Explicitly assigned campuses or workflow scope |
| SWE / trainer | `campus.read` | Campuses exposed by current assignments |
| Exam manager | `campus.read` | Campuses exposed by managed exam workflows |
| Read-only analyst | `campus.read` and `analytics.read` | Reporting scope, with inactive campuses available for historical reporting |

This is a product baseline, not an implementation shortcut: application use cases must evaluate the permission and resolved campus scope for every request.
