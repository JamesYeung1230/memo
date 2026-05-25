import bcrypt


class TestBcryptPassword:
    def test_hash_and_verify_match(self):
        hashed = bcrypt.hashpw(b"my_secret_password", bcrypt.gensalt(rounds=12))
        assert bcrypt.checkpw(b"my_secret_password", hashed) is True

    def test_verify_wrong_password_returns_false(self):
        hashed = bcrypt.hashpw(b"my_secret_password", bcrypt.gensalt(rounds=12))
        assert bcrypt.checkpw(b"wrong_password", hashed) is False

    def test_hash_is_unique_per_call(self):
        hash1 = bcrypt.hashpw(b"same_password", bcrypt.gensalt(rounds=12))
        hash2 = bcrypt.hashpw(b"same_password", bcrypt.gensalt(rounds=12))
        assert hash1 != hash2

    def test_hash_format_is_bcrypt_prefix(self):
        hashed = bcrypt.hashpw(b"password", bcrypt.gensalt(rounds=12))
        decoded = hashed.decode()
        assert decoded.startswith("$2b$") or decoded.startswith("$2a$")

    def test_verify_empty_password(self):
        hashed = bcrypt.hashpw(b"", bcrypt.gensalt(rounds=12))
        assert bcrypt.checkpw(b"", hashed) is True
        assert bcrypt.checkpw(b"x", hashed) is False
