#!/usr/bin/env python3
"""
Repository Analysis Pipeline
===========================================
This script ingests a JSON file of starred GitHub repositories, preprocesses the data,
generates embeddings for each repository's descriptive text, clusters the repositories
using K-Means, visualizes the clusters with PCA, and implements a retrieval-augmented
generation (RAG) style search. Finally, it outputs search results in JSON format.

Requirements:
    - Python 3.9+
    - Libraries: pandas, numpy, tiktoken, openai, scikit-learn, matplotlib, python-dotenv
    - A valid OpenAI API key set in a .env file (e.g., OPENAI_API_KEY=your_key)
    - The JSON file "data.json" in the working directory

Usage:
    $ python repo_analysis.py

Author: David Caballero
Date: March 2025
"""

import os
import json
import time
import logging
import pandas as pd
import numpy as np
import tiktoken
import openai
from dotenv import load_dotenv
from pathlib import Path
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
from utils.embeddings_utils import get_embedding, cosine_similarity

# --------------------------
# Setup Logging
# --------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("repo_analysis_debug.log"),
        logging.StreamHandler()
    ]
)

# --------------------------
# Load Environment Variables
# --------------------------
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    logging.error("OPENAI_API_KEY is missing! Please check your .env file.")
    exit(1)

# --------------------------
# Constants & Setup
# --------------------------
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_ENCODING = "cl100k_base"
DATA_JSON = "data.json"
OUTPUT_CSV = "data/data_starred_repos_with_embeddings.csv"

# Initialize tiktoken encoding (used for token counting)
encoding = tiktoken.get_encoding(EMBEDDING_ENCODING)

# --------------------------
# Data Ingestion & Preprocessing
# --------------------------
def load_repos(json_path: str) -> pd.DataFrame:
    """
    Load repository data from a JSON file and return a DataFrame.
    """
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        logging.info(f"Loaded {len(data)} repositories from {json_path}")
        return pd.DataFrame(data)
    except Exception as e:
        logging.error(f"Failed to load JSON file: {e}")
        exit(1)

def preprocess_repos(df: pd.DataFrame) -> pd.DataFrame:
    """
    Preprocess repository data:
      - Fill missing descriptions.
      - Flatten topics (assumes topics is a list) into a comma-separated string.
      - Combine key textual fields (name, description, topics) into one field.
    """
    df["description"] = df["description"].fillna("")

    def flatten_topics(topics):
        if isinstance(topics, list):
            return ", ".join(topics)
        return topics
    df["topics"] = df["topics"].apply(flatten_topics)

    df["combined_text"] = (
        df["name"].astype(str) + ". " +
        df["description"] + ". Topics: " +
        df["topics"].astype(str)
    )
    return df

# --------------------------
# Embedding Generation
# --------------------------
def generate_embeddings_for_repos(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generate embeddings for each repository using the combined_text field.
    """
    embeddings = []
    start_time = time.time()
    for idx, row in df.iterrows():
        try:
            text = row["combined_text"]
            emb = get_embedding(text, model=EMBEDDING_MODEL)
            embeddings.append(emb)
            if (idx + 1) % 100 == 0:
                logging.info(f"Processed {idx + 1}/{len(df)} repositories")
        except Exception as e:
            logging.error(f"Error generating embedding for repo '{row['name']}': {e}")
            embeddings.append(None)
    df["embedding"] = embeddings
    logging.info(f"Completed embedding generation in {time.time() - start_time:.2f} seconds")
    return df

# --------------------------
# Clustering & Visualization
# --------------------------
def perform_clustering(df: pd.DataFrame, n_clusters: int = 10) -> pd.DataFrame:
    """
    Perform K-Means clustering on the repository embeddings.
    """
    # Filter out repos with missing embeddings
    df_clean = df[df["embedding"].notnull()].copy()
    embedding_matrix = np.vstack(df_clean["embedding"].tolist())
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    df_clean["cluster"] = kmeans.fit_predict(embedding_matrix)
    logging.info("K-Means clustering completed")
    return df_clean

def visualize_clusters(df: pd.DataFrame):
    """
    Visualize the clusters using PCA to reduce embedding dimensions to 2D.
    """
    embedding_matrix = np.vstack(df["embedding"].tolist())
    pca = PCA(n_components=2)
    reduced = pca.fit_transform(embedding_matrix)
    df["x"] = reduced[:, 0]
    df["y"] = reduced[:, 1]
    plt.figure(figsize=(10, 8))
    scatter = plt.scatter(df["x"], df["y"], c=df["cluster"], cmap="viridis", alpha=0.7)
    plt.colorbar(scatter, label="Cluster")
    plt.title("Repository Clusters via PCA")
    plt.xlabel("PCA Component 1")
    plt.ylabel("PCA Component 2")
    plt.tight_layout()
    plt.show()

# --------------------------
# Retrieval-Augmented Generation (RAG) Search
# --------------------------
def search_repos(df: pd.DataFrame, query: str, top_n: int = 5) -> list:
    """
    Given a query, generate an embedding, compute cosine similarity with each repository,
    and return the top_n matching repositories as a JSON-friendly list.
    """
    query_embedding = get_embedding(query, model=EMBEDDING_MODEL)
    df["similarity"] = df["embedding"].apply(lambda emb: cosine_similarity(emb, query_embedding))
    results = df.sort_values("similarity", ascending=False).head(top_n)
    return json.loads(results.to_json(orient="records", indent=2))

# --------------------------
# Main Execution Pipeline
# --------------------------
if __name__ == "__main__":
    start_time = time.time()

    # Step 1: Load and preprocess the repository data
    df_repos = load_repos(DATA_JSON)
    df_repos = preprocess_repos(df_repos)

    # Step 2: Generate embeddings for each repository
    df_repos = generate_embeddings_for_repos(df_repos)

    # Save the processed DataFrame for reference
    output_dir = Path("data")
    output_dir.mkdir(exist_ok=True)
    df_repos.to_csv(OUTPUT_CSV, index=False)
    logging.info(f"Saved processed data with embeddings to {OUTPUT_CSV}")

    # Step 3: Perform clustering on repositories with valid embeddings
    df_clustered = perform_clustering(df_repos, n_clusters=10)

    # Step 4: Visualize the clusters
    visualize_clusters(df_clustered)

    # Step 5: Perform a sample RAG-style search
    query = "local knowledge base and AI assistants"
    search_results = search_repos(df_clustered, query, top_n=5)
    print("Search Results (JSON):")
    print(json.dumps(search_results, indent=2))

    elapsed_time = time.time() - start_time
    logging.info(f"Pipeline completed in {elapsed_time:.2f} seconds")
