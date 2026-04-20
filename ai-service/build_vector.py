import os
import pickle
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

DATA_FOLDER = "data"

model = SentenceTransformer("all-MiniLM-L6-v2")

texts = []
sources = []

# Load all txt files
for file in os.listdir(DATA_FOLDER):
    if file.endswith(".txt"):
        path = os.path.join(DATA_FOLDER, file)

        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        chunks = [content[i:i+500] for i in range(0, len(content), 500)]

        for chunk in chunks:
            texts.append(chunk)
            sources.append(file)

# Create embeddings
embeddings = model.encode(texts)
embeddings = np.array(embeddings).astype("float32")

# Create FAISS index
dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(embeddings)

# Save files
faiss.write_index(index, "faiss_index.bin")

with open("metadata.pkl", "wb") as f:
    pickle.dump(
        {
            "texts": texts,
            "sources": sources
        },
        f
    )

print("FAISS index created successfully.")