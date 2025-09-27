import streamlit as st
import json
import os
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


@st.cache_data(show_spinner="Loading university modules...")
def load_modules():
    """Derives module-like learning paths from real repository metadata."""
    data = load_data_json()
    repos = _flatten_repos(data)
    topic_to_repos: dict[str, list[dict]] = defaultdict(list)

    for repo in repos:
        topics = repo.get("topics", [])
        if isinstance(topics, str):
            topics = [topics]
        for topic in topics:
            topic_to_repos[topic].append(repo)

    # Rank topics by how many repositories reference them to surface meaningful tracks
    ranked_topics = sorted(
        topic_to_repos.items(),
        key=lambda item: (-len(item[1]), item[0]),
    )

    modules = []
    for topic, repos in ranked_topics[:12]:
        primary_repo = max(repos, key=lambda r: r.get("stars", 0))
        languages = {
            lang.get("language")
            for repo in repos
            for lang in repo.get("languages", [])
            if isinstance(lang, dict)
        }

        modules.append(
            {
                "title_and_version": f"{topic.replace('-', ' ').title()} Track",
                "core_focus": primary_repo.get("description")
                or "No description provided.",
                "topics": sorted({topic, *primary_repo.get("topics", [])}),
                "semester": primary_repo.get("last_updated", "Recently updated"),
                "credits": max(len(repos), 1),
                "description": (
                    f"Curated from {len(repos)} repositories such as "
                    + ", ".join(repo.get("name", "Unnamed") for repo in repos[:3])
                ),
                "languages": sorted(filter(None, languages))
                or [primary_repo.get("primary_language", "Unknown")],
                "resources": [
                    {"name": repo.get("name"), "url": repo.get("url")}
                    for repo in repos[:5]
                ],
            }
        )

    return modules



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
