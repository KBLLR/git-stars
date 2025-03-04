import os
import json
import subprocess
from tqdm import tqdm
import pickle
import faiss
import numpy as np

# Configuration
BATCH_DIRECTORY = "./batch_jsons"  # Directory containing your batch JSON files
CLEANED_MERGED_FILE = "cleaned_merged_document_classifications.json"  # Output file after cleaning and merging
EMBEDDINGS_FILE = "document_embeddings_mxbai.pkl"  # Output file for embeddings
FAISS_INDEX_FILE = "faiss_document_index.pkl"  # Output file for FAISS index
OLLAMA_MODEL = "mxbai-embed-large:latest"  # Ollama model to use for embeddings

def list_batch_json_files(directory: str, prefix: str = "batch_") -> list:
    """
    List all JSON files in the specified directory that start with the given prefix.

    Args:
        directory (str): The directory path.
        prefix (str): The prefix that the filenames should start with.

    Returns:
        list: A list of file paths.
    """
    files = []
    for filename in os.listdir(directory):
        if filename.startswith(prefix) and filename.endswith(".json"):
            files.append(os.path.join(directory, filename))
    return files

def load_and_merge_json_files(file_paths: list) -> list:
    """
    Load and merge multiple JSON files into a single list of documents.

    Args:
        file_paths (list): List of file paths to load.

    Returns:
        list: A list of documents.
    """
    merged_data = []
    for file_path in file_paths:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    merged_data.extend(data)
                else:
                    print(f"Warning: {file_path} does not contain a list. Skipping.")
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON from {file_path}: {str(e)}")
        except Exception as e:
            print(f"Unexpected error processing {file_path}: {str(e)}")
    return merged_data

def clean_data(documents: list) -> list:
    """
    Remove documents that contain the 'error' field.

    Args:
        documents (list): The list of documents.

    Returns:
        list: A cleaned list of documents.
    """
    cleaned_documents = [doc for doc in documents if "error" not in doc]
    return cleaned_documents

def extract_text(documents: list) -> list:
    """
    Extract relevant text from each document.

    Args:
        documents (list): The list of documents.

    Returns:
        list: A list of texts.
    """
    texts = []
    for doc in documents:
        # Combine title, description, and tags into a single text
        text = f"Title: {doc.get('title', '')}\nDescription: {doc.get('description', '')}\nTags: {', '.join(doc.get('tags', []))}"
        texts.append(text)
    return texts

def generate_embeddings(texts: list, model_name: str) -> list:
    """
    Generate embeddings for a list of texts using an Ollama model.

    Args:
        texts (list): The list of texts.
        model_name (str): The name of the Ollama model to use.

    Returns:
        list: A list of embeddings.
    """
    embeddings = []
    for text in tqdm(texts, desc="Generating embeddings"):
        try:
            # Call Ollama's CLI to generate embedding
            result = subprocess.run(
                ["ollama", "run", model_name, text],
                capture_output=True,
                text=True,
                check=True
            )
            # Parse the embedding from the Ollama response
            # Adjust this based on Ollama's actual output format
            embedding = json.loads(result.stdout)
            embeddings.append(embedding)
        except subprocess.CalledProcessError as e:
            print(f"Error generating embedding for text: {text}\n{e.stderr}")
            embeddings.append(None)
        except json.JSONDecodeError:
            print(f"Invalid JSON response for text: {text}")
            embeddings.append(None)
    return embeddings

def create_faiss_index(embeddings: list) -> faiss.Index:
    """
    Create a FAISS index from a list of embeddings.

    Args:
        embeddings (list): The list of embeddings.

    Returns:
        faiss.Index: The FAISS index.
    """
    # Convert embeddings to a NumPy array
    embeddings_array = np.array(embeddings, dtype=np.float32)
    # Assume embeddings are of size 512. Adjust based on Ollama's output
    embedding_size = embeddings_array.shape[1]
    # Create a FlatL2 index
    index = faiss.IndexFlatL2(embedding_size)
    index.add(embeddings_array)
    return index

def save_faiss_index(index: faiss.Index, file_path: str):
    """
    Save the FAISS index to a file.

    Args:
        index (faiss.Index): The FAISS index.
        file_path (str): The path to the output file.
    """
    faiss.write_index(index, file_path)
    print(f"FAISS index saved to: {file_path}")

def main():
    # 1. List and load batch JSON files
    batch_files = list_batch_json_files(BATCH_DIRECTORY)
    if not batch_files:
        print("No batch JSON files found in the specified directory.")
        return

    # 2. Load and merge data
    print("Loading and merging batch JSON files...")
    documents = load_and_merge_json_files(batch_files)
    print(f"Total documents before cleaning: {len(documents)}")

    # 3. Clean data
    print("Cleaning data...")
    cleaned_documents = clean_data(documents)
    print(f"Total documents after cleaning: {len(cleaned_documents)}")

    # 4. Extract text
    print("Extracting text from documents...")
    texts = extract_text(cleaned_documents)
    print(f"Total texts extracted: {len(texts)}")

    # 5. Generate embeddings
    print(f"Generating embeddings using Ollama model: {OLLAMA_MODEL}...")
    embeddings = generate_embeddings(texts, OLLAMA_MODEL)
    print(f"Total embeddings generated: {len(embeddings)}")

    # 6. Create FAISS index
    print("Creating FAISS index...")
    index = create_faiss_index(embeddings)
    print("FAISS index created successfully.")

    # 7. Save FAISS index
    save_faiss_index(index, FAISS_INDEX_FILE)

    # 8. (Optional) Save embeddings and metadata
    # If you want to save the embeddings and metadata for later use
    metadata = [{"title": doc.get("title", ""), "description": doc.get("description", ""), "tags": doc.get("tags", []), "document": doc.get("document", "")} for doc in cleaned_documents]
    with open(EMBEDDINGS_FILE, "wb") as f:
        pickle.dump(embeddings, f)
    with open("metadata.pkl", "wb") as f:
        pickle.dump(metadata, f)
    print("Embeddings and metadata saved successfully.")

    # 9. (Optional) Query the FAISS index
    # Example: Find the top 5 most similar documents to a query
    query_text = "What is the latest research on liver regeneration?"
    print(f"Generating embedding for query: {query_text}")
    query_embedding = generate_embeddings([query_text], OLLAMA_MODEL)[0]
    if query_embedding is None:
        print("Failed to generate embedding for query.")
        return
    query_embedding_np = np.array([query_embedding], dtype=np.float32)
    distances, indices = index.search(query_embedding_np, 5)
    print("Top 5 similar documents:")
    for i, idx in enumerate(indices[0]):
        print(f"{i+1}. Distance: {distances[0][i]}")
        print(f"   Title: {metadata[idx].get('title', '')}")
        print(f"   Description: {metadata[idx].get('description', '')}")
        print(f"   Document: {metadata[idx].get('document', '')}")

if __name__ == "__main__":
    main()
