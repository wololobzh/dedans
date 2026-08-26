# Product vision

School ERP is the operational source of truth for a multi-campus school.

The ERP must make it possible to answer, at any date:

- How many learners are active?
- On which campus, program and cohort are they enrolled?
- Which SWE/staff members are assigned to each cohort/campus?
- What is the learner-to-SWE ratio?
- What are the attendance, progression and exam indicators?
- Which exams are planned, completed, passed or require retakes?
- Which cohorts or learners need attention?

## Product principle

The ERP is a deterministic business application. GitHub Copilot agents may help developers build it, but **no AI agent or LLM is part of the runtime product**.

## V0 scope

1. Campuses
2. Programs
3. Cohorts
4. Learners
5. Enrollments
6. Staff / SWE assignments
7. Exams / sessions / attempts
8. Attendance
9. Core analytics and dashboards
10. Authentication, roles and permissions

## Not V0

- payroll
- accounting
- complex CRM
- LMS content authoring
- runtime AI assistants or autonomous agents
- microservices
