# Authorization architecture

Controllers and agent tools pass an `ActorContext` into application use cases.

Suggested shape:

```ts
export type ActorContext = {
  userId: string;
  permissions: string[];
  campusIds?: string[];
};
```

Application services decide whether the requested action is allowed. Infrastructure adapters must not silently broaden permissions.

## Campus scope contract

Campus use cases require an `ActorContext` and perform authorization before loading or mutating
business data:

1. The required permission is checked exactly (`campus.read` or `campus.write`).
2. An unrestricted actor is an explicit authorization result, not an inferred value. For MVP,
  only the national administration may create a campus without an existing `campusId`.
3. A scoped actor must have a non-empty `campusIds` set. Missing, null or empty scope means no
  campus access, never all campuses.
4. Reads add the scope predicate to list, search, detail, counts and inactive/all filters.
5. Writes re-check the target campus against the scope inside the application use case. A
  repository must receive an already-authorized filter and must not widen it.
6. A missing or out-of-scope identifier returns the same not-found boundary as an unknown
  identifier, avoiding existence disclosure.

The application should represent authorization explicitly, for example with an internal
`CampusAccess = { kind: 'unrestricted' } | { kind: 'scoped'; campusIds: readonly string[] }`.
The public `ActorContext` may remain compatible with the current optional `campusIds` shape, but
the adapter from authentication claims must distinguish unrestricted administration from a
missing scope. Roles select permissions upstream; use cases never authorize from role names.

## Audit boundary

Successful campus create, update and deactivate use cases must append their audit event in the
same transaction as the state change. Authorization failures and validation failures are security
events, not campus audit events, and must not include out-of-scope campus data. Audit events are
not exposed by the campus CRUD API in MVP; a future audit-read permission and endpoint must be
designed separately.
