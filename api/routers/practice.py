"""Practice router contracts for adaptive question delivery."""

try:
    from fastapi import APIRouter, HTTPException
    from pydantic import BaseModel
except ImportError:
    APIRouter = None

    class BaseModel:
        pass

    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str):
            self.status_code = status_code
            self.detail = detail


class AttemptRequest(BaseModel):
    school_id: str
    question_id: str
    selected_index: int


def build_router(practice_service):
    if APIRouter is None:
        raise RuntimeError("Install fastapi and pydantic to build API routers.")
    router = APIRouter(prefix="/practice", tags=["practice"])

    @router.get("/next")
    def next_question(school_id: str, student_id: str, subject: str = "math"):
        question = practice_service.next_question(school_id, student_id, subject)
        if not question:
            raise HTTPException(status_code=404, detail="No eligible question found.")
        return question

    @router.post("/attempts")
    def submit_attempt(payload: AttemptRequest, student_id: str):
        return practice_service.record_attempt(
            school_id=payload.school_id,
            student_id=student_id,
            question_id=payload.question_id,
            selected_index=payload.selected_index,
        )

    return router
