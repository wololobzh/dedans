# Analytics domain

Canonical metrics live here.

## active_learners

Definition V0: count distinct enrollments qualifying as active at the reference date, grouped by requested dimensions. A learner with multiple concurrent active enrollments requires an explicit counting policy before production use.

Dimensions:
- campus
- cohort
- program

## active_swe_assignments
Count active staff assignments carrying SWE responsibility at the reference date.

## learner_to_swe_ratio
`active_learners / active_swe_assignments` for the same scope and reference date.

Every metric implementation must state:
- reference date or period;
- inclusion/exclusion rules;
- dimensions;
- null/zero behavior.
