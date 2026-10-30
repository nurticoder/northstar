"""Safe tutor context and explanation helpers."""

from dataclasses import dataclass


@dataclass(frozen=True)
class TutorQuestion:
    prompt: str
    choices: tuple[str, ...]
    explanation: str
    answer_index: int


def build_tutor_prompt(question: TutorQuestion, selected_index: int | None, submitted: bool) -> str:
    """Build a bounded prompt that protects the hidden answer before submission."""
    if not submitted:
        return (
            "You are a Northstar study coach. Do not solve or reveal the answer. "
            "Ask one Socratic question that helps the student identify the relevant concept.\n\n"
            f"Question:\n{question.prompt}"
        )

    choice = question.choices[selected_index] if selected_index is not None and 0 <= selected_index < len(question.choices) else "No choice selected"
    return (
        "You are a Northstar study coach. Give a concise, encouraging explanation. "
        "Name the concept, explain the student's selected choice, and then show the correct reasoning. "
        "Label this as generated guidance.\n\n"
        f"Question:\n{question.prompt}\n"
        f"Selected choice:\n{choice}\n"
        f"Stored explanation:\n{question.explanation}"
    )


def tutor_response(question: TutorQuestion, selected_index: int | None, submitted: bool) -> dict[str, str]:
    return {
        "label": "Generated guidance",
        "prompt": build_tutor_prompt(question, selected_index, submitted),
    }
