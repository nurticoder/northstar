import json
import os
import tempfile
import unittest
from http.cookiejar import CookieJar
from urllib.request import HTTPCookieProcessor, build_opener, Request

from server import NorthstarStore, create_server


class NorthstarStoreTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "test.sqlite3")
        self.store = NorthstarStore(self.db_path)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_creates_user_and_verifies_password(self):
        user = self.store.create_user("student@example.com", "correct horse")
        self.assertEqual(user["email"], "student@example.com")
        self.assertIsNotNone(self.store.authenticate("student@example.com", "correct horse"))
        self.assertIsNone(self.store.authenticate("student@example.com", "wrong password"))

    def test_seeded_question_bank_has_original_practice_items(self):
        questions = self.store.get_questions("math", None, 5)
        self.assertGreaterEqual(len(questions), 2)
        self.assertTrue(all(question["source"] == "Northstar original" for question in questions))
        self.assertTrue(all(len(question["choices"]) == 4 for question in questions))

    def test_adaptive_selection_moves_difficulty_after_attempts(self):
        user = self.store.create_user("adaptive@example.com", "password")
        first = self.store.next_question(user["id"], "math")
        self.store.record_attempt(user["id"], first["id"], 0, True, 600)
        second = self.store.next_question(user["id"], "math")
        self.assertIn(second["difficulty"], {"medium", "hard"})


class NorthstarHttpTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.server = create_server("127.0.0.1", 0, os.path.join(self.temp_dir.name, "http.sqlite3"))
        self.server.start_in_thread()
        self.opener = build_opener(HTTPCookieProcessor(CookieJar()))

    def tearDown(self):
        self.server.shutdown()
        self.temp_dir.cleanup()

    def request_json(self, path, payload=None):
        body = json.dumps(payload).encode() if payload is not None else None
        request = Request(
            f"http://127.0.0.1:{self.server.port}{path}",
            data=body,
            headers={"Content-Type": "application/json"} if body else {},
        )
        with self.opener.open(request) as response:
            return response.status, json.loads(response.read())

    def test_signup_session_and_question_flow(self):
        status, signup = self.request_json(
            "/api/signup",
            {"email": "flow@example.com", "password": "secure password"},
        )
        self.assertEqual(status, 201)
        self.assertEqual(signup["user"]["email"], "flow@example.com")

        status, session = self.request_json("/api/session")
        self.assertEqual(status, 200)
        self.assertTrue(session["authenticated"])

        status, question = self.request_json("/api/questions/next?subject=math")
        self.assertEqual(status, 200)
        self.assertEqual(len(question["choices"]), 4)


if __name__ == "__main__":
    unittest.main()
