from dataclasses import dataclass, field
from typing import Any


@dataclass
class ErrorCode:
    code: str
    http_status: int
    message: str


class ErrorCodes:
    UNAUTHORIZED = ErrorCode("UNAUTHORIZED", 401, "Authentication required or token expired")
    FORBIDDEN = ErrorCode("FORBIDDEN", 403, "Insufficient permissions")
    NOT_FOUND = ErrorCode("NOT_FOUND", 404, "Resource not found")
    CONTENT_UNSAFE = ErrorCode("CONTENT_UNSAFE", 400, "Content violates community guidelines")
    VALIDATION_ERROR = ErrorCode("VALIDATION_ERROR", 422, "Request validation failed")
    RATE_LIMITED = ErrorCode("RATE_LIMITED", 429, "Request rate limit exceeded")
    INTERNAL_ERROR = ErrorCode("INTERNAL_ERROR", 500, "Internal server error")
    SERVICE_UNAVAILABLE = ErrorCode("SERVICE_UNAVAILABLE", 503, "Dependency service unavailable")
    INTEGRATION_ERROR = ErrorCode("INTEGRATION_ERROR", 502, "Internal service call failed")

    KNOWLEDGE_NOT_FOUND = ErrorCode("KNOWLEDGE_NOT_FOUND", 404, "Knowledge resource not found")
    KNOWLEDGE_VALIDATION_ERROR = ErrorCode("KNOWLEDGE_VALIDATION_ERROR", 422, "Knowledge service validation failed")
    KNOWLEDGE_DUPLICATE = ErrorCode("KNOWLEDGE_DUPLICATE", 409, "Resource name already exists")
    KNOWLEDGE_INTERNAL_ERROR = ErrorCode("KNOWLEDGE_INTERNAL_ERROR", 500, "Knowledge service internal error")
    KNOWLEDGE_AI_ERROR = ErrorCode("KNOWLEDGE_AI_ERROR", 502, "AI generation service error")
    KNOWLEDGE_SENSITIVE_HIT = ErrorCode("KNOWLEDGE_SENSITIVE_HIT", 400, "Content contains sensitive words")
    KNOWLEDGE_UNSAFE_CONTENT = ErrorCode("KNOWLEDGE_UNSAFE_CONTENT", 400, "Content flagged as unsafe by AI review")


class AppException(Exception):
    def __init__(
        self,
        error_code: ErrorCode,
        message: str | None = None,
        detail: dict[str, Any] | None = None,
    ):
        self.error_code = error_code
        self.message = message or error_code.message
        self.detail = detail or {}

    def to_dict(self) -> dict[str, Any]:
        return {
            "error": {
                "code": self.error_code.code,
                "message": self.message,
                "detail": self.detail,
            }
        }

    @property
    def http_status(self) -> int:
        return self.error_code.http_status


class UnauthorizedError(AppException):
    def __init__(self, message: str | None = None, detail: dict[str, Any] | None = None):
        super().__init__(ErrorCodes.UNAUTHORIZED, message, detail)


class ForbiddenError(AppException):
    def __init__(self, message: str | None = None, detail: dict[str, Any] | None = None):
        super().__init__(ErrorCodes.FORBIDDEN, message, detail)


class NotFoundError(AppException):
    def __init__(self, message: str | None = None, detail: dict[str, Any] | None = None):
        super().__init__(ErrorCodes.NOT_FOUND, message, detail)


class ContentUnsafeError(AppException):
    def __init__(self, message: str | None = None, detail: dict[str, Any] | None = None):
        super().__init__(ErrorCodes.CONTENT_UNSAFE, message, detail)


class ValidationError(AppException):
    def __init__(self, message: str | None = None, detail: dict[str, Any] | None = None):
        super().__init__(ErrorCodes.VALIDATION_ERROR, message, detail)


class RateLimitedError(AppException):
    def __init__(self, message: str | None = None, detail: dict[str, Any] | None = None):
        super().__init__(ErrorCodes.RATE_LIMITED, message, detail)


class IntegrationError(AppException):
    def __init__(self, message: str | None = None, detail: dict[str, Any] | None = None):
        super().__init__(ErrorCodes.INTEGRATION_ERROR, message, detail)


class KnowledgeServiceException(AppException):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 500,
        detail: dict[str, Any] | None = None,
    ):
        error_code = ErrorCode(code, status_code, message)
        super().__init__(error_code, message, detail)


class KnowledgeNotFoundError(AppException):
    def __init__(self, message: str | None = None, detail: dict[str, Any] | None = None):
        super().__init__(ErrorCodes.KNOWLEDGE_NOT_FOUND, message, detail)


class KnowledgeDuplicateError(AppException):
    def __init__(self, message: str | None = None, detail: dict[str, Any] | None = None):
        super().__init__(ErrorCodes.KNOWLEDGE_DUPLICATE, message, detail)


class KnowledgeAIError(AppException):
    def __init__(self, message: str | None = None, detail: dict[str, Any] | None = None):
        super().__init__(ErrorCodes.KNOWLEDGE_AI_ERROR, message, detail)


class KnowledgeSensitiveHitError(AppException):
    def __init__(self, message: str | None = None, detail: dict[str, Any] | None = None):
        super().__init__(ErrorCodes.KNOWLEDGE_SENSITIVE_HIT, message, detail)


def error_response(error_code: ErrorCode, message: str | None = None, detail: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "error": {
            "code": error_code.code,
            "message": message or error_code.message,
            "detail": detail or {},
        }
    }
