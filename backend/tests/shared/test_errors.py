import pytest

from shared.errors import (
    AppException,
    ContentUnsafeError,
    ErrorCode,
    ErrorCodes,
    ForbiddenError,
    IntegrationError,
    KnowledgeAIError,
    KnowledgeDuplicateError,
    KnowledgeNotFoundError,
    KnowledgeSensitiveHitError,
    KnowledgeServiceException,
    NotFoundError,
    RateLimitedError,
    UnauthorizedError,
    ValidationError,
    error_response,
)


class TestErrorCode:
    def test_attributes_are_set(self):
        ec = ErrorCode("TEST_CODE", 418, "Test message")
        assert ec.code == "TEST_CODE"
        assert ec.http_status == 418
        assert ec.message == "Test message"

    def test_is_dataclass(self):
        ec = ErrorCode("A", 400, "msg")
        assert ec == ErrorCode("A", 400, "msg")
        assert ec != ErrorCode("B", 400, "msg")


class TestErrorCodes:
    @pytest.mark.parametrize(
        "attr,expected_code,expected_status,expected_message",
        [
            ("UNAUTHORIZED", "UNAUTHORIZED", 401, "Authentication required or token expired"),
            ("FORBIDDEN", "FORBIDDEN", 403, "Insufficient permissions"),
            ("NOT_FOUND", "NOT_FOUND", 404, "Resource not found"),
            ("CONTENT_UNSAFE", "CONTENT_UNSAFE", 400, "Content violates community guidelines"),
            ("VALIDATION_ERROR", "VALIDATION_ERROR", 422, "Request validation failed"),
            ("RATE_LIMITED", "RATE_LIMITED", 429, "Request rate limit exceeded"),
            ("INTERNAL_ERROR", "INTERNAL_ERROR", 500, "Internal server error"),
            ("SERVICE_UNAVAILABLE", "SERVICE_UNAVAILABLE", 503, "Dependency service unavailable"),
            ("INTEGRATION_ERROR", "INTEGRATION_ERROR", 502, "Internal service call failed"),
            ("AUTH_FAILED", "AUTH_FAILED", 401, "Authentication failed"),
            ("INVALID_CREDENTIALS", "INVALID_CREDENTIALS", 401, "Invalid username or password"),
            ("KNOWLEDGE_NOT_FOUND", "KNOWLEDGE_NOT_FOUND", 404, "Knowledge resource not found"),
            ("KNOWLEDGE_VALIDATION_ERROR", "KNOWLEDGE_VALIDATION_ERROR", 422, "Knowledge service validation failed"),
            ("KNOWLEDGE_DUPLICATE", "KNOWLEDGE_DUPLICATE", 409, "Resource name already exists"),
            ("KNOWLEDGE_INTERNAL_ERROR", "KNOWLEDGE_INTERNAL_ERROR", 500, "Knowledge service internal error"),
            ("KNOWLEDGE_AI_ERROR", "KNOWLEDGE_AI_ERROR", 502, "AI generation service error"),
            ("KNOWLEDGE_SENSITIVE_HIT", "KNOWLEDGE_SENSITIVE_HIT", 400, "Content contains sensitive words"),
            ("KNOWLEDGE_UNSAFE_CONTENT", "KNOWLEDGE_UNSAFE_CONTENT", 400, "Content flagged as unsafe by AI review"),
        ],
    )
    def test_constant(self, attr, expected_code, expected_status, expected_message):
        ec: ErrorCode = getattr(ErrorCodes, attr)
        assert ec.code == expected_code
        assert ec.http_status == expected_status
        assert ec.message == expected_message


class TestAppException:
    def test_default_message_from_error_code(self):
        exc = AppException(ErrorCodes.NOT_FOUND)
        assert exc.message == "Resource not found"
        assert exc.error_code == ErrorCodes.NOT_FOUND
        assert exc.detail == {}

    def test_custom_message_overrides_default(self):
        exc = AppException(ErrorCodes.NOT_FOUND, message="Custom message")
        assert exc.message == "Custom message"

    def test_detail_dict(self):
        exc = AppException(ErrorCodes.NOT_FOUND, detail={"resource_id": 42})
        assert exc.detail == {"resource_id": 42}

    def test_detail_defaults_to_empty_dict(self):
        exc = AppException(ErrorCodes.NOT_FOUND)
        assert exc.detail == {}

    def test_detail_defaults_when_none(self):
        exc = AppException(ErrorCodes.NOT_FOUND, detail=None)
        assert exc.detail == {}

    def test_to_dict(self):
        exc = AppException(
            ErrorCodes.FORBIDDEN,
            message="Access denied",
            detail={"role": "guest"},
        )
        assert exc.to_dict() == {
            "code": "FORBIDDEN",
            "message": "Access denied",
            "data": None,
            "detail": {"role": "guest"},
        }

    def test_http_status_property(self):
        exc = AppException(ErrorCodes.RATE_LIMITED)
        assert exc.http_status == 429

    def test_is_exception_subclass(self):
        exc = AppException(ErrorCodes.INTERNAL_ERROR)
        assert isinstance(exc, Exception)


class TestSimpleSubclasses:
    @pytest.mark.parametrize(
        "exc_class,expected_code,expected_status,expected_message",
        [
            (UnauthorizedError, "UNAUTHORIZED", 401, "Authentication required or token expired"),
            (ForbiddenError, "FORBIDDEN", 403, "Insufficient permissions"),
            (NotFoundError, "NOT_FOUND", 404, "Resource not found"),
            (ContentUnsafeError, "CONTENT_UNSAFE", 400, "Content violates community guidelines"),
            (ValidationError, "VALIDATION_ERROR", 422, "Request validation failed"),
            (RateLimitedError, "RATE_LIMITED", 429, "Request rate limit exceeded"),
            (IntegrationError, "INTEGRATION_ERROR", 502, "Internal service call failed"),
        ],
    )
    def test_default_construction(self, exc_class, expected_code, expected_status, expected_message):
        exc = exc_class()
        assert exc.error_code.code == expected_code
        assert exc.http_status == expected_status
        assert exc.message == expected_message
        assert exc.detail == {}

    @pytest.mark.parametrize(
        "exc_class,expected_code",
        [
            (UnauthorizedError, "UNAUTHORIZED"),
            (ForbiddenError, "FORBIDDEN"),
            (NotFoundError, "NOT_FOUND"),
            (ContentUnsafeError, "CONTENT_UNSAFE"),
            (ValidationError, "VALIDATION_ERROR"),
            (RateLimitedError, "RATE_LIMITED"),
            (IntegrationError, "INTEGRATION_ERROR"),
        ],
    )
    def test_custom_message_and_detail(self, exc_class, expected_code):
        exc = exc_class(message="custom", detail={"key": "val"})
        assert exc.message == "custom"
        assert exc.detail == {"key": "val"}
        assert exc.error_code.code == expected_code

    @pytest.mark.parametrize(
        "exc_class",
        [
            UnauthorizedError,
            ForbiddenError,
            NotFoundError,
            ContentUnsafeError,
            ValidationError,
            RateLimitedError,
            IntegrationError,
        ],
    )
    def test_is_app_exception(self, exc_class):
        assert issubclass(exc_class, AppException)


class TestKnowledgeServiceException:
    def test_dynamic_error_code(self):
        exc = KnowledgeServiceException("MY_CODE", "Something went wrong", status_code=400)
        assert exc.error_code.code == "MY_CODE"
        assert exc.message == "Something went wrong"
        assert exc.http_status == 400

    def test_default_status_code(self):
        exc = KnowledgeServiceException("MY_CODE", "msg")
        assert exc.http_status == 500

    def test_detail(self):
        exc = KnowledgeServiceException("MY_CODE", "msg", detail={"field": "value"})
        assert exc.detail == {"field": "value"}

    def test_is_app_exception(self):
        assert issubclass(KnowledgeServiceException, AppException)

    def test_to_dict(self):
        exc = KnowledgeServiceException("KS_ERROR", "ks message", status_code=422, detail={"x": 1})
        assert exc.to_dict() == {
            "code": "KS_ERROR",
            "message": "ks message",
            "data": None,
            "detail": {"x": 1},
        }


class TestKnowledgeSubclasses:
    @pytest.mark.parametrize(
        "exc_class,expected_code,expected_status,expected_message",
        [
            (KnowledgeNotFoundError, "KNOWLEDGE_NOT_FOUND", 404, "Knowledge resource not found"),
            (KnowledgeDuplicateError, "KNOWLEDGE_DUPLICATE", 409, "Resource name already exists"),
            (KnowledgeAIError, "KNOWLEDGE_AI_ERROR", 502, "AI generation service error"),
            (KnowledgeSensitiveHitError, "KNOWLEDGE_SENSITIVE_HIT", 400, "Content contains sensitive words"),
        ],
    )
    def test_default_construction(self, exc_class, expected_code, expected_status, expected_message):
        exc = exc_class()
        assert exc.error_code.code == expected_code
        assert exc.http_status == expected_status
        assert exc.message == expected_message

    @pytest.mark.parametrize(
        "exc_class,expected_code",
        [
            (KnowledgeNotFoundError, "KNOWLEDGE_NOT_FOUND"),
            (KnowledgeDuplicateError, "KNOWLEDGE_DUPLICATE"),
            (KnowledgeAIError, "KNOWLEDGE_AI_ERROR"),
            (KnowledgeSensitiveHitError, "KNOWLEDGE_SENSITIVE_HIT"),
        ],
    )
    def test_custom_message_and_detail(self, exc_class, expected_code):
        exc = exc_class(message="custom msg", detail={"item": "x"})
        assert exc.message == "custom msg"
        assert exc.detail == {"item": "x"}
        assert exc.error_code.code == expected_code

    @pytest.mark.parametrize(
        "exc_class",
        [
            KnowledgeNotFoundError,
            KnowledgeDuplicateError,
            KnowledgeAIError,
            KnowledgeSensitiveHitError,
        ],
    )
    def test_is_app_exception(self, exc_class):
        assert issubclass(exc_class, AppException)


class TestErrorResponse:
    def test_default_message(self):
        result = error_response(ErrorCodes.UNAUTHORIZED)
        assert result == {
            "code": "UNAUTHORIZED",
            "message": "Authentication required or token expired",
            "data": None,
            "detail": {},
        }

    def test_custom_message(self):
        result = error_response(ErrorCodes.NOT_FOUND, message="Custom not found")
        assert result["message"] == "Custom not found"

    def test_custom_detail(self):
        result = error_response(ErrorCodes.VALIDATION_ERROR, detail={"field": "name"})
        assert result["detail"] == {"field": "name"}

    def test_detail_defaults_to_empty(self):
        result = error_response(ErrorCodes.INTERNAL_ERROR)
        assert result["detail"] == {}

    def test_preserves_error_code_http_status(self):
        result = error_response(ErrorCodes.RATE_LIMITED)
        assert result["code"] == "RATE_LIMITED"
