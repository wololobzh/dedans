# Ubiquitous language / glossary

## Learner
A physical person known by the school. A learner is not a cohort membership.

## Enrollment
The learner's participation in a program/cohort for a defined period. Enrollment carries lifecycle status.

Suggested statuses: `planned`, `active`, `paused`, `completed`, `withdrawn`, `cancelled`.

## Active learner
A learner having at least one enrollment with status `active` at the reference date. Exact date semantics must be explicit in analytics queries.

## Campus
An operational school location or virtual campus.

## Program
A curriculum/product offered by the school.

## Cohort / Promotion
A dated group of enrollments following a program, generally attached to a campus.

## Staff
A person working for the school.

## SWE
A staff role responsible for technical/pedagogical support. Do not model SWE as a separate person type; model it as role/assignment.

## Staff assignment
A dated relationship between a staff member and a campus, cohort or responsibility.

## Exam
The definition of an assessment.

## Exam session
A scheduled occurrence of an exam.

## Exam attempt
One learner's participation/result in an exam session.

## Attendance record
Presence information for a learner on a defined date/time and educational activity.

## Metric
A named, documented calculation with reference date/period, filters and dimensions.
