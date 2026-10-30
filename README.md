# Northstar

Northstar is a self-contained admissions planning prototype for SAT prep, essays, activities, story analysis, university fit, and calendar planning.

## Run it

From this directory:

```bash
python3 server.py
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). The server creates `northstar.sqlite3` locally on first run.

Live demo: [nurticoder.github.io/northstar](https://nurticoder.github.io/northstar/)

Live demo: [nurticoder.github.io/northstar](https://nurticoder.github.io/northstar/)

## Included

- Desktop-first admissions command center with roadmap, deadlines, and next-best-action planning
- Story and “ikigai lens” analysis seeded from student evidence
- SAT practice queue and session modal
- Essay rooms with saved draft state
- Activities inventory with add flow and local persistence
- University fit recommendations and tags
- Calendar timeline
- Browser-local persistence through `localStorage`
- Local SQLite accounts with PBKDF2 password hashing and secure session cookies
- Sign in, sign up, sign out, and authenticated practice progress
- Seeded Northstar-original SAT-style questions for Math and Reading & Writing
- Adaptive question selection that moves between easy, medium, and hard based on recent attempts
- `tests/test_server.py` covering auth, question seeding, adaptive selection, and HTTP flows

The copy and seeded records are original product content designed around the requested feature set. They are not a verbatim copy of third-party website text, branding, or proprietary datasets. The practice bank intentionally uses original SAT-style items rather than reproducing copyrighted College Board or OnePrep questions.
