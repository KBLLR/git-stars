import streamlit as st
import json
import os
import re
from collections import defaultdict
from datetime import datetime

# --- Get the base path of the script to build robust file paths ---
# This ensures that the paths work regardless of where the script is run from.
BASE_PATH = os.path.dirname(__file__)

@st.cache_data(show_spinner="Loading data...")
def load_data_json():
    """Loads and caches the main data.json file containing GitHub starred repositories."""
    # Try multiple possible locations for data.json
    possible_paths = [
        os.path.join(BASE_PATH, "..", "..", "data", "data.json"),  # Original path
        os.path.join(BASE_PATH, "..", "..", "public", "data.json"),  # In public directory
        os.path.join(BASE_PATH, "..", "..", "src", "frontend", "data.json"),  # In frontend directory
        os.path.join(BASE_PATH, "..", "..", "data.json"),  # In project root
    ]

    for path in possible_paths:
        try:
            with open(path, "r") as f:
                data = json.load(f)
            st.success(f"Successfully loaded data from: {path}")
            return data
        except FileNotFoundError:
            continue

    # If we get here, none of the paths worked
    st.error("Error: data.json was not found in any of the expected locations.")
    st.info("Places checked: data/, public/, src/frontend/, and project root.")

    # Create a minimal empty data structure to prevent further errors
    return []

def _flatten_repos(data):
    """Normalises the repo structure from data.json.

    Older exports grouped repositories by language (e.g. `[{language, repos: [...]}, ...]`)
    while the latest export is a simple list of repositories. This helper returns a
    consistent list of repository dictionaries regardless of the original shape.
    """

    # Single dictionary with repos
    if isinstance(data, dict) and isinstance(data.get("repos"), list):
        return [repo for repo in data["repos"] if isinstance(repo, dict)]

    repos: list[dict] = []

    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict) and isinstance(item.get("repos"), list):
                repos.extend(repo for repo in item["repos"] if isinstance(repo, dict))
            elif isinstance(item, dict):
                repos.append(item)

    return repos


def _sanitize_string(value):
    """Removes :contentReference[...] markers and normalises whitespace."""

    if isinstance(value, str):
        cleaned = re.sub(r":contentReference\[[^\]]*\]\{[^}]*\}", "", value)
        cleaned = re.sub(r"\s+", " ", cleaned).strip(" :")
        return cleaned
    return value


def _load_university_modules() -> list[dict]:
    """Attempts to load curated university module data from disk."""

    possible_paths = [
        os.path.join(BASE_PATH, "data", "university_modules.json"),
        os.path.join(BASE_PATH, "university_modules.json"),
        os.path.join(BASE_PATH, "..", "..", "public", "university_modules.json"),
        os.path.join(BASE_PATH, "..", "..", "data", "university_modules.json"),
    ]

    for path in possible_paths:
        if os.path.exists(path):
            with open(path, "r") as f:
                try:
                    modules = json.load(f)
                except json.JSONDecodeError:
                    st.error(f"Unable to parse university module data at {path}.")
                    return []

            st.success(f"Successfully loaded university module catalog from: {path}")
            return modules if isinstance(modules, list) else []

    return []


def _transform_module_record(record: dict) -> dict:
    """Normalises a curated module entry into the structure used by the UI."""

    sanitized: dict[str, object] = {}
    for key, value in record.items():
        if isinstance(value, list):
            sanitized[key] = [_sanitize_string(item) for item in value]
        else:
            sanitized[key] = _sanitize_string(value)

    module_title = sanitized.get("Module Title") or sanitized.get("Module Code") or "Module"
    module_code = sanitized.get("Module Code", "")
    title_and_version = (
        f"{module_title} ({module_code})" if module_code else str(module_title)
    )

    topics = {
        topic
        for topic in [
            sanitized.get("Module Title"),
            sanitized.get("Module Type"),
            sanitized.get("Semester"),
            sanitized.get("Module Code"),
        ]
        if topic
    }

    for objective in sanitized.get("Qualification Objectives", []):
        if objective:
            topics.add(objective)

    learning_resources = []
    resources_url = sanitized.get("Learning Resources URL")
    if resources_url:
        learning_resources.append({"name": "Learning Resources", "url": resources_url})

    return {
        "title_and_version": title_and_version,
        "module_code": module_code,
        "core_focus": sanitized.get("Key Contents / Topics") or "Not specified.",
        "topics": sorted(filter(None, topics)),
        "semester": sanitized.get("Semester", "N/A"),
        "ects_credits": sanitized.get("ECTS Credits", "N/A"),
        "contact_time_hours": sanitized.get("Contact Time (hours)", "N/A"),
        "self_study_time_hours": sanitized.get("Self-Study Time (hours)", "N/A"),
        "module_type": sanitized.get("Module Type", "N/A"),
        "prerequisites": sanitized.get("Prerequisites", "N/A"),
        "grading_type": sanitized.get("Grading Type", "N/A"),
        "teaching_format": sanitized.get("Teaching Format", "N/A"),
        "assessment_type": sanitized.get("Assessment Type", "N/A"),
        "module_coordinator": sanitized.get("Module Coordinator", "N/A"),
        "qualification_objectives": sanitized.get("Qualification Objectives", []),
        "key_contents": sanitized.get("Key Contents / Topics", ""),
        "learning_resources_url": resources_url or "",
        "languages": [sanitized.get("Module Type", "N/A")],
        "resources": learning_resources,
    }


def _generate_modules_from_repos() -> list[dict]:
    """Fallback path: synthesise module-like entries from starred repositories."""

    data = load_data_json()
    repos = _flatten_repos(data)
    topic_to_repos: dict[str, list[dict]] = defaultdict(list)

    for repo in repos:
        topics = repo.get("topics", [])
        if isinstance(topics, str):
            topics = [topics]
        for topic in topics:
            topic_to_repos[topic].append(repo)

    ranked_topics = sorted(
        topic_to_repos.items(),
        key=lambda item: (-len(item[1]), item[0]),
    )

    modules = []
    for index, (topic, repos) in enumerate(ranked_topics[:12], start=1):
        primary_repo = max(repos, key=lambda r: r.get("stars", 0))
        languages = {
            lang.get("language")
            for repo in repos
            for lang in repo.get("languages", [])
            if isinstance(lang, dict)
        }

        module_code = f"SYN_{index:02d}"
        description = primary_repo.get("description") or "No description provided."
        generated_topics = sorted({topic, *filter(None, primary_repo.get("topics", []))})

        modules.append(
            {
                "title_and_version": f"{topic.replace('-', ' ').title()} Track ({module_code})",
                "module_code": module_code,
                "core_focus": description,
                "topics": generated_topics,
                "semester": primary_repo.get("last_updated", "Recently updated"),
                "ects_credits": f"{max(len(repos), 1)} synthetic credits",
                "contact_time_hours": "Curated from GitHub activity",
                "self_study_time_hours": "Repository deep dive",
                "module_type": "Derived from GitHub",
                "prerequisites": "Interest in the topic",
                "grading_type": "N/A",
                "teaching_format": "Self-guided exploration",
                "assessment_type": "Build a project inspired by starred repos",
                "module_coordinator": primary_repo.get("author", "Community"),
                "qualification_objectives": [
                    f"Explore repositories related to {topic}",
                    "Synthesize insights across your starred projects",
                ],
                "key_contents": description,
                "learning_resources_url": primary_repo.get("url", ""),
                "languages": sorted(filter(None, languages))
                or [primary_repo.get("primary_language", "Unknown")],
                "resources": [
                    {"name": repo.get("name"), "url": repo.get("url")}
                    for repo in repos[:5]
                ],
            }
        )

    return modules


@st.cache_data(show_spinner="Loading university modules...")
def load_modules():
    """Loads curated modules when available, otherwise synthesises them from repos."""

    curated_modules = _load_university_modules()
    if curated_modules:
        return [_transform_module_record(record) for record in curated_modules]

    st.info(
        "Curated university module data not found. Generating learning tracks from your GitHub stars instead."
    )
    return _generate_modules_from_repos()



@st.cache_data(show_spinner="Loading GitHub repositories...")
def load_code_repos():
    """Loads and caches the GitHub repository data from data.json."""
    data = load_data_json()
    return _flatten_repos(data)



@st.cache_data(show_spinner="Loading knowledge base...")
def load_papers():
    """Synthesizes paper-like insights from the most starred repositories."""
    repos = load_code_repos()

    def summarise_languages(repo):
        lang_entries = [
            lang.get("language")
            for lang in repo.get("languages", [])
            if isinstance(lang, dict)
        ]
        if lang_entries:
            return ", ".join(lang_entries[:3])
        return repo.get("primary_language") or "Unknown"

    papers = []
    for repo in sorted(repos, key=lambda r: r.get("stars", 0), reverse=True)[:20]:
        topics = repo.get("topics", [])
        if isinstance(topics, str):
            topics = [topics]

        papers.append(
            {
                "title": f"{repo.get('name')} in Practice",
                "authors": [repo.get("author", "Unknown")],
                "year": _extract_year(repo.get("last_updated")),
                "description": repo.get("description") or "No description provided.",
                "tags": topics,
                "url": repo.get("url"),
                "citation_count": repo.get("stars", 0),
                "languages": summarise_languages(repo),
            }
        )

    return papers

def get_all_topics(modules_data, repos_list, kb_data):
    """Gathers and returns a sorted list of unique topics from all data sources."""
    all_topics = set()
    for module in modules_data:
        for topic in module.get("topics", []):
            all_topics.add(topic)
    for repo in repos_list:
        for topic in repo.get("topics", []):
            all_topics.add(topic)
    for kb in kb_data:
        for tag in kb.get("tags", []):
            all_topics.add(tag)
    return sorted(list(all_topics))


def _extract_year(value):
    if not value:
        return datetime.utcnow().year

    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%Y/%m/%d"):
        try:
            return datetime.strptime(value, fmt).year
        except ValueError:
            continue

    return datetime.utcnow().year
