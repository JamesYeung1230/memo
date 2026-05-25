import pytest

from tests.conftest import assert_success_structure, assert_error_structure


@pytest.mark.knowledge
class TestQuestionCRUD:

    def test_create_question(self, anonymous_client, test_domain_with_chapter, unique_card_title):
        _, chapter = test_domain_with_chapter
        # Create a card first
        card_resp = anonymous_client.post("/cards", json={
            "chapter_id": chapter["id"],
            "title": unique_card_title,
            "core_concept": "概念",
            "detail": "内容",
            "life_analogy": "类比",
        })
        card_id = card_resp.body["data"]["id"]

        resp = anonymous_client.post("/questions", json={
            "card_id": card_id,
            "question_text": "测试题目？",
            "options": {"A": "选项A", "B": "选项B", "C": "选项C", "D": "选项D"},
            "correct_option": "A",
            "explanation": "测试解析",
        })
        question_id = resp.body["data"]["id"] if resp.status_code == 201 else None

        # cleanup
        if question_id:
            anonymous_client.delete(f"/questions/{question_id}")
        anonymous_client.delete(f"/cards/{card_id}")
        assert resp.status_code == 201
        assert_success_structure(resp)
        assert resp.body["data"]["card_id"] == card_id

    def test_get_question_by_card(self, anonymous_client, test_domain_with_chapter, unique_card_title):
        _, chapter = test_domain_with_chapter
        card_resp = anonymous_client.post("/cards", json={
            "chapter_id": chapter["id"],
            "title": unique_card_title,
            "core_concept": "概念",
            "detail": "内容",
            "life_analogy": "类比",
        })
        card_id = card_resp.body["data"]["id"]

        q_resp = anonymous_client.post("/questions", json={
            "card_id": card_id,
            "question_text": "题干",
            "options": {"A": "A", "B": "B", "C": "C", "D": "D"},
            "correct_option": "A",
            "explanation": "解析",
        })
        qid = q_resp.body["data"]["id"]

        resp = anonymous_client.get(f"/cards/{card_id}/question")
        anonymous_client.delete(f"/questions/{qid}")
        anonymous_client.delete(f"/cards/{card_id}")
        assert resp.status_code == 200
        assert resp.body["data"]["card_id"] == card_id

    def test_create_question_no_card(self, anonymous_client):
        resp = anonymous_client.post("/questions", json={
            "card_id": "00000000-0000-0000-0000-000000000000",
            "question_text": "题干?",
            "options": {"A": "A", "B": "B", "C": "C", "D": "D"},
            "correct_option": "A",
            "explanation": "解析",
        })
        assert resp.status_code == 404

    def test_create_question_invalid_option(self, anonymous_client, test_domain_with_chapter, unique_card_title):
        _, chapter = test_domain_with_chapter
        card_resp = anonymous_client.post("/cards", json={
            "chapter_id": chapter["id"],
            "title": unique_card_title,
            "core_concept": "概念",
            "detail": "内容",
            "life_analogy": "类比",
        })
        card_id = card_resp.body["data"]["id"]

        resp = anonymous_client.post("/questions", json={
            "card_id": card_id,
            "question_text": "题干?",
            "options": {"A": "A", "B": "B", "C": "C", "D": "D"},
            "correct_option": "E",
            "explanation": "解析",
        })
        anonymous_client.delete(f"/cards/{card_id}")
        assert resp.status_code == 422

    def test_delete_question(self, anonymous_client, test_domain_with_chapter, unique_card_title):
        _, chapter = test_domain_with_chapter
        card_resp = anonymous_client.post("/cards", json={
            "chapter_id": chapter["id"],
            "title": unique_card_title,
            "core_concept": "概念",
            "detail": "内容",
            "life_analogy": "类比",
        })
        card_id = card_resp.body["data"]["id"]

        q_resp = anonymous_client.post("/questions", json={
            "card_id": card_id,
            "question_text": "题干",
            "options": {"A": "A", "B": "B", "C": "C", "D": "D"},
            "correct_option": "A",
            "explanation": "解析",
        })
        qid = q_resp.body["data"]["id"]

        resp = anonymous_client.delete(f"/questions/{qid}")
        anonymous_client.delete(f"/cards/{card_id}")
        assert resp.status_code == 204
