#!/usr/bin/env python3
"""Genera los datos de navegación y contadores de JCain Engineering.

El script no necesita paquetes externos. GitHub Actions lo ejecuta en cada push.
También puede ejecutarse localmente con:

    python scripts/build_site.py

Reglas de descubrimiento:
- cada carpeta inmediata dentro de /cursos que contenga course.json es una materia;
- cada subcarpeta inmediata de una materia que contenga index.html es una clase publicada;
- las metaetiquetas jcain-lesson-* permiten asociar una clase con su tema del temario;
- si una clase no está todavía registrada en course.json, se cuenta y aparece en la lista
  de clases publicadas de todas maneras.
"""
from __future__ import annotations

import json
import re
import sys
from copy import deepcopy
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
COURSES_DIR = ROOT / "cursos"
DATA_DIR = ROOT / "assets" / "data"
SITE_CONFIG = ROOT / "site.config.json"


class PageMetaParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta: dict[str, str] = {}
        self.title_parts: list[str] = []
        self.in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = {k.lower(): (v or "") for k, v in attrs}
        if tag.lower() == "meta":
            name = attrs_dict.get("name", "").strip().lower()
            content = attrs_dict.get("content", "").strip()
            if name and content:
                self.meta[name] = content
        elif tag.lower() == "title":
            self.in_title = True

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)

    @property
    def title(self) -> str:
        return " ".join("".join(self.title_parts).split())


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def natural_number_key(value: str) -> tuple:
    """Ordena 1.2 antes de 1.10 y deja valores no numéricos al final."""
    if not value:
        return (10_000,)
    parts = re.findall(r"\d+|[^\d]+", value)
    key: list[Any] = []
    for part in parts:
        if part.isdigit():
            key.append(int(part))
        else:
            key.append(part.lower())
    return tuple(key)


def iter_topics(units: list[dict[str, Any]]):
    for unit_index, unit in enumerate(units):
        for topic_index, topic in enumerate(unit.get("topics", [])):
            yield unit_index, topic_index, None, topic
            for child_index, child in enumerate(topic.get("children", [])):
                yield unit_index, topic_index, child_index, child


def topic_indexes(course: dict[str, Any]):
    by_number: dict[str, dict[str, Any]] = {}
    by_slug: dict[str, dict[str, Any]] = {}
    unit_for_topic: dict[int, dict[str, Any]] = {}
    parent_for_topic: dict[int, dict[str, Any] | None] = {}

    for unit in course.get("units", []):
        for topic in unit.get("topics", []):
            if topic.get("number"):
                by_number[str(topic["number"])] = topic
            if topic.get("slug"):
                by_slug[str(topic["slug"])] = topic
            unit_for_topic[id(topic)] = unit
            parent_for_topic[id(topic)] = None
            for child in topic.get("children", []):
                if child.get("number"):
                    by_number[str(child["number"])] = child
                if child.get("slug"):
                    by_slug[str(child["slug"])] = child
                unit_for_topic[id(child)] = unit
                parent_for_topic[id(child)] = topic
    return by_number, by_slug, unit_for_topic, parent_for_topic


def read_lesson_meta(index_path: Path) -> dict[str, str]:
    parser = PageMetaParser()
    parser.feed(index_path.read_text(encoding="utf-8", errors="replace"))
    meta = parser.meta
    title = meta.get("jcain-lesson-title") or parser.title.split("|")[0].strip()
    return {
        "number": meta.get("jcain-lesson-number", "").strip(),
        "title": title,
        "summary": meta.get("jcain-lesson-summary") or meta.get("description", ""),
        "unit": meta.get("jcain-lesson-unit", ""),
        "order": meta.get("jcain-lesson-order", ""),
    }


def ensure_leading_slash(path: str) -> str:
    return path if path.startswith("/") else "/" + path


def main() -> int:
    if not SITE_CONFIG.exists():
        raise SystemExit(f"No se encontró {SITE_CONFIG}")
    if not COURSES_DIR.exists():
        raise SystemExit(f"No se encontró {COURSES_DIR}")

    site_config = load_json(SITE_CONFIG)
    base_path = site_config.get("site", {}).get("basePath", "/") or "/"
    if not base_path.startswith("/"):
        base_path = "/" + base_path
    if base_path != "/":
        base_path = base_path.rstrip("/")

    warnings: list[str] = []
    courses: list[dict[str, Any]] = []
    seen_lesson_urls: set[str] = set()

    for course_dir in sorted(p for p in COURSES_DIR.iterdir() if p.is_dir()):
        manifest_path = course_dir / "course.json"
        if not manifest_path.exists():
            continue

        if not (course_dir / "index.html").exists():
            raise SystemExit(f"La materia {course_dir.name} tiene course.json pero no index.html")

        course = deepcopy(load_json(manifest_path))
        slug = course_dir.name
        course["slug"] = slug
        course["url"] = f"{base_path if base_path != '/' else ''}/cursos/{slug}/"
        course["publishedCount"] = 0
        course["lessons"] = []

        by_number, by_slug, unit_for_topic, parent_for_topic = topic_indexes(course)

        # Dejar todo el temario como no publicado antes de detectar carpetas reales.
        for _, _, _, topic in iter_topics(course.get("units", [])):
            topic["published"] = False
            topic.pop("url", None)
            topic.pop("actualFolder", None)

        for lesson_dir in sorted(p for p in course_dir.iterdir() if p.is_dir() and not p.name.startswith(".")):
            index_path = lesson_dir / "index.html"
            if not index_path.exists():
                continue

            meta = read_lesson_meta(index_path)
            number = meta["number"]
            matched = None
            if number:
                matched = by_number.get(number)
            if matched is None:
                matched = by_slug.get(lesson_dir.name)

            if matched is not None:
                if not number:
                    number = str(matched.get("number", ""))
                title = meta["title"] or str(matched.get("title", lesson_dir.name))
                summary = meta["summary"] or str(matched.get("summary", ""))
                unit = unit_for_topic.get(id(matched), {})
                parent = parent_for_topic.get(id(matched))
                matched["published"] = True
                matched["actualFolder"] = lesson_dir.name
            else:
                title = meta["title"] or lesson_dir.name.replace("-", " ").title()
                summary = meta["summary"]
                unit = {}
                parent = None
                warnings.append(
                    f"{slug}/{lesson_dir.name}: clase publicada no vinculada al temario. "
                    "Añade o verifica jcain-lesson-number / course.json."
                )

            url = f"{base_path if base_path != '/' else ''}/cursos/{slug}/{lesson_dir.name}/"
            if url in seen_lesson_urls:
                raise SystemExit(f"URL de clase duplicada: {url}")
            seen_lesson_urls.add(url)

            if matched is not None:
                matched["url"] = url
                if summary and not matched.get("summary"):
                    matched["summary"] = summary

            lesson = {
                "slug": lesson_dir.name,
                "number": number,
                "title": title,
                "summary": summary,
                "url": url,
                "unitLabel": unit.get("label", meta.get("unit", "")),
                "unitTitle": unit.get("title", ""),
                "parentNumber": parent.get("number", "") if parent else "",
                "parentTitle": parent.get("title", "") if parent else "",
            }
            course["lessons"].append(lesson)

        # Validar números repetidos entre clases publicadas.
        seen_numbers: set[str] = set()
        for lesson in course["lessons"]:
            lesson_number = str(lesson.get("number", "")).strip()
            if lesson_number and lesson_number in seen_numbers:
                raise SystemExit(f"Número de clase duplicado en {slug}: {lesson_number}")
            if lesson_number:
                seen_numbers.add(lesson_number)

        course["lessons"].sort(key=lambda x: (natural_number_key(str(x.get("number", ""))), x.get("title", "")))
        course["publishedCount"] = len(course["lessons"])
        course["hasPublishedLessons"] = bool(course["lessons"])
        course["statusLabel"] = "En desarrollo activo" if course["publishedCount"] else "Estructura preparada"
        courses.append(course)

    courses.sort(key=lambda c: (c.get("order", 9999), c.get("title", "")))

    all_lessons: list[dict[str, Any]] = []
    for course in courses:
        for lesson in course["lessons"]:
            item = deepcopy(lesson)
            item["courseSlug"] = course["slug"]
            item["courseTitle"] = course["title"]
            all_lessons.append(item)

    output = deepcopy(site_config)
    output["site"]["basePath"] = base_path
    output["courses"] = courses
    output["stats"] = {
        "courseCount": len(courses),
        "publishedLessonCount": len(all_lessons),
        "coursesWithLessons": sum(1 for c in courses if c["publishedCount"] > 0),
    }
    output["publishedLessons"] = all_lessons
    output["build"] = {
        "generator": "scripts/build_site.py",
        "warnings": warnings,
    }

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    json_text = json.dumps(output, ensure_ascii=False, indent=2)
    (DATA_DIR / "site-data.json").write_text(json_text + "\n", encoding="utf-8")
    (DATA_DIR / "site-data.js").write_text(
        "/* Archivo generado automáticamente por scripts/build_site.py. No editar a mano. */\n"
        + "window.JCAIN_SITE_DATA = "
        + json.dumps(output, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )

    print(f"JCain Engineering: {len(courses)} materias, {len(all_lessons)} clases publicadas.")
    if warnings:
        print("Advertencias:")
        for warning in warnings:
            print(f"  - {warning}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
