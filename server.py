#!/usr/bin/env python3
"""Local Northstar application server with SQLite-backed auth and practice data."""

import hashlib
import http.cookies
import http.server
import json
import secrets
import sqlite3
import threading
import urllib.parse
from datetime import datetime, timezone


QUESTION_SEED = [
    {
        "subject": "math",
        "domain": "Algebra",
        "difficulty": "easy",
        "prompt": "A school club sells notebooks for $6 each. After selling 18 notebooks, it has collected $108. Which equation represents the relationship between the number of notebooks n and the amount collected c?",
        "choices": ["c = 6n", "c = 18n", "n = 6c", "c = n + 108"],
        "answer": 0,
        "explanation": "Each notebook contributes $6, so the total is 6 times the number sold.",
    },
    {
        "subject": "math",
        "domain": "Problem-solving and data analysis",
        "difficulty": "medium",
        "prompt": "A line passes through (2, 9) and (6, 21). Which equation describes the line?",
        "choices": ["y = 2x + 5", "y = 3x + 3", "y = 4x + 1", "y = 6x - 3"],
        "answer": 1,
        "explanation": "The slope is (21 - 9) / (6 - 2) = 3, and substituting (2, 9) gives an intercept of 3.",
    },
    {
        "subject": "math",
        "domain": "Advanced math",
        "difficulty": "hard",
        "prompt": "For x > 0, the expression (x² - 25) / (x - 5) is equivalent to which expression?",
        "choices": ["x - 5", "x + 5", "x² + 5", "x² - 5"],
        "answer": 1,
        "explanation": "Factor x² - 25 as (x - 5)(x + 5), then cancel x - 5.",
    },
    {
        "subject": "reading",
        "domain": "Central ideas and details",
        "difficulty": "easy",
        "prompt": "A researcher observed that community gardens were used most often when they included seating and shade. Which conclusion is best supported?",
        "choices": ["Visitors prefer gardens with places to rest.", "Gardens without plants are more popular.", "Shade prevents people from gardening.", "Community gardens are only used in summer."],
        "answer": 0,
        "explanation": "The observation directly connects seating and shade with more frequent use.",
    },
    {
        "subject": "reading",
        "domain": "Craft and structure",
        "difficulty": "medium",
        "prompt": "In an article, the author first describes a failed public transit pilot and then explains the small redesign that made it useful. The structure primarily serves to:",
        "choices": ["compare two unrelated cities", "show how an outcome changed after a specific intervention", "list the history of public transit", "argue that pilots should never be attempted"],
        "answer": 1,
        "explanation": "The sequence creates a before-and-after explanation centered on the redesign.",
    },
    {
        "subject": "reading",
        "domain": "Expression of ideas",
        "difficulty": "hard",
        "prompt": "The map was visually striking; ______, its labels were too small to help a first-time visitor navigate the station.",
        "choices": ["for example", "however", "similarly", "therefore"],
        "answer": 1,
        "explanation": "However signals the contrast between visual appeal and practical usability.",
    },
]


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def hash_password(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
    return f"{salt}${digest}"


def verify_password(password, encoded):
    salt, expected = encoded.split("$", 1)
    actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
    return secrets.compare_digest(actual, expected)


class NorthstarStore:
    def __init__(self, path="northstar.sqlite3"):
        self.path = path
        self.lock = threading.Lock()
        self.initialize()

    def connect(self):
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        return connection

    def initialize(self):
        with self.connect() as db:
            db.executescript(
                """
                PRAGMA foreign_keys = ON;
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    expires_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS questions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    subject TEXT NOT NULL,
                    domain TEXT NOT NULL,
                    difficulty TEXT NOT NULL,
                    prompt TEXT NOT NULL,
                    choices_json TEXT NOT NULL,
                    answer INTEGER NOT NULL,
                    explanation TEXT NOT NULL,
                    source TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS attempts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    question_id INTEGER NOT NULL REFERENCES questions(id),
                    selected_answer INTEGER,
                    correct INTEGER NOT NULL,
                    score_delta INTEGER NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )
            count = db.execute("SELECT COUNT(*) FROM questions").fetchone()[0]
            if count == 0:
                db.executemany(
                    """
                    INSERT INTO questions
                    (subject, domain, difficulty, prompt, choices_json, answer, explanation, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'Northstar original')
                    """,
                    [
                        (
                            item["subject"],
                            item["domain"],
                            item["difficulty"],
                            item["prompt"],
                            json.dumps(item["choices"]),
                            item["answer"],
                            item["explanation"],
                        )
                        for item in QUESTION_SEED
                    ],
                )

    def create_user(self, email, password):
        email = email.strip().lower()
        if len(email) < 5 or "@" not in email:
            raise ValueError("Enter a valid email address.")
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters.")
        with self.lock, self.connect() as db:
            try:
                cursor = db.execute(
                    "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
                    (email, hash_password(password), utc_now()),
                )
            except sqlite3.IntegrityError as error:
                raise ValueError("An account with that email already exists.") from error
            return {"id": cursor.lastrowid, "email": email}

    def authenticate(self, email, password):
        with self.connect() as db:
            row = db.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),)).fetchone()
        if row and verify_password(password, row["password_hash"]):
            return {"id": row["id"], "email": row["email"]}
        return None

    def create_session(self, user_id):
        token = secrets.token_urlsafe(32)
        with self.connect() as db:
            db.execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", (token, user_id, utc_now()))
        return token

    def user_for_session(self, token):
        if not token:
            return None
        with self.connect() as db:
            row = db.execute(
                "SELECT users.id, users.email FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ?",
                (token,),
            ).fetchone()
        return dict(row) if row else None

    def get_questions(self, subject=None, difficulty=None, limit=10):
        clauses, values = [], []
        if subject:
            clauses.append("subject = ?")
            values.append(subject)
        if difficulty:
            clauses.append("difficulty = ?")
            values.append(difficulty)
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        with self.connect() as db:
            rows = db.execute(f"SELECT * FROM questions {where} ORDER BY id LIMIT ?", (*values, limit)).fetchall()
        return [self.public_question(row) for row in rows]

    def next_question(self, user_id, subject):
        with self.connect() as db:
            recent = db.execute(
                """
                SELECT q.difficulty, a.correct
                FROM attempts a JOIN questions q ON q.id = a.question_id
                WHERE a.user_id = ? AND q.subject = ?
                ORDER BY a.id DESC LIMIT 5
                """,
                (user_id, subject),
            ).fetchall()
        difficulty = "medium"
        if len(recent) >= 2 and sum(row["correct"] for row in recent[:2]) == 2:
            difficulty = "hard"
        elif recent and sum(row["correct"] for row in recent[:2]) == 0:
            difficulty = "easy"
        questions = self.get_questions(subject, difficulty, 1)
        return questions[0] if questions else self.get_questions(subject, None, 1)[0]

    def record_attempt(self, user_id, question_id, selected_answer, correct, score_delta):
        with self.connect() as db:
            db.execute(
                """
                INSERT INTO attempts
                (user_id, question_id, selected_answer, correct, score_delta, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, question_id, selected_answer, int(correct), score_delta, utc_now()),
            )

    @staticmethod
    def public_question(row):
        return {
            "id": row["id"],
            "subject": row["subject"],
            "domain": row["domain"],
            "difficulty": row["difficulty"],
            "prompt": row["prompt"],
            "choices": json.loads(row["choices_json"]),
            "source": row["source"],
        }

    def question_with_answer(self, question_id):
        with self.connect() as db:
            return db.execute("SELECT * FROM questions WHERE id = ?", (question_id,)).fetchone()


class NorthstarHandler(http.server.SimpleHTTPRequestHandler):
    store = None

    def log_message(self, format, *args):
        return

    def send_json(self, status, payload, headers=None):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length) or b"{}")

    def session_user(self):
        cookies = http.cookies.SimpleCookie(self.headers.get("Cookie", ""))
        token = cookies.get("northstar_session")
        return self.store.user_for_session(token.value if token else None)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/session":
            user = self.session_user()
            return self.send_json(200, {"authenticated": bool(user), "user": user})
        if parsed.path == "/api/questions":
            query = urllib.parse.parse_qs(parsed.query)
            questions = self.store.get_questions(
                query.get("subject", [None])[0],
                query.get("difficulty", [None])[0],
                min(int(query.get("limit", ["10"])[0]), 30),
            )
            return self.send_json(200, {"questions": questions})
        if parsed.path == "/api/questions/next":
            user = self.session_user()
            if not user:
                return self.send_json(401, {"error": "Sign in to get an adaptive question."})
            query = urllib.parse.parse_qs(parsed.query)
            question = self.store.next_question(user["id"], query.get("subject", ["math"])[0])
            return self.send_json(200, question)
        if parsed.path == "/api/health":
            return self.send_json(200, {"ok": True, "database": self.store.path})
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        try:
            payload = self.read_json()
            if parsed.path == "/api/signup":
                user = self.store.create_user(payload.get("email", ""), payload.get("password", ""))
                return self.set_session(user, 201)
            if parsed.path == "/api/login":
                user = self.store.authenticate(payload.get("email", ""), payload.get("password", ""))
                if not user:
                    return self.send_json(401, {"error": "Email or password is incorrect."})
                return self.set_session(user, 200)
            if parsed.path == "/api/logout":
                response = self.send_json(200, {"ok": True}, {"Set-Cookie": "northstar_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax"})
                return response
            if parsed.path == "/api/attempts":
                user = self.session_user()
                if not user:
                    return self.send_json(401, {"error": "Sign in to save practice progress."})
                question = self.store.question_with_answer(int(payload["questionId"]))
                selected = int(payload["selectedAnswer"])
                correct = selected == question["answer"]
                delta = 12 if correct else -6
                self.store.record_attempt(user["id"], question["id"], selected, correct, delta)
                return self.send_json(201, {"correct": correct, "explanation": question["explanation"], "scoreDelta": delta})
            return self.send_json(404, {"error": "Not found"})
        except ValueError as error:
            return self.send_json(400, {"error": str(error)})
        except (KeyError, json.JSONDecodeError):
            return self.send_json(400, {"error": "Invalid JSON request."})

    def set_session(self, user, status):
        token = self.store.create_session(user["id"])
        return self.send_json(
            status,
            {"user": user},
            {"Set-Cookie": f"northstar_session={token}; Max-Age=2592000; Path=/; HttpOnly; SameSite=Lax"},
        )


class NorthstarHTTPServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = True

    def start_in_thread(self):
        self.thread = threading.Thread(target=self.serve_forever, daemon=True)
        self.thread.start()


def create_server(host="127.0.0.1", port=4173, db_path="northstar.sqlite3"):
    NorthstarHandler.store = NorthstarStore(db_path)
    server = NorthstarHTTPServer((host, port), NorthstarHandler)
    server.port = server.server_address[1]
    return server


if __name__ == "__main__":
    server = create_server()
    print(f"Northstar running at http://127.0.0.1:{server.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()
