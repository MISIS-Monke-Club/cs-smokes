import pathlib
import unittest


BACKEND_ROOT = pathlib.Path(__file__).resolve().parents[1]

ALLOWED_PYTHON_FILES = {
    pathlib.Path("tests/__init__.py"),
    pathlib.Path("tests/test_legacy_contract_baseline.py"),
    pathlib.Path("tests/test_no_legacy_python_runtime.py"),
}

ALLOWED_PYTHON_DIRS = {
    pathlib.Path("tests"),
}

ALLOWED_DJANGO_REFERENCES = {
    pathlib.Path("dockerfile.legacy-django"),
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
            if relative in ALLOWED_DJANGO_REFERENCES:
                continue
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
