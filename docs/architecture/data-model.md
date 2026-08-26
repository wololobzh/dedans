# Data model V0

Core relationships:

```text
Campus 1 --- * Cohort * --- 1 Program
                  |
                  *
             Enrollment
                  *
                  |
                  1
               Learner

Staff 1 --- * StaffAssignment * --- 0..1 Cohort
                         \\--- 0..1 Campus

Exam 1 --- * ExamSession 1 --- * ExamAttempt * --- 1 Learner

Learner 1 --- * AttendanceRecord * --- 1 Cohort
```

Important: counts of learners are generally counts of qualifying enrollments at a reference date, not raw rows in `Learner`.
