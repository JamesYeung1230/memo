import uuid
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int = 1
    page_size: int = 20
    total: int = 0


class SuccessResponse(BaseModel, Generic[T]):
    code: int = 0
    message: str = "success"
    data: T
    meta: PaginationMeta | None = None
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class ErrorDetail(BaseModel):
    code: str
    message: str
    detail: dict[str, Any] = {}


class ErrorResponse(BaseModel):
    error: ErrorDetail


def success(data: T, meta: PaginationMeta | None = None) -> SuccessResponse[T]:
    return SuccessResponse(data=data, meta=meta)


def paginated(data: list[T], total: int, page: int = 1, page_size: int = 20) -> SuccessResponse[list[T]]:
    return SuccessResponse(
        data=data,
        meta=PaginationMeta(page=page, page_size=page_size, total=total),
    )
