import streamlit as st
import json
import os

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

@st.cache_data(show_spinner="Loading university modules...")
def load_modules():
    """Creates mock module data based on repository topics from data.json."""
    data = load_data_json()
    # Create synthesized modules from repository topics
    all_topics = set()
    for lang_group in data:
        for repo in lang_group.get("repos", []):
            for topic in repo.get("topics", []):
                all_topics.add(topic)

    # Create a synthetic module for each major topic
    modules = []
    for i, topic in enumerate(sorted(all_topics)):
        if i > 10:  # Limit to 10 synthetic modules
            break
        modules.append({
            "title_and_version": f"CS{i+100}: {topic.replace('-', ' ').title()}",
            "core_focus": f"Study of {topic.replace('-', ' ')}",
            "topics": [topic],
            "semester": "Fall 2023",
            "credits": 3,
            "description": f"An exploration of {topic.replace('-', ' ')} concepts and applications."
        })
    return modules



@st.cache_data(show_spinner="Loading GitHub repositories...")
def load_code_repos():
    """Loads and caches the GitHub repository data from data.json."""
    data = load_data_json()
    repos = []
    for lang_group in data:
        for repo in lang_group.get("repos", []):
            repos.append(repo)
    return repos



@st.cache_data(show_spinner="Loading knowledge base...")
def load_papers():
    """Creates synthetic research papers based on repository topics from data.json."""
    data = load_data_json()

    # Extract all topics and languages to create synthetic papers
    all_topics = set()
    all_languages = set()

    for lang_group in data:
        all_languages.add(lang_group.get("language", "Unknown"))
        for repo in lang_group.get("repos", []):
            for topic in repo.get("topics", []):
                all_topics.add(topic)

    # Create synthetic papers based on topics and languages
    papers = []
    for i, topic in enumerate(sorted(all_topics)):
        if i > 15:  # Limit to 15 synthetic papers
            break
        papers.append({
            "title": f"Advances in {topic.replace('-', ' ').title()} Technology",
            "authors": ["KBLLR", "Git Stars"],
            "year": 2023,
            "description": f"A research study exploring {topic.replace('-', ' ')} applications and techniques.",
            "tags": [topic] + list(sorted(all_topics))[:2],  # Add the topic and a couple more
            "url": f"https://example.org/papers/{topic}",
            "citation_count": i * 10 + 5  # Just a placeholder value
        })
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
