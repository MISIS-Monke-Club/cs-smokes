import pathlib
import unittest


BACKEND_ROOT = pathlib.Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent

ALLOWED_PYTHON_FILES = {
    pathlib.Path("tests/__init__.py"),
    pathlib.Path("tests/test_no_legacy_python_runtime.py"),
}

ALLOWED_PYTHON_DIRS = {
    pathlib.Path("tests"),
}

ALLOWED_DJANGO_REFERENCE_DIRS = {
    pathlib.Path("internal/migratedjango"),
    pathlib.Path("tools/migrate-django"),
}


class NoLegacyPythonRuntimeTest(unittest.TestCase):
    def test_backend_python_files_are_limited_to_tests(self):
        unexpected = []
        for path in BACKEND_ROOT.rglob("*.py"):
            relative = path.relative_to(BACKEND_ROOT)
            if any(relative.is_relative_to(prefix) for prefix in ALLOWED_PYTHON_DIRS):
                if relative not in ALLOWED_PYTHON_FILES:
                    unexpected.append(str(relative))
                continue
            unexpected.append(str(relative))

        self.assertEqual([], sorted(unexpected))

    def test_django_runtime_references_are_limited_to_legacy_baseline(self):
        unexpected = []
        for path in BACKEND_ROOT.rglob("*"):
            if not path.is_file() or ".git" in path.parts:
                continue
            relative = path.relative_to(BACKEND_ROOT)
            if any(relative.is_relative_to(prefix) for prefix in ALLOWED_DJANGO_REFERENCE_DIRS):
                continue
            if any(relative.is_relative_to(prefix) for prefix in ALLOWED_PYTHON_DIRS):
                continue

            if relative.suffix in {".md", ".json", ".yaml", ".yml"}:
                continue

            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            lowered = text.lower()
            if "django" in lowered or "manage.py" in lowered or "uvicorn backend.asgi" in lowered:
                unexpected.append(str(relative))

        self.assertEqual([], sorted(unexpected))

    def test_backend_tests_are_not_wired_into_ci_cd(self):
        ci_roots = [
            REPO_ROOT / ".github" / "workflows",
            REPO_ROOT / ".circleci",
        ]
        ci_files = []
        for root in ci_roots:
            if root.exists():
                ci_files.extend(path for path in root.rglob("*") if path.is_file())
        for optional in [REPO_ROOT / ".gitlab-ci.yml"]:
            if optional.exists():
                ci_files.append(optional)

        forbidden_markers = [
            "go test ./...",
            "go test",
            "backend/tests",
            "python3 -m unittest discover -s backend/tests",
            "python -m unittest discover -s backend/tests",
        ]
        offenders = []
        for path in ci_files:
            text = path.read_text(encoding="utf-8")
            for marker in forbidden_markers:
                if marker in text:
                    offenders.append(f"{path.relative_to(REPO_ROOT)} contains {marker!r}")

        self.assertEqual([], sorted(offenders))

    def test_go_backend_packages_have_backend_tests_surface(self):
        package_to_tests = {
            "internal/admin": ["tests/admin"],
            "internal/auth": ["tests/auth"],
            "internal/config": ["tests/config"],
            "internal/db": ["tests/db"],
            "internal/favorites": ["tests/favorites"],
            "internal/grenadeclasses": ["tests/grenadeclasses"],
            "internal/lineups": ["tests/lineups"],
            "internal/maps": ["tests/maps"],
            "internal/media": ["tests/media"],
            "internal/migratedjango": ["tests/migratedjango"],
            "internal/openapi": ["tests/openapi"],
            "internal/platform/cache": ["tests/cache"],
            "internal/platform/httpserver": ["tests/httpserver"],
            "internal/platform/httpx": ["tests/httpx"],
            "internal/platform/logger": ["tests/logger", "tests/logscan"],
            "internal/platform/postgres": ["tests/postgresrepo"],
            "internal/platform/postgresrepo": ["tests/postgresrepo"],
            "internal/platform/redis": ["tests/cache"],
            "internal/properties": ["tests/properties"],
            "internal/pullrequests": ["tests/pullrequests"],
            "internal/realtime": ["tests/realtime", "tests/wsprobe"],
            "internal/users": ["tests/users"],
            "tools/contract-diff": ["tests/contractdiff"],
            "tools/logscan": ["tests/logscan"],
            "tools/migrate-django": ["tests/migratedjango"],
            "tools/ws-redaction-probe": ["tests/wsprobe"],
        }
        missing = []
        for package, test_dirs in package_to_tests.items():
            package_path = BACKEND_ROOT / package
            if not package_path.exists():
                missing.append(f"{package} package is missing")
                continue
            if not any((BACKEND_ROOT / test_dir).exists() for test_dir in test_dirs):
                missing.append(f"{package} has no test surface in {test_dirs}")

        self.assertEqual([], missing)
