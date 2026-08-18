#!/usr/bin/env python3
"""Static guardrails for the Zoe Life concept. No third-party packages."""
from __future__ import annotations

import html.parser
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "index.html"
CSS = ROOT / "css" / "style.css"
JS = ROOT / "js" / "main.js"
SCENE = ROOT / "js" / "scene.js"
FILES = [HTML, CSS, JS, SCENE]
results: list[tuple[bool, str, str]] = []


def check(ok: bool, name: str, detail: str) -> None:
    results.append((ok, name, detail))


class Collector(html.parser.HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.tags: list[tuple[str, dict[str, str], int]] = []
        self.ids: set[str] = set()
        self.duplicate_ids: set[str] = set()
        self.headings: list[int] = []
        self.forms: list[dict[str, str]] = []
        self.controls: list[tuple[str, dict[str, str], int]] = []
        self.labels_for: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key: value or "" for key, value in attrs}
        line = self.getpos()[0]
        self.tags.append((tag, data, line))
        if "id" in data:
            if data["id"] in self.ids:
                self.duplicate_ids.add(data["id"])
            self.ids.add(data["id"])
        if re.fullmatch(r"h[1-6]", tag):
            self.headings.append(int(tag[1]))
        if tag == "form":
            self.forms.append(data)
        if tag in {"input", "select", "textarea"}:
            self.controls.append((tag, data, line))
        if tag == "label" and data.get("for"):
            self.labels_for.add(data["for"])


missing = [str(path.relative_to(ROOT)) for path in FILES if not path.is_file()]
check(not missing, "Core files exist", ", ".join(missing) if missing else "HTML, CSS and JavaScript found")
if missing:
    for ok, name, detail in results:
        print(("PASS" if ok else "FAIL"), name, detail)
    sys.exit(1)

html_text = HTML.read_text(encoding="utf-8")
css_text = CSS.read_text(encoding="utf-8")
js_text = JS.read_text(encoding="utf-8")
scene_text = SCENE.read_text(encoding="utf-8")
parser = Collector()
parser.feed(html_text)

check(html_text.lstrip().lower().startswith("<!doctype html>"), "Document essentials", "doctype present")
check(html_text.count("<main") == 1 and html_text.count("<h1") == 1, "Single main and h1", "one main and one h1")
check(not parser.duplicate_ids, "IDs are unique", ", ".join(sorted(parser.duplicate_ids)) if parser.duplicate_ids else "no duplicate IDs")

heading_skip = any(current > previous + 1 for previous, current in zip(parser.headings, parser.headings[1:]))
check(not heading_skip, "Heading order", "levels do not skip")

problems: list[str] = []
for tag, attrs, line in parser.tags:
    for attribute in ("src", "href"):
        value = attrs.get(attribute, "")
        if not value or value.startswith(("#", "data:", "mailto:", "tel:")):
            continue
        if re.match(r"^[a-z]+://", value):
            problems.append(f"line {line}: external {value}")
            continue
        target = (ROOT / value.split("?")[0].split("#")[0]).resolve()
        if not target.exists():
            problems.append(f"line {line}: missing {value}")
check(not problems, "Local references resolve", "; ".join(problems) if problems else "all linked files exist and no external URL is loaded")

unlabelled = []
for tag, attrs, line in parser.controls:
    if attrs.get("type") == "radio" and not attrs.get("id"):
        continue
    control_id = attrs.get("id")
    if not control_id or control_id not in parser.labels_for:
        unlabelled.append(f"{tag} line {line}")
check(not unlabelled, "Form controls are labelled", ", ".join(unlabelled) if unlabelled else "all named fields have labels")

form_safe = all("action" not in form and "method" not in form for form in parser.forms)
form_safe = form_safe and "fetch(" not in js_text and "XMLHttpRequest" not in js_text
form_safe = form_safe and "Nothing is sent, stored or emailed" in html_text
check(form_safe, "Mock form cannot submit", "no action, method or network request; visible disclosure present")

required_assets = [
    "assets/current-site/founders-current-site.jpg",
    "assets/current-site/about-guidance.jpg",
    "assets/current-site/coaching-zoe-life.jpg",
    "assets/current-site/services-professional.jpg",
    "assets/founder-tayo.jpg",
    "assets/founder-kemi.jpg",
]
missing_assets = [asset for asset in required_assets if asset not in html_text or not (ROOT / asset).is_file()]
check(not missing_assets, "Verified photos and covers are used", ", ".join(missing_assets) if missing_assets else "founders, current-site photography and both verified covers present")

manifest_path = ROOT / "assets" / "current-site" / "manifest.json"
manifest_problems = []
if not manifest_path.is_file():
    manifest_problems.append("manifest missing")
else:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for asset in manifest.get("assets", []):
        if not (manifest_path.parent / asset["file"]).is_file():
            manifest_problems.append(asset["file"])
        if not asset.get("source_page", "").startswith("https://www.zoelifehub.com/"):
            manifest_problems.append(f"{asset['file']} source page")
check(not manifest_problems, "Current-site provenance is complete", ", ".join(manifest_problems) if manifest_problems else "manifested assets and source pages resolve")

season_missing = [name for name in ["building", "waiting", "growing", "healing", "leading"] if f'data-season="{name}"' not in html_text]
focus_missing = [name for name in ["spiritual", "relational", "personal", "professional"] if f'value="{name}"' not in html_text]
path_missing = [name for name in ["Relationships and Family", "Academic and Career", "Faith and Life Resources"] if name not in html_text]
check(not season_missing and not focus_missing and not path_missing, "Season and pathfinder content", f"missing: {season_missing + focus_missing + path_missing}" if season_missing or focus_missing or path_missing else "five seasons, four focuses and three pathways present")

forbidden_copy = [
    "Book a consult", "Book a 20-minute consult", "Get the book", "landing end of August",
    "Amazon", "Gumroad", "Selar", "On the roadmap", "In the works", "data-soon",
    "person-photo--t", "person-photo--k", "custom cursor",
]
found_copy = [term for term in forbidden_copy if term.lower() in html_text.lower()]
check(not found_copy, "Unverified offers and placeholders removed", ", ".join(found_copy) if found_copy else "no invented availability, marketplaces, roadmap claims or avatar placeholders")

page_prose = re.sub(r"<script\b[^>]*>.*?</script>", "", html_text, flags=re.S | re.I)
page_prose = re.sub(r"<style\b[^>]*>.*?</style>", "", page_prose, flags=re.S | re.I)
forbidden_dashes = re.findall(r"[—–]", page_prose)
check(not forbidden_dashes, "Visible copy has no forbidden dash characters", f"found {len(forbidden_dashes)}" if forbidden_dashes else "zero em dash and en dash characters")

external_patterns = []
for path, text in [(HTML, html_text), (CSS, css_text), (JS, js_text), (SCENE, scene_text)]:
    runtime_text = re.sub(r"data:image[^\"')]+", "", text, flags=re.I)
    if re.search(r"https?://|//(?:cdn|unpkg|cdnjs|fonts)\.", runtime_text, re.I):
        external_patterns.append(path.name)
check(not external_patterns, "No external dependencies", ", ".join(external_patterns) if external_patterns else "all runtime dependencies are local")

motion_ok = "prefers-reduced-motion" in css_text and "prefers-reduced-motion" in js_text and "prefers-reduced-motion" in scene_text
motion_ok = motion_ok and "window.addEventListener('scroll'" not in js_text and 'window.addEventListener("scroll"' not in js_text
check(motion_ok, "Motion is reduced and scroll-safe", "reduced motion in CSS and JS; no raw window scroll listener")

hidden_main = bool(re.search(r"\.js\s+\.reveal\s*\{[^}]*opacity:\s*0", css_text, re.S))
check(not hidden_main, "Main content fails open", "no hidden-by-default reveal system")

print("\nZoe Life checks")
print("=" * 92)
failures = 0
for ok, name, detail in results:
    if not ok:
        failures += 1
    print(f"{'PASS' if ok else 'FAIL':<5} {name:<42} {detail}")
print("=" * 92)
print(f"{len(results) - failures} passed, {failures} failed\n")
sys.exit(1 if failures else 0)
