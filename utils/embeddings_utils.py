import os
import logging
import openai
import numpy as np
from dotenv import load_dotenv
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

# ✅ Load environment variables
load_dotenv()

# ✅ Configure OpenAI API key
#
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    logging.error("OPENAI_API_KEY is missing! Check your .env file.")
    exit(1)

# ✅ Instantiate OpenAI client
client = OpenAI()

def get_function_name(code: str) -> str:
    """ Extracts function name from a Python function definition. """
    for prefix in ['def ', 'async def ']:
        if code.startswith(prefix):
            return code[len(prefix): code.index('(')]
    return "unknown_function"

# ✅ Retry mechanism for embedding API calls
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def get_embedding(text: str, model="text-embedding-3-small") -> list[float]:
    """ Fetches an embedding for the given text with retry handling. """
    if not text.strip():
        logging.warning("Skipping empty input to get_embedding.")
        return []

    try:
        response = client.embeddings.create(input=[text], model=model)
        return response.data[0].embedding
    except Exception as e:
        logging.error(f"Embedding failed: {e}")
        return []

def cosine_similarity(a, b):
    """ Computes cosine similarity between two embeddings. """
    if not a or not b:
        return -1  # Return a default low similarity score if embeddings are empty
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
