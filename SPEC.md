# Northstar Platform Specification

## Product

Northstar is an adaptive SAT/ACT practice and admissions workspace. It supports
students preparing for standardized tests, teachers managing instruction, and
administrators managing schools, users, content, and reporting.

## Roles

- **Student**: takes adaptive practice, reviews explanations, tracks progress,
  saves notes, and receives study recommendations.
- **Teacher**: creates classes, assigns practice, reviews student progress,
  writes feedback, and monitors mastery by domain.
- **Admin**: manages schools, memberships, permissions, content publishing,
  data retention, and audit records.

## Core capabilities

1. **Authentication and tenancy**
   - Email/password sign-up and sign-in.
   - Student, teacher, and admin authorization.
   - Every request is scoped to one school.
   - Every database table carries a non-null `school_id` column unless the
     table is an explicitly documented global catalog.
2. **Adaptive practice**
   - SAT and ACT subject/section support.
   - Question selection uses recent accuracy, difficulty, domain coverage, and
     unanswered content.
   - Students see answer choices, feedback, explanations, and next actions.
3. **Scoring**
   - Pure scoring functions are deterministic and independently testable.
   - Practice attempts are retained for progress reporting.
   - Score estimates are labeled as estimates and never presented as official
     College Board or ACT scores.
4. **Teacher workspace**
   - Class roster and assignment management.
   - Domain-level progress and intervention signals.
5. **Admin workspace**
   - School and membership administration.
   - Question bank publishing and archival.
   - Audit events for privileged changes.
6. **Tutor**
   - Explains a missed question using the stored question context.
   - Does not reveal hidden answer keys before submission.
   - Clearly labels generated guidance and reports unavailable context.

## Technical direction

- Frontend: Next.js, Tailwind CSS, accessible semantic HTML, and KaTeX for
  mathematical expressions.
- Engine: pure Python modules with unit tests; no framework dependency.
- API: FastAPI routers with explicit request/response schemas and school scope
  enforcement.
- Database: SQL migrations with foreign keys, indexes, timestamps, and
  `school_id` on every tenant table.
- Local development may use SQLite; production deployment must support a
  server-side relational database and secure secret configuration.

## File tree and planned ownership

```text
SPEC.md
README.md
index.html
styles.css
app.js
server.py
tests/
  test_server.py
frontend/
  app/
  components/
  lib/
  styles/
engine/
  select.py
  score.py
  tests/
db/
  migrations/
api/
  routers/
ai/
  tutor.py
```

Existing files are the current Northstar prototype and local backend. Planned
files extend it without replacing working behavior.

## Quality and safety rules

- Keep each source file below 200 lines; split cohesive modules when needed.
- Preserve working files and patch them surgically.
- Never copy proprietary question text, source code, logos, or private datasets.
- Use original SAT/ACT-style practice content or properly licensed/public-domain
  data, with source metadata for every question.
- Validate all inputs, enforce school scoping, and return explicit errors.
- Test each new engine/API behavior before calling it complete.
