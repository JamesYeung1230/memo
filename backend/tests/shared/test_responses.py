import pytest
from pydantic import ValidationError

from shared.responses import (
    ErrorDetail,
    ErrorResponse,
    PaginationMeta,
    SuccessResponse,
    paginated,
    success,
)


class TestPaginationMeta:
    def test_default_values(self):
        meta = PaginationMeta()
        assert meta.page == 1
        assert meta.page_size == 20
        assert meta.total == 0

    def test_custom_values(self):
        meta = PaginationMeta(page=3, page_size=10, total=100)
        assert meta.page == 3
        assert meta.page_size == 10
        assert meta.total == 100

    def test_partial_custom(self):
        meta = PaginationMeta(total=50)
        assert meta.page == 1
        assert meta.page_size == 20
        assert meta.total == 50


class TestSuccessResponse:
    def test_with_single_data(self):
        resp = SuccessResponse(data={"id": 1, "name": "test"})
        assert resp.code == 0
        assert resp.message == "success"
        assert resp.data == {"id": 1, "name": "test"}
        assert resp.meta is None

    def test_with_list_data(self):
        resp = SuccessResponse(data=[1, 2, 3])
        assert resp.code == 0
        assert resp.message == "success"
        assert resp.data == [1, 2, 3]
        assert resp.meta is None

    def test_with_string_data(self):
        resp = SuccessResponse(data="hello")
        assert resp.code == 0
        assert resp.data == "hello"

    def test_with_int_data(self):
        resp = SuccessResponse(data=42)
        assert resp.code == 0
        assert resp.data == 42

    def test_with_pagination_meta(self):
        meta = PaginationMeta(page=1, page_size=20, total=5)
        resp = SuccessResponse(data=["a", "b"], meta=meta)
        assert resp.code == 0
        assert resp.message == "success"
        assert resp.data == ["a", "b"]
        assert resp.meta == meta

    def test_generic_type_preserved_at_runtime(self):
        resp = SuccessResponse[str](data="text")
        assert resp.code == 0
        assert resp.data == "text"

    def test_request_id_is_generated(self):
        resp = SuccessResponse(data=None)
        assert len(resp.request_id) == 36
        assert resp.request_id.count("-") == 4


class TestErrorDetail:
    def test_default_detail(self):
        err = ErrorDetail(code="NOT_FOUND", message="Not found")
        assert err.code == "NOT_FOUND"
        assert err.message == "Not found"
        assert err.detail == {}

    def test_custom_detail(self):
        err = ErrorDetail(code="VALIDATION_ERROR", message="Invalid", detail={"field": "name"})
        assert err.detail == {"field": "name"}

    def test_missing_code_raises_error(self):
        with pytest.raises(ValidationError):
            ErrorDetail(message="msg")

    def test_missing_message_raises_error(self):
        with pytest.raises(ValidationError):
            ErrorDetail(code="CODE")


class TestErrorResponse:
    def test_with_error_detail(self):
        err_detail = ErrorDetail(code="FORBIDDEN", message="Access denied")
        resp = ErrorResponse(error=err_detail)
        assert resp.error.code == "FORBIDDEN"
        assert resp.error.message == "Access denied"

    def test_from_dict(self):
        resp = ErrorResponse.parse_obj({
            "error": {"code": "AUTH_FAILED", "message": "Auth failed", "detail": {}},
        })
        assert resp.error.code == "AUTH_FAILED"

    def test_missing_error_field_raises_error(self):
        with pytest.raises(ValidationError):
            ErrorResponse()


class TestSuccessHelper:
    def test_data_only(self):
        resp = success(data="result")
        assert isinstance(resp, SuccessResponse)
        assert resp.data == "result"
        assert resp.meta is None

    def test_with_meta(self):
        meta = PaginationMeta(page=2, page_size=10, total=50)
        resp = success(data=["x", "y"], meta=meta)
        assert resp.data == ["x", "y"]
        assert resp.meta == meta

    def test_none_data(self):
        resp = success(data=None)
        assert resp.data is None


class TestPaginatedHelper:
    def test_default_page_and_page_size(self):
        resp = paginated(data=["a", "b", "c"], total=3)
        assert resp.data == ["a", "b", "c"]
        assert resp.meta.page == 1
        assert resp.meta.page_size == 20
        assert resp.meta.total == 3

    def test_custom_page_and_page_size(self):
        resp = paginated(data=[], total=100, page=3, page_size=25)
        assert resp.data == []
        assert resp.meta.page == 3
        assert resp.meta.page_size == 25
        assert resp.meta.total == 100

    def test_empty_list(self):
        resp = paginated(data=[], total=0)
        assert resp.data == []
        assert resp.meta.total == 0

    def test_return_type_is_success_response(self):
        resp = paginated(data=[1, 2], total=2)
        assert isinstance(resp, SuccessResponse)
