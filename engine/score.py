"""Pure scoring helpers for Northstar practice analytics."""

from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class ScoreEstimate:
    correct: int
    total: int
    accuracy: float
    estimated_score: int


def estimate_score(correct: int, total: int, *, minimum: int = 200, maximum: int = 800) -> ScoreEstimate:
    if total <= 0:
        raise ValueError("total must be greater than zero")
    if correct < 0 or correct > total:
        raise ValueError("correct must be between zero and total")
    accuracy = correct / total
    estimated = round(minimum + accuracy * (maximum - minimum))
    return ScoreEstimate(correct, total, round(accuracy, 4), estimated)


def mastery_by_domain(rows: Iterable[tuple[str, bool]]) -> dict[str, float]:
    totals: dict[str, list[int]] = {}
    for domain, correct in rows:
        if domain not in totals:
            totals[domain] = [0, 0]
        totals[domain][0] += int(correct)
        totals[domain][1] += 1
    return {
        domain: round(correct / total, 4)
        for domain, (correct, total) in totals.items()
        if total
    }
