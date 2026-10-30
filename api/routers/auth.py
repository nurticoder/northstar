"""Authentication router contracts for the FastAPI application."""

from dataclasses import dataclass

try:
    from fastapi import APIRouter, HTTPException
    from pydantic import BaseModel, EmailStr
except ImportError:  # Keeps schema inspection possible before API dependencies install.
    APIRouter = None

    class BaseModel:
        pass

    class EmailStr(str):
        pass

    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str):
            self.status_code = status_code
            self.detail = detail


class AuthRequest(BaseModel):
    email: EmailStr
    password: str
    school_id: str
    role: str = "student"


class AuthResponse(BaseModel):
    user_id: str
    school_id: str
    role: str
    access_token: str


@dataclass
class AuthService:
    """Application service boundary; persistence is injected by the host."""

    create_account: object
    verify_account: object


def build_router(service: AuthService):
    if APIRouter is None:
        raise RuntimeError("Install fastapi and pydantic to build API routers.")
    router = APIRouter(prefix="/auth", tags=["auth"])

    @router.post("/signup", response_model=AuthResponse)
    def signup(payload: AuthRequest):
        if payload.role not in {"student", "teacher", "admin"}:
            raise HTTPException(status_code=400, detail="Unsupported role.")
        return service.create_account(payload)

    @router.post("/login", response_model=AuthResponse)
    def login(payload: AuthRequest):
        result = service.verify_account(payload)
        if not result:
            raise HTTPException(status_code=401, detail="Email or password is incorrect.")
        return result

    return router
