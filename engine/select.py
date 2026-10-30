"""Deterministic adaptive question selection."""

from dataclasses import dataclass
from typing import Iterable, Sequence


DIFFICULTIES = ("easy", "medium", "hard")


@dataclass(frozen=True)
class Question:
    id: str
    school_id: str
    subject: str
    domain: str
    difficulty: str


@dataclass(frozen=True)
class Attempt:
    question_id: str
    subject: str
    domain: str
    difficulty: str
    correct: bool


def target_difficulty(attempts: Sequence[Attempt]) -> str:
    recent = attempts[-5:]
    if len(recent) >= 2 and sum(item.correct for item in recent[-2:]) == 2:
        return "hard"
    if len(recent) >= 2 and sum(item.correct for item in recent[-2:]) == 0:
        return "easy"
    return "medium"


def select_question(
    questions: Iterable[Question],
    attempts: Sequence[Attempt],
    *,
    school_id: str,
    subject: str,
) -> Question | None:
    scoped = [item for item in questions if item.school_id == school_id and item.subject == subject]
    if not scoped:
        return None

    target = target_difficulty(attempts)
    seen = {item.question_id for item in attempts}
    domain_counts: dict[str, int] = {}
    for attempt in attempts:
        domain_counts[attempt.domain] = domain_counts.get(attempt.domain, 0) + 1

    ranked = sorted(
        scoped,
        key=lambda item: (
            item.difficulty != target,
            item.id in seen,
            domain_counts.get(item.domain, 0),
            item.id,
        ),
    )
    return ranked[0]
