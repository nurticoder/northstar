import unittest

from engine.score import estimate_score, mastery_by_domain
from engine.select import Attempt, Question, select_question, target_difficulty


class SelectionTests(unittest.TestCase):
    def setUp(self):
        self.questions = [
            Question("a", "school-a", "math", "Algebra", "easy"),
            Question("b", "school-a", "math", "Algebra", "medium"),
            Question("c", "school-a", "math", "Geometry", "hard"),
            Question("d", "school-b", "math", "Algebra", "hard"),
        ]

    def test_correct_streak_targets_hard(self):
        attempts = [Attempt("a", "math", "Algebra", "easy", True)] * 2
        self.assertEqual(target_difficulty(attempts), "hard")
        self.assertEqual(select_question(self.questions, attempts, school_id="school-a", subject="math").id, "c")

    def test_selection_does_not_cross_school_boundary(self):
        result = select_question([], [], school_id="school-a", subject="math")
        self.assertIsNone(result)
        result = select_question(self.questions, [], school_id="school-a", subject="math")
        self.assertNotEqual(result.id, "d")


class ScoringTests(unittest.TestCase):
    def test_estimate_score_bounds_and_accuracy(self):
        result = estimate_score(3, 4)
        self.assertEqual(result.estimated_score, 650)
        self.assertEqual(result.accuracy, 0.75)

    def test_rejects_invalid_counts(self):
        with self.assertRaises(ValueError):
            estimate_score(5, 4)

    def test_mastery_groups_domains(self):
        result = mastery_by_domain([("Algebra", True), ("Algebra", False), ("Geometry", True)])
        self.assertEqual(result, {"Algebra": 0.5, "Geometry": 1.0})


if __name__ == "__main__":
    unittest.main()
