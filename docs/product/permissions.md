# Permissions

Initial permission families:

- `learner.read`, `learner.write`
- `enrollment.read`, `enrollment.write`
- `cohort.read`, `cohort.write`
- `staff.read`, `staff.write`
- `exam.read`, `exam.manage`, `exam.grade`
- `attendance.read`, `attendance.write`
- `analytics.read`
- `agent.use`

Sensitive mutations should produce an audit event containing actor, action, entity, timestamp and relevant before/after information.
