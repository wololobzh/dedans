# Security baseline

- Authentication at API boundary.
- Authorization at application/use-case boundary.
- Least-privilege tools for runtime agents.
- No secrets in prompts, logs or repository.
- Audit sensitive mutations.
- Treat agent/tool input as untrusted input.
- Never use model output as authorization evidence.
- Personally identifiable learner data should be returned only when the caller has permission and a legitimate product path.
