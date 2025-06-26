# Repository Analysis Pipeline Using OpenAI Embeddings

**Author:** David Caballero
**Date:** March 2025

---

## Overview

This document describes an end-to-end pipeline for ingesting, processing, and analyzing metadata from 2,000 starred GitHub repositories using OpenAI embeddings. The pipeline performs the following tasks:

1. **Data Ingestion & Preprocessing:**
   Loads a JSON file containing repository metadata, fills in missing fields, and creates a unified text field from key attributes (e.g., repository name, description, topics).

2. **Embedding Generation:**
   Uses the OpenAI API to generate embeddings for the combined text field of each repository.

3. **Clustering & Visualization:**
   Applies K-Means clustering on the generated embeddings and uses PCA to reduce dimensionality for visualization.

4. **Retrieval-Augmented Generation (RAG) Search:**
   Implements a RAG-style search where a query is embedded and compared (via cosine similarity) to the repository embeddings, returning the top relevant results in JSON format.

---

## Requirements

- **Python Version:** Python 3.9 or higher
- **Dependencies:**
  - `pandas`
  - `numpy`
  - `tiktoken`
  - `openai`
  - `scikit-learn`
  - `matplotlib`
  - `python-dotenv`
- **Data File:**
  A JSON file named `2000_starred_repos.json` should be present in the working directory, containing repository metadata.
- **Environment Variable:**
  Create a `.env` file with your OpenAI API key:
