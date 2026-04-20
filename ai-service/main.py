from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

import fitz
import faiss
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer

from groq import Groq
from dotenv import load_dotenv

import pytesseract
from PIL import Image
import io
import os
import json

# ==================================================
# LOAD ENV VARIABLES
# ==================================================
from pathlib import Path
from dotenv import load_dotenv
import os

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found")

client = Groq(api_key=GROQ_API_KEY)

MODEL_NAME = "llama-3.1-8b-instant"

# ==================================================
# TESSERACT PATH (WINDOWS)
# ==================================================
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

# ==================================================
# FASTAPI APP
# ==================================================
app = FastAPI()

# ==================================================
# CORS
# ==================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================================================
# LOAD EMBEDDING MODEL
# ==================================================
embed_model = SentenceTransformer("all-MiniLM-L6-v2")

# ==================================================
# LOAD FAISS INDEX + METADATA
# ==================================================
index = faiss.read_index("faiss_index.bin")

with open("metadata.pkl", "rb") as f:
    meta = pickle.load(f)

texts = meta["texts"]
sources = meta["sources"]

# ==================================================
# REQUEST MODELS
# ==================================================
class FileRequest(BaseModel):
    file_path: str


class ChatRequest(BaseModel):
    report_text: str = ""
    question: str


# ==================================================
# HOME ROUTE
# ==================================================
@app.get("/")
def home():
    return {
        "message": "FAISS + OCR + Groq AI Service Running"
    }


# ==================================================
# PDF TEXT EXTRACTION + OCR
# ==================================================
@app.post("/extract-text")
def extract_text(data: FileRequest):
    try:
        text = ""
        doc = fitz.open(data.file_path)

        # Normal PDF text extraction
        for page in doc:
            text += page.get_text()

        # If no text found -> OCR
        if len(text.strip()) < 30:
            ocr_text = ""

            for page in doc:
                pix = page.get_pixmap()
                img_bytes = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_bytes))

                ocr_text += pytesseract.image_to_string(img)

            text = ocr_text

        return {
            "success": True,
            "text": text
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# ==================================================
# CHAT WITH RAG
# ==================================================
@app.post("/chat")
def chat(data: ChatRequest):
    try:
        question = data.question.strip()

        # Create query embedding
        query_embedding = embed_model.encode([question])
        query_embedding = np.array(query_embedding).astype("float32")

        # Search top result
        D, I = index.search(query_embedding, k=1)

        best_index = int(I[0][0])
        context = texts[best_index]
        source = sources[best_index]

        # Prompt
        prompt = f"""
You are a professional healthcare AI assistant.

Use the retrieved medical knowledge and patient report.

Retrieved Context:
{context}

Source:
{source}

Patient Report:
{data.report_text}

Question:
{question}

Instructions:
- Explain clearly in simple language
- Mention possible meaning
- Suggest healthy next steps
- Do not give final diagnosis
"""

        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.4,
        )

        answer = response.choices[0].message.content

        return {
            "answer": answer
        }

    except Exception as e:
        return {
            "answer": f"Error: {str(e)}"
        }


# ==================================================
# EXTRACT LAB VALUES
# ==================================================
@app.post("/extract-labs")
def extract_labs(data: ChatRequest):
    try:
        report_text = data.report_text

        prompt = f"""
You are a medical data extraction assistant.

Read the medical report carefully.

Extract all test names with numeric values.

Return ONLY valid JSON.

Example:
{{
  "Blood Sugar": 182,
  "Hemoglobin": 10.4,
  "Cholesterol": 245,
  "Creatinine": 1.2,
  "Vitamin D": 18
}}

Report:
{report_text}
"""

        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0,
        )

        result = response.choices[0].message.content.strip()

        # Clean markdown json if present
        result = result.replace("```json", "").replace("```", "").strip()

        # Validate JSON
        parsed = json.loads(result)

        return {
            "data": json.dumps(parsed)
        }

    except Exception as e:
        return {
            "data": "{}",
            "error": str(e)
        }


# ==================================================
# RUN:
# uvicorn main:app --reload --port 8000
# ==================================================