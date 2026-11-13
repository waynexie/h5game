"""Verify every source file without requiring access to or modifying the source repo."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / "migration/source-manifest.json").read_text())
errors = []
for entry in manifest["files"]:
    path = root / entry["path"]
    if not path.is_file():
        errors.append(f"missing: {entry['path']}")
    elif hashlib.sha256(path.read_bytes()).hexdigest() != entry["sha256"]:
        errors.append(f"changed: {entry['path']}")
if errors:
    raise SystemExit("\n".join(errors))
for path in [*(root / "data").glob("*.json"), *(root / "assets").rglob("*.json")]:
    json.loads(path.read_text())
art = json.loads((root / "assets/manifest_art.json").read_text())
for layer in art["layers"]:
    if layer.get("file") and not (root / layer["file"]).is_file():
        raise SystemExit(f"missing art: {layer['file']}")
print(f"PASS: {len(manifest['files'])} source files match SHA-256; JSON and art paths valid")
print(f"Source main: {manifest['source_commit']}")
