import streamlit as st
import json
import networkx as nx
from pyvis.network import Network
import streamlit.components.v1 as components
import random
import subprocess
from cartesia import Cartesia

# --- Set Page Configuration ---
st.set_page_config(page_title="Integrated Dashboard", layout="wide", initial_sidebar_state="expanded")

# --- Data Loading Functions with Caching ---
@st.cache_data(show_spinner=False)
def load_modules():
    with open("data/modules.json", "r") as f:
        data = json.load(f)["modules"]
    return data

@st.cache_data(show_spinner=False)
def load_code_repos():
    with open("data/repositories.json", "r") as f:
        code_data = json.load(f)
    repos = []
    for item in code_data:
        repos.extend(item.get("repos", []))
    return repos

@st.cache_data(show_spinner=False)
def load_papers():
    with open("data/papers.json", "r") as f:
        return json.load(f)

# --- Load Data ---
modules_data = load_modules()
repos_list = load_code_repos()
kb_data = load_papers()

# --- Gather All Topics for Filtering ---
all_topics = set()

# Collect from existing topic fields in all data sources
for module in modules_data:
    for topic in module.get("topics", []):  # Directly use predefined topics
        all_topics.add(topic)
for repo in repos_list:
    for topic in repo.get("topics", []):
        all_topics.add(topic)
for kb in kb_data:
    for tag in kb.get("tags", []):
        all_topics.add(tag)
all_topics = sorted(list(all_topics))


# --- Sidebar Filter (for network graph and project generator) ---
st.sidebar.header("Filter Options")
selected_topics = st.sidebar.multiselect("Select Topics", all_topics)

def filter_by_topics(data, key):
    if not selected_topics:
        return data
    filtered = []
    for item in data:
        if any(topic in item.get(key, []) for topic in selected_topics):
            filtered.append(item)
    return filtered

filtered_modules = filter_by_topics(modules_data, "topics")
filtered_repos = filter_by_topics(repos_list, "topics")
filtered_kb = filter_by_topics(kb_data, "tags")

# --- Helper Functions for Displaying Cards in a Grid ---
def display_cards(items, card_type="module"):
    # Create a responsive grid with 3 columns per row
    cols = st.columns(3)
    for i, item in enumerate(items):
        with cols[i % 3]:
            if card_type == "module":
                st.subheader(item.get("title_and_version", "No Title"))
                st.write("**Credits:**", item.get("credits_and_workload", "N/A"))
                st.write("**Coordinator:**", item.get("coordinator", "N/A"))
                st.write("**Core Focus:**", item.get("core_focus", "N/A"))
                st.write("**Topics:**", item.get("topics", []))
            elif card_type == "repo":
                repo_name = item.get("name", item.get("title", "Unnamed Repository"))
                st.subheader(repo_name)
                st.write(item.get("description", "No description provided"))
                languages = ", ".join([lang.get("language", "N/A") for lang in item.get("languages", [])])
                st.write("**Languages:**", languages)
                st.write("**Topics:**", item.get("topics", []))
                st.write("**Stars:**", item.get("stars", 0))
                if item.get("url"):
                    st.markdown(f"[Repository URL]({item['url']})")
            elif card_type == "paper":
                st.subheader(item.get("title", "No Title"))
                st.write(item.get("description", "No description provided"))
                st.write("**Tags:**", item.get("tags", []))
            st.markdown("---")

# --- Create Tabs ---
tabs = st.tabs(["Github", "University", "Papers", "Project Generator", "Network Graph"])

# --- Tab 1: Github (Code Repositories) ---
with tabs[0]:
    st.header("Github Repositories")
    display_cards(repos_list, card_type="repo")

# --- Tab 2: University (Modules) ---
with tabs[1]:
    st.header("University Modules")
    display_cards(modules_data, card_type="module")

# --- Tab 3: Papers (Knowledge Base Documents) ---
with tabs[2]:
    st.header("Knowledge Base Papers")
    display_cards(kb_data, card_type="paper")

# --- Tab 4: Project Generator ---
with tabs[3]:
    st.header("Project Generator")
    st.write("Select topics to generate project ideas:")
    project_topics = st.multiselect("Select Topics for Project", all_topics)
    if not project_topics:
        st.info("Please select at least one topic to generate ideas.")
    else:
        ideas = []
        for topic in project_topics:
            mod_candidates = [m for m in modules_data if topic in m.get("topics", [])]
            repo_candidates = [r for r in repos_list if topic in r.get("topics", [])]
            paper_candidates = [p for p in kb_data if topic in p.get("tags", [])]
            if mod_candidates and repo_candidates and paper_candidates:
                mod_choice = random.choice(mod_candidates)
                repo_choice = random.choice(repo_candidates)
                paper_choice = random.choice(paper_candidates)
                idea = (
                    f"### Project Idea for **{topic}**\n"
                    f"- **Module:** {mod_choice.get('title_and_version', 'No Title')}\n"
                    f"- **Repository:** {repo_choice.get('name', repo_choice.get('title', 'Unnamed Repository'))}\n"
                    f"- **Paper:** {paper_choice.get('title', 'No Title')}\n\n"
                    f"Combine design and technical insights from the module, repository, and paper to address challenges in **{topic}**."
                )
                ideas.append(idea)
            else:
                ideas.append(f"Not enough data available for topic '{topic}'.")
        for idea in ideas:
            st.markdown(idea)
            st.markdown("---")


# --- Tab 5: Network Graph ---
with tabs[4]:
    st.header("Network Graph Explorer")

    # Visualization Controls
    col1, col2, col3 = st.columns(3)
    with col1:
        show_modules = st.checkbox("Show Modules", True)
        show_repos = st.checkbox("Show Repositories", True)
        show_papers = st.checkbox("Show Papers", True)
    with col2:
        physics = st.checkbox("Enable Physics", True)
        layout = st.selectbox("Layout Algorithm",
                            ["barnesHut", "forceAtlas2Based", "hierarchical"])
    with col3:
        edge_stats = st.checkbox("Show Edge Labels", False)
        node_stats = st.checkbox("Show Node Degrees", False)

    # Generate Network Graph
    G = nx.Graph()

    # Add nodes based on selections
    if show_modules:
        for mod in modules_data:
            label = mod.get("title_and_version", "No Title")
            G.add_node(label, label=label, group="module", size=20)

    if show_repos:
        for repo in repos_list:
            label = repo.get("name", repo.get("title", "Unnamed Repository"))
            G.add_node(label, label=label, group="repo", size=15)

    if show_papers:
        for doc in kb_data:
            label = doc.get("title", "No Title")
            G.add_node(label, label=label, group="doc", size=10)

    # Add edges between different node types
    def connect_nodes(source_list, target_list, source_key, target_key):
        for src in source_list:
            for tgt in target_list:
                src_label = src.get("title_and_version",
                                  src.get("name",
                                  src.get("title", "No Title")))
                tgt_label = tgt.get("title_and_version",
                                  tgt.get("name",
                                  tgt.get("title", "No Title")))
                shared = set(src.get(source_key, [])) & set(tgt.get(target_key, []))
                if shared and src_label != tgt_label:
                    G.add_edge(src_label, tgt_label, weight=len(shared), title=", ".join(shared))


    if show_modules and show_repos:
        connect_nodes(modules_data, repos_list, "topics", "topics")
    if show_modules and show_papers:
        connect_nodes(modules_data, kb_data, "topics", "tags")
    if show_repos and show_papers:
        connect_nodes(repos_list, kb_data, "topics", "tags")

    # Create Pyvis network
    net = Network(height="800px", width="100%", bgcolor="#222222", font_color="white")
    net.from_nx(G)

    # Visualization options
    net.set_options("""
    {
      "physics": {
        "enabled": %s,
        "solver": "%s",
        "stabilization": {
          "iterations": 100
        }
      },
      "edges": {
        "color": {
          "inherit": true
        },
        "smooth": false
      },
      "nodes": {
        "scaling": {
          "min": 10,
          "max": 30
        }
      }
    }
    """ % (str(physics).lower(), layout))

    # Node styling
    group_colors = {
        "module": "#ffcc00",
        "repo": "#66ccff",
        "doc": "#99ff99"
    }

    for node in net.nodes:
        node["color"] = group_colors.get(node["group"], "#888888")
        if node_stats:
            node["title"] += f"\nConnections: {G.degree(node['id'])}"

    # Edge styling
    for edge in net.edges:
        # Safely handle edge titles
        if edge_stats:
            edge["title"] = f"Shared topics: {edge.get('title', 'N/A')}"

        # Safely handle weights with fallback
        edge_weight = edge.get("weight", 1)  # Default to 1 if weight missing
        edge["width"] = edge_weight * 0.5

        # Add color based on connection strength
        if edge_weight > 3:
            edge["color"] = "#ff0000"
        elif edge_weight > 1:
            edge["color"] = "#ff9900"
        else:
            edge["color"] = "#cccccc"


    # Show graph
    components.html(net.generate_html(), height=800)

    # --- Statistics Section ---
    st.header("Network Statistics")

    if G.number_of_nodes() > 0:
        col1, col2, col3 = st.columns(3)

        # Basic stats
        with col1:
            st.subheader("Basic Metrics")
            st.metric("Total Nodes", G.number_of_nodes())
            st.metric("Total Edges", G.number_of_edges())
            st.metric("Network Density", f"{nx.density(G):.4f}")

        # Degree centrality
        with col2:
            st.subheader("Most Connected Nodes")
            degrees = sorted(G.degree, key=lambda x: x[1], reverse=True)[:5]
            for node, degree in degrees:
                st.write(f"🔗 {node} ({degree} connections)")

        # Betweenness centrality
        with col3:
            st.subheader("Key Connectors")
            betweenness = nx.betweenness_centrality(G)
            top_between = sorted(betweenness.items(),
                               key=lambda x: x[1],
                               reverse=True)[:5]
            for node, score in top_between:
                st.write(f"⚡ {node} ({score:.3f})")
    else:
        st.warning("No nodes to display - adjust your filters")
