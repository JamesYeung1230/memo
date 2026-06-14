"""
Playwright fixtures for webapp E2E tests.

Requires:
  - Webapp dev server running on WEBAPP_BASE_URL (default http://localhost:3000)
  - Backend API accessible via the webapp's vite proxy (or direct)

Usage:
  cd memo/test
  pytest tests/webapp/ -v
"""

import os
import pytest
from playwright.sync_api import Page, Browser, BrowserContext, Playwright, sync_playwright

# Default URLs
WEBAPP_BASE_URL = os.getenv("WEBAPP_BASE_URL", "http://localhost:3000")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")


@pytest.fixture(scope="session")
def playwright_instance() -> Playwright:
    """Session-scoped Playwright instance."""
    pw = sync_playwright().start()
    yield pw
    pw.stop()


@pytest.fixture(scope="session")
def browser(playwright_instance: Playwright) -> Browser:
    """Session-scoped browser instance (Chromium headless)."""
    headless = os.getenv("PLAYWRIGHT_HEADLESS", "true").lower() != "false"
    browser_instance = playwright_instance.chromium.launch(headless=headless, slow_mo=100)
    yield browser_instance
    browser_instance.close()


@pytest.fixture
def context(browser: Browser) -> BrowserContext:
    """Function-scoped browser context (isolated cookies/storage per test)."""
    ctx = browser.new_context(
        viewport={"width": 1440, "height": 900},
        locale="zh-CN",
    )
    yield ctx
    ctx.close()


@pytest.fixture
def page(context: BrowserContext) -> Page:
    """Function-scoped page with 30s default timeout."""
    p = context.new_page()
    p.set_default_timeout(30000)
    yield p
    p.close()


@pytest.fixture
def logged_in_page(page: Page) -> Page:
    """Page pre-authenticated with admin credentials.

    Navigates to login, fills credentials, submits, and waits for redirect
    to the dashboard.
    """
    page.goto(f"{WEBAPP_BASE_URL}/login", wait_until="networkidle")

    # Fill login form
    page.fill('input[id="username"]', ADMIN_USERNAME)
    page.fill('input[id="password"]', ADMIN_PASSWORD)
    page.click('button[type="submit"]')

    # Wait for redirect to dashboard (after successful login)
    page.wait_for_url(f"{WEBAPP_BASE_URL}/dashboard", timeout=15000)
    page.wait_for_load_state("networkidle")

    return page


def assert_page_loaded(page: Page, expected_text: str | None = None) -> None:
    """Assert the page has loaded (no error boundary, content visible)."""
    # Check that we're not on the login page (session still valid)
    assert "/login" not in page.url, f"Redirected to login: {page.url}"

    if expected_text:
        page.wait_for_selector(f"text={expected_text}", timeout=10000)


def take_screenshot_on_failure(page: Page, test_name: str) -> None:
    """Take a screenshot for debugging. Call in test teardown on failure."""
    screenshot_dir = os.path.join(os.path.dirname(__file__), "..", "screenshots")
    os.makedirs(screenshot_dir, exist_ok=True)
    page.screenshot(path=os.path.join(screenshot_dir, f"{test_name}.png"), full_page=True)
