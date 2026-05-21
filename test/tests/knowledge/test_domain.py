import pytest

from tests.conftest import assert_success_structure


@pytest.mark.knowledge
class TestDomainCRUD:

    def test_create_domain(self, anonymous_client, unique_domain_name):
        resp = anonymous_client.post("/domains", json={
            "name": unique_domain_name,
            "icon": "code",
            "is_free": True,
            "status": "published",
        })
        assert resp.status_code == 201
        assert_success_structure(resp)
        data = resp.body["data"]
        assert data["name"] == unique_domain_name
        assert data["icon"] == "code"
        assert data["is_free"] is True
        assert data["status"] == "published"
        assert "id" in data

    def test_duplicate_domain_name(self, anonymous_client, test_domain):
        resp = anonymous_client.post("/domains", json={
            "name": test_domain["name"],
            "icon": "dup",
            "is_free": True,
        })
        assert resp.status_code == 409
        assert resp.body["code"] == "KNOWLEDGE_DUPLICATE"

    def test_list_domains(self, anonymous_client, test_domain):
        resp = anonymous_client.get("/domains", params={"page": 1, "page_size": 20})
        assert resp.status_code == 200
        assert_success_structure(resp)
        assert len(resp.body["data"]) >= 1
        assert resp.body["meta"]["total"] >= 1

    def test_get_domain(self, anonymous_client, test_domain):
        resp = anonymous_client.get(f"/domains/{test_domain['id']}")
        assert resp.status_code == 200
        assert resp.body["data"]["id"] == test_domain["id"]

    def test_get_domain_not_found(self, anonymous_client):
        resp = anonymous_client.get("/domains/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_update_domain(self, anonymous_client, test_domain):
        new_name = test_domain["name"] + "-updated"
        resp = anonymous_client.put(f"/domains/{test_domain['id']}", json={"name": new_name})
        assert resp.status_code == 200
        assert resp.body["data"]["name"] == new_name

    def test_toggle_domain_status(self, anonymous_client, test_domain):
        resp = anonymous_client.put(f"/domains/{test_domain['id']}/toggle-status")
        assert resp.status_code == 200
        assert resp.body["data"]["status"] in ("draft", "published")

    def test_delete_domain(self, anonymous_client, unique_domain_name):
        create_resp = anonymous_client.post("/domains", json={
            "name": unique_domain_name,
            "icon": "del",
            "is_free": True,
        })
        domain_id = create_resp.body["data"]["id"]
        resp = anonymous_client.delete(f"/domains/{domain_id}")
        assert resp.status_code == 204

    def test_validation_empty_name(self, anonymous_client):
        resp = anonymous_client.post("/domains", json={"name": "", "icon": "test"})
        assert resp.status_code == 422
