import pytest

from tests.conftest import assert_success_structure


@pytest.mark.knowledge
class TestCardCRUD:

    def test_create_card(self, anonymous_client, test_domain_with_chapter, unique_card_title):
        _, chapter = test_domain_with_chapter
        resp = anonymous_client.post("/cards", json={
            "chapter_id": chapter["id"],
            "title": unique_card_title,
            "core_concept": "核心概念测试",
            "detail": "<p>详细内容测试</p>",
            "life_analogy": "生活类比测试",
            "tags": ["测试", "pytest"],
            "difficulty": "beginner",
            "status": "published",
        })
        assert resp.status_code == 201
        assert_success_structure(resp)
        data = resp.body["data"]
        assert data["title"] == unique_card_title
        assert data["chapter_id"] == chapter["id"]

    def test_list_cards(self, anonymous_client, test_domain_with_chapter, unique_card_title):
        _, chapter = test_domain_with_chapter
        # Create a card first
        create_resp = anonymous_client.post("/cards", json={
            "chapter_id": chapter["id"],
            "title": unique_card_title,
            "core_concept": "概念",
            "detail": "内容",
            "life_analogy": "类比",
        })
        card_id = create_resp.body["data"]["id"]

        resp = anonymous_client.get(f"/chapters/{chapter['id']}/cards", params={"status": "all"})
        # cleanup
        anonymous_client.delete(f"/cards/{card_id}")
        assert resp.status_code == 200
        assert len(resp.body["data"]) >= 1

    def test_get_card(self, anonymous_client, test_domain_with_chapter, unique_card_title):
        _, chapter = test_domain_with_chapter
        create_resp = anonymous_client.post("/cards", json={
            "chapter_id": chapter["id"],
            "title": unique_card_title,
            "core_concept": "概念",
            "detail": "内容",
            "life_analogy": "类比",
        })
        card_id = create_resp.body["data"]["id"]

        resp = anonymous_client.get(f"/cards/{card_id}")
        anonymous_client.delete(f"/cards/{card_id}")
        assert resp.status_code == 200
        assert resp.body["data"]["id"] == card_id

    def test_toggle_card_status(self, anonymous_client, test_domain_with_chapter, unique_card_title):
        _, chapter = test_domain_with_chapter
        create_resp = anonymous_client.post("/cards", json={
            "chapter_id": chapter["id"],
            "title": unique_card_title,
            "core_concept": "概念",
            "detail": "内容",
            "life_analogy": "类比",
        })
        card_id = create_resp.body["data"]["id"]

        resp = anonymous_client.put(f"/cards/{card_id}/toggle-status", json={"status": "draft"})
        anonymous_client.delete(f"/cards/{card_id}")
        assert resp.status_code == 200
        assert resp.body["data"]["status"] == "draft"

    def test_soft_delete_card(self, anonymous_client, test_domain_with_chapter, unique_card_title):
        _, chapter = test_domain_with_chapter
        create_resp = anonymous_client.post("/cards", json={
            "chapter_id": chapter["id"],
            "title": unique_card_title,
            "core_concept": "概念",
            "detail": "内容",
            "life_analogy": "类比",
        })
        card_id = create_resp.body["data"]["id"]

        resp = anonymous_client.delete(f"/cards/{card_id}")
        assert resp.status_code == 204
