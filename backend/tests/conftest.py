import pytest

TEST_SECRET = "test-secret-key-for-unit-tests"
TEST_ALGORITHM = "HS256"


@pytest.fixture
def secret() -> str:
    return TEST_SECRET


@pytest.fixture
def algorithm() -> str:
    return TEST_ALGORITHM
