
import os
import io
import json
import fitz
import pytesseract
from PIL import Image
from dotenv import load_dotenv
from groq import Groq
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(title="MediAssist AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://ai-medical-report-analyser-quz6ea0di-poojashri-d-s-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status":"running"}

@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    try:
        text=""
        if file.filename.lower().endswith(".pdf"):
            pdf_bytes = await file.read()
            doc = fitz.open(stream=pdf_bytes,filetype="pdf")
            for page in doc:
                text += page.get_text()
            if len(text.strip()) < 30:
                text=""
                doc = fitz.open(stream=pdf_bytes,filetype="pdf")
                for page in doc:
                    pix = page.get_pixmap()
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    text += pytesseract.image_to_string(img)
        else:
            img = Image.open(io.BytesIO(await file.read()))
            text = pytesseract.image_to_string(img)
        return {"success":True,"text":text}
    except Exception as e:
        return {"success":False,"error":str(e)}

@app.post("/extract-labs")
async def extract_labs(request: Request):
    body = await request.json()
    report = body.get("report_text","")
    prompt = f"""
Extract laboratory values from the report.
Return ONLY valid JSON.

Example:
{{
 "Blood Sugar":"110",
 "Hemoglobin":"13.2",
 "Cholesterol":"180"
}}

Report:
{report}
"""
    try:
        r = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role":"user","content":prompt}]
        )
        return {"data": r.choices[0].message.content}
    except Exception as e:
        return {"data":"{}","error":str(e)}

@app.post("/chat")
async def chat(request: Request):
    body = await request.json()
    report = body.get("report_text","")
    question = body.get("question","")
    prompt = f"""
You are a medical report assistant.
Answer only from the report. If unsure, say so.
Report:
{report}

Question:
{question}
"""
    try:
        r = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role":"user","content":prompt}]
        )
        return {"answer": r.choices[0].message.content}
    except Exception as e:
        return {"answer":"Error","error":str(e)}
