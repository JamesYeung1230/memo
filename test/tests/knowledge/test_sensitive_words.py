import pytest

from tests.conftest import assert_success_structure


@pytest.mark.knowledge
class TestSensitiveWordsCRUD:

    def test_create_word(self, anonymous_client):
        resp = anonymous_client.post("/sensitive-words", json={
            "word": "test-bad-word",
            "match_mode": "exact",
            "enabled": True,
        })
        assert resp.status_code == 201
        assert_success_structure(resp)
        data = resp.body["data"]
        assert data["word"] == "test-bad-word"
        assert data["match_mode"] == "exact"
        assert data["enabled"] is True
        # cleanup
        anonymous_client.delete(f"/sensitive-words/{data['id']}")

    def test_list_words(self, anonymous_client):
        # Create one first
        create_resp = anonymous_client.post("/sensitive-words", json={
            "word": "list-test-word",
            "match_mode": "exact",
        })
        word_id = create_resp.body["data"]["id"]

        resp = anonymous_client.get("/sensitive-words", params={"page": 1, "page_size": 20})
        anonymous_client.delete(f"/sensitive-words/{word_id}")
        assert resp.status_code == 200
        assert len(resp.body["data"]) >= 1

    def test_list_words_filtered(self, anonymous_client):
        resp = anonymous_client.get("/sensitive-words", params={
            "page": 1, "page_size": 20, "keyword": "test", "match_mode": "exact",
        })
        assert resp.status_code == 200

    def test_get_word(self, anonymous_client):
        create_resp = anonymous_client.post("/sensitive-words", json={
            "word": "get-test-word",
            "match_mode": "regex",
        })
        word_id = create_resp.body["data"]["id"]

        resp = anonymous_client.get(f"/sensitive-words/{word_id}")
        anonymous_client.delete(f"/sensitive-words/{word_id}")
        assert resp.status_code == 200
        assert resp.body["data"]["word"] == "get-test-word"

    def test_get_word_not_found(self, anonymous_client):
        resp = anonymous_client.get("/sensitive-words/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_update_word(self, anonymous_client):
        create_resp = anonymous_client.post("/sensitive-words", json={
            "word": "update-test-word",
            "match_mode": "exact",
        })
        word_id = create_resp.body["data"]["id"]

        resp = anonymous_client.put(f"/sensitive-words/{word_id}", json={"enabled": False})
        anonymous_client.delete(f"/sensitive-words/{word_id}")
        assert resp.status_code == 200
        assert resp.body["data"]["enabled"] is False

    def test_delete_word(self, anonymous_client):
        create_resp = anonymous_client.post("/sensitive-words", json={
            "word": "delete-test-word",
            "match_mode": "exact",
        })
        word_id = create_resp.body["data"]["id"]

        resp = anonymous_client.delete(f"/sensitive-words/{word_id}")
        assert resp.status_code == 204

    def test_batch_delete(self, anonymous_client):
        w1 = anonymous_client.post("/sensitive-words", json={"word": "batch1", "match_mode": "exact"})
        w2 = anonymous_client.post("/sensitive-words", json={"word": "batch2", "match_mode": "exact"})
        ids = [w1.body["data"]["id"], w2.body["data"]["id"]]

        resp = anonymous_client.post("/sensitive-words/batch-delete", json={"ids": ids})
        assert resp.status_code == 200

    def test_toggle_word(self, anonymous_client):
        create_resp = anonymous_client.post("/sensitive-words", json={
            "word": "toggle-test-word",
            "match_mode": "exact",
        })
        word_id = create_resp.body["data"]["id"]

        resp = anonymous_client.put(f"/sensitive-words/{word_id}/toggle", json={"enabled": False})
        anonymous_client.delete(f"/sensitive-words/{word_id}")
        assert resp.status_code == 200
        assert resp.body["data"]["enabled"] is False

    def test_reload_cache(self, anonymous_client):
        resp = anonymous_client.post("/sensitive-words/reload")
        assert resp.status_code == 200
