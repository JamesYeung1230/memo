import pytest

from tests.conftest import assert_success_structure


@pytest.mark.knowledge
class TestChapterCRUD:

    def test_create_chapter(self, anonymous_client, test_domain, unique_chapter_name):
        resp = anonymous_client.post("/chapters", json={
            "domain_id": test_domain["id"],
            "name": unique_chapter_name,
            "status": "published",
        })
        assert resp.status_code == 201
        assert_success_structure(resp)
        data = resp.body["data"]
        assert data["name"] == unique_chapter_name
        assert data["domain_id"] == test_domain["id"]

    def test_list_chapters_by_domain(self, anonymous_client, test_domain_with_chapter):
        domain, chapter = test_domain_with_chapter
        resp = anonymous_client.get(f"/domains/{domain['id']}/chapters")
        assert resp.status_code == 200
        assert len(resp.body["data"]) >= 1

    def test_get_chapter(self, anonymous_client, test_domain_with_chapter):
        _, chapter = test_domain_with_chapter
        resp = anonymous_client.get(f"/chapters/{chapter['id']}")
        assert resp.status_code == 200
        assert resp.body["data"]["id"] == chapter["id"]

    def test_get_chapter_not_found(self, anonymous_client):
        resp = anonymous_client.get("/chapters/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_update_chapter(self, anonymous_client, test_domain_with_chapter):
        _, chapter = test_domain_with_chapter
        new_name = chapter["name"] + "-updated"
        resp = anonymous_client.put(f"/chapters/{chapter['id']}", json={"name": new_name})
        assert resp.status_code == 200
        assert resp.body["data"]["name"] == new_name

    def test_delete_chapter(self, anonymous_client, test_domain, unique_chapter_name):
        create_resp = anonymous_client.post("/chapters", json={
            "domain_id": test_domain["id"],
            "name": unique_chapter_name,
        })
        chapter_id = create_resp.body["data"]["id"]
        resp = anonymous_client.delete(f"/chapters/{chapter_id}")
        assert resp.status_code == 204

    def test_chapter_not_found_in_domain(self, anonymous_client):
        resp = anonymous_client.get("/domains/00000000-0000-0000-0000-000000000000/chapters")
        assert resp.status_code == 404

    def test_chapter_duplicate_name_in_domain(self, anonymous_client, test_domain, unique_chapter_name):
        resp1 = anonymous_client.post("/chapters", json={
            "domain_id": test_domain["id"],
            "name": unique_chapter_name,
        })
        assert resp1.status_code == 201
        # Use a fixture for cleanup
        chapter_id = resp1.body["data"]["id"]
        resp2 = anonymous_client.post("/chapters", json={
            "domain_id": test_domain["id"],
            "name": unique_chapter_name,
        })
        # Cleanup
        anonymous_client.delete(f"/chapters/{chapter_id}")
        assert resp2.status_code == 409
