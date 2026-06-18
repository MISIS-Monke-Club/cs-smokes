import json
import unittest
from pathlib import Path

import yaml


REPO_ROOT = Path(__file__).resolve().parents[2]


class LegacyContractBaselineTests(unittest.TestCase):
    def test_legacy_baseline_artifacts_are_present_and_wired(self):
        dockerfile = REPO_ROOT / "backend" / "dockerfile.legacy-django"
        compose_file = REPO_ROOT / "docker-compose.legacy-django.yaml"
        manifest_file = REPO_ROOT / "docs" / "legacy-contract" / "manifest.json"
        readme_file = REPO_ROOT / "docs" / "legacy-contract" / "README.md"
        capture_file = (
            REPO_ROOT / "backend" / "tests" / "contract" / "legacy-capture.md"
        )

        for path in (dockerfile, compose_file, manifest_file, readme_file, capture_file):
            self.assertTrue(path.exists(), f"{path.relative_to(REPO_ROOT)} is missing")

        dockerfile_text = dockerfile.read_text(encoding="utf-8")
        self.assertIn("backend.asgi:application", dockerfile_text)
        self.assertIn("requirements.txt", dockerfile_text)

        compose = yaml.safe_load(compose_file.read_text(encoding="utf-8"))
        legacy_service = compose["services"]["legacy-django"]
        self.assertEqual(
            legacy_service["build"]["dockerfile"],
            "backend/dockerfile.legacy-django",
        )
        self.assertIn("3001:8000", legacy_service["ports"])
        self.assertIn("db", legacy_service["depends_on"])
        self.assertIn("redis", legacy_service["depends_on"])

        manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
        required_keys = {
            "git_commit",
            "legacy_image",
            "database_fixture",
            "media_fixture",
            "captured_at",
            "contract_corpus_version",
            "accepted_legacy_quirks",
        }
        self.assertLessEqual(required_keys, manifest.keys())
        manifest_text = json.dumps(manifest, ensure_ascii=False).lower()
        for forbidden in ("secret", "token", "password", "jwt"):
            self.assertNotIn(forbidden, manifest_text)
        quirks = " ".join(manifest["accepted_legacy_quirks"]).lower()
        self.assertIn("/api/favorites/{id}", quirks)
        self.assertIn("slash", quirks)

        readme_text = readme_file.read_text(encoding="utf-8")
        capture_text = capture_file.read_text(encoding="utf-8")
        for text in (readme_text, capture_text):
            self.assertIn("docker compose -f docker-compose.yaml -f docker-compose.legacy-django.yaml", text)
            self.assertIn("localhost:3001/api/health", text)
            self.assertIn("refresh", text.lower())
        self.assertIn("go run ./tools/contract-diff", capture_text)
