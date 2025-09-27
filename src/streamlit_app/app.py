import streamlit as st
import networkx as nx
from pyvis.network import Network
import streamlit.components.v1 as components
import random
import os

# Import the data loading and utility functions from utils.py
from utils import load_modules, load_code_repos, load_papers, get_all_topics

# --- Page Configuration ---
st.set_page_config(
    page_title="Git Stars Dashboard",
    page_icon="⭐",
    layout="wide",
    initial_sidebar_state="expanded"
)


# --- UI Rendering Functions for each Tab ---

def render_cards(items, card_type="module"):
    """Generic function to display items in a responsive 3-column grid."""
    if not items:
        st.info(f"No {card_type}s to display with the current filters.")
        return

    cols = st.columns(3)
    for i, item in enumerate(items):
        with cols[i % 3]:
            if card_type == "module":
                st.subheader(item.get("title_and_version", "No Title"))
                st.write("**Core Focus:**", item.get("core_focus", "N/A"))
                st.write("**Topics:**", ", ".join(item.get("topics", [])))
                st.write("**Languages:**", ", ".join(item.get("languages", [])))
                resources = item.get("resources", [])
                if resources:
                    st.markdown("**Highlighted Repositories:**")
                    for resource in resources:
                        name = resource.get("name", "Repository")
                        url = resource.get("url")
                        if url:
                            st.markdown(f"- [{name}]({url})")
                        else:
                            st.markdown(f"- {name}")
            elif card_type == "repo":
                repo_name = item.get("name", item.get("title", "Unnamed Repository"))
                st.subheader(repo_name)
                st.write(item.get("description", "No description provided"))

                # Handle different language formats
                if isinstance(item.get("languages"), list):
                    if item["languages"] and isinstance(item["languages"][0], dict):
                        languages = ", ".join([lang.get("language", "N/A") for lang in item.get("languages", [])])
                    else:
                        languages = ", ".join(item.get("languages", []))
                else:
                    languages = "N/A"

                st.write(f"**Languages:** {languages} | **Stars:** {item.get('stars', 0)}")
                if item.get("url"):
                    st.markdown(f"[Repository URL]({item['url']})")
            elif card_type == "paper":
                st.subheader(item.get("title", "No Title"))
                st.write(item.get("description", "No description provided"))
                st.write("**Tags:**", ", ".join(item.get("tags", [])))
                if item.get("languages"):
                    st.write("**Languages:**", item.get("languages"))
            st.markdown("---")


def render_project_generator_tab(all_topics, modules_data, repos_list, kb_data):
    """Renders the UI for the Project Generator tab."""
    st.header("Project Generator")
    st.write("Select topics to generate project ideas by combining insights from different domains.")
    project_topics = st.multiselect("Select Topics for Project", all_topics)

    if not project_topics:
        st.info("Please select at least one topic to generate ideas.")
        return

    ideas = []
    for topic in project_topics:
        # Safely extract topics from modules
        mod_candidates = [m for m in modules_data if topic in m.get("topics", [])]

        # Safely extract topics from repos
        repo_candidates = []
        for r in repos_list:
            repo_topics = r.get("topics", [])
            # Handle both string and list topics
            if isinstance(repo_topics, str):
                repo_topics = [repo_topics]
            if topic in repo_topics:
                repo_candidates.append(r)

        # Safely extract tags from papers
        paper_candidates = [p for p in kb_data if topic in p.get("tags", [])]

        # Generate project idea if we have at least one candidate in each category
        if mod_candidates or repo_candidates:
            mod_choice = random.choice(mod_candidates) if mod_candidates else {"title_and_version": "No matching module"}
            repo_choice = random.choice(repo_candidates) if repo_candidates else {"name": "No matching repository"}
            paper_choice = random.choice(paper_candidates) if paper_candidates else {"title": "No matching paper"}

            idea = (
                f"### Project Idea for **{topic}**\n"
                f"- **From University:** *{mod_choice.get('title_and_version', 'N/A')}*\n"
                f"- **From Code:** *{repo_choice.get('name', 'N/A')}*\n"
                f"- **From Research:** *{paper_choice.get('title', 'N/A')}*\n\n"
                f"**Concept:** Combine insights from these sources to explore or address a challenge in **{topic}**."
            )
            ideas.append(idea)
        else:
            ideas.append(f"Could not generate a full idea for '{topic}' due to missing data in one or more categories.")

    for idea in ideas:
        st.markdown(idea)
        st.markdown("---")


def render_network_graph_tab(modules_data, repos_list, kb_data):
    """Renders the interactive network graph and its statistics."""
    st.header("Network Graph Explorer")

    # --- Visualization Controls ---
    col1, col2, col3 = st.columns(3)
    with col1:
        st.subheader("Display Options")
        show_modules = st.checkbox("Show Modules", True)
        show_repos = st.checkbox("Show Repositories", True)
        show_papers = st.checkbox("Show Papers", True)
    with col2:
        st.subheader("Physics & Layout")
        physics = st.checkbox("Enable Physics", True)
        layout = st.selectbox("Layout Algorithm", ["barnesHut", "forceAtlas2Based", "hierarchical"])
    with col3:
        st.subheader("Labels")
        edge_stats = st.checkbox("Show Edge Labels", False)
        node_stats = st.checkbox("Show Node Degrees", False)

    st.caption("Modules and Papers are derived from your starred repositories' live metadata.")

    # --- Graph Generation ---
    G = nx.Graph()
    if show_modules:
        for mod in modules_data:
            G.add_node(mod.get("title_and_version", "No Title"), group="module", size=20)
    if show_repos:
        for repo in repos_list:
            G.add_node(repo.get("name", "Unnamed Repository"), group="repo", size=15)
    if show_papers:
        for doc in kb_data:
            G.add_node(doc.get("title", "No Title"), group="doc", size=10)

    # --- Edge Connection Logic ---
    def connect_nodes(source_list, target_list, source_key, target_key):
        for src in source_list:
            for tgt in target_list:
                src_label = src.get("title_and_version") or src.get("name") or src.get("title")
                tgt_label = tgt.get("title_and_version") or tgt.get("name") or tgt.get("title")
                if not src_label or not tgt_label or src_label == tgt_label: continue

                # Get topics from source and target
                src_topics = src.get(source_key, [])
                tgt_topics = tgt.get(target_key, [])

                # Ensure topics are iterable
                if isinstance(src_topics, str):
                    src_topics = [src_topics]
                if isinstance(tgt_topics, str):
                    tgt_topics = [tgt_topics]

                shared = set(src_topics) & set(tgt_topics)
                if shared:
                    G.add_edge(src_label, tgt_label, weight=len(shared), title=", ".join(shared))

    if show_modules and show_repos: connect_nodes(modules_data, repos_list, "topics", "topics")
    if show_modules and show_papers: connect_nodes(modules_data, kb_data, "topics", "tags")
    if show_repos and show_papers: connect_nodes(repos_list, kb_data, "topics", "tags")

    if G.number_of_nodes() == 0:
        st.warning("No nodes to display. Please select at least one data type to show.")
        return

    # --- Pyvis Network Creation and Styling ---
    net = Network(height="800px", width="100%", bgcolor="#222222", font_color="white", notebook=True)
    net.from_nx(G)

    # Node styling
    group_colors = {"module": "#ffcc00", "repo": "#66ccff", "doc": "#99ff99"}
    for node in net.nodes:
        node["color"] = group_colors.get(node["group"], "#888888")
        if node_stats: node["title"] = f"Connections: {G.degree(node['id'])}"

    components.html(net.generate_html(name="network.html"), height=800, scrolling=True)

    # --- Statistics Section ---
    st.header("Network Statistics")
    if G.number_of_nodes() > 0:
        col1, col2, col3 = st.columns(3)
        with col1:
            st.subheader("Basic Metrics")
            st.metric("Total Nodes", G.number_of_nodes())
            st.metric("Total Edges", G.number_of_edges())
            st.metric("Network Density", f"{nx.density(G):.4f}")
        with col2:
            st.subheader("Most Connected")
            degrees = sorted(G.degree, key=lambda x: x[1], reverse=True)[:5]
            for node, degree in degrees: st.write(f"🔗 {node} ({degree})")
        with col3:
            st.subheader("Key Connectors")
            betweenness = nx.betweenness_centrality(G)
            top_between = sorted(betweenness.items(), key=lambda x: x[1], reverse=True)[:5]
            for node, score in top_between: st.write(f"⚡ {node} ({score:.3f})")


# --- Main Application ---
def main():
    """Main function to run the Streamlit application."""
    # --- Load all data once ---
    modules_data = load_modules()
    repos_list = load_code_repos()
    kb_data = load_papers()
    all_topics = get_all_topics(modules_data, repos_list, kb_data)

    # --- Sidebar Filter ---
    st.sidebar.header("Filter Options")
    selected_topics = st.sidebar.multiselect("Filter content by Topics", all_topics)

    def filter_by_topics(data, key):
        if not selected_topics: return data
        return [item for item in data if any(topic in item.get(key, []) for topic in selected_topics)]

    filtered_modules = filter_by_topics(modules_data, "topics")
    filtered_repos = filter_by_topics(repos_list, "topics")
    filtered_kb = filter_by_topics(kb_data, "tags")

    # --- Main Page Tabs ---
    tab_titles = ["GitHub Repos", "University Modules", "Research Papers", "Project Generator", "Network Graph"]
    github_tab, uni_tab, papers_tab, generator_tab, network_tab = st.tabs(tab_titles)

    # Display app information
    st.sidebar.markdown("## Git Stars Dashboard")
    st.sidebar.markdown("This dashboard visualizes your GitHub starred repositories and generates synthetic educational content based on repository topics.")
st.sidebar.markdown("**Note:** The learning paths and research spotlights are built directly from your starred repositories' topics, languages, and update history.")

    with github_tab:
        render_cards(filtered_repos, card_type="repo")

    with uni_tab:
        render_cards(filtered_modules, card_type="module")

    with papers_tab:
        render_cards(filtered_kb, card_type="paper")

    with generator_tab:
        render_project_generator_tab(all_topics, modules_data, repos_list, kb_data)

    with network_tab:
        render_network_graph_tab(filtered_modules, filtered_repos, filtered_kb)


if __name__ == "__main__":
    main()
