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
