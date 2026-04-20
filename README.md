# 🏥 MediAssist AI – Medical Report Analyzer

MediAssist AI is a full-stack AI-powered healthcare web application that helps users upload medical reports, extract lab values, detect health risks, visualize trends, and chat with an AI assistant for report understanding.

---

# ✨ Features

## 👤 User Authentication
- Register
- Login
- JWT Authentication

## 📄 Report Upload
- Upload PDF medical reports
- Extract text from reports
- Store reports securely

## 🔍 AI Lab Extraction
Automatically extracts:
- Blood Sugar
- Hemoglobin
- Cholesterol
- Creatinine
- Vitamin D
- TSH
- HDL
- LDL
- Triglycerides
- And more...

## 🚨 Smart Risk Detection
Detects:
- High
- Low
- Borderline
- Normal
- Healthy

## 📈 Dashboard
- Metric cards
- Charts
- Compare reports
- Risk summary
- Premium UI

## 🤖 AI Chat Assistant
Ask:
- What does my sugar level mean?
- Is cholesterol high?
- Give summary
- Health suggestions

## 🧾 PDF Summary
Download AI-generated report summary.

## 🧠 RAG System
Uses:
- FAISS Vector DB
- Sentence Transformers
- Groq LLM

---

# 🛠️ Tech Stack

## Frontend
- React.js
- Tailwind CSS
- Axios
- Recharts
- jsPDF

## Backend
- Node.js
- Express.js
- MongoDB
- JWT
- Multer

## AI Service
- FastAPI
- Groq API
- FAISS
- OCR
- PyMuPDF
- Sentence Transformers

---

# 📂 Project Structure

```bash
GEN AI/
│── frontend/
│── backend/
│── ai-service/
│── uploads/
│── .gitignore
│── README.md

⚙️ Installation
1️⃣ Clone Project
git clone https://github.com/yourusername/mediassist-ai.git
cd mediassist-ai

2️⃣ Backend Setup
cd backend
npm install
Create .env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
Run Backend
npm run dev

3️⃣ Frontend Setup
cd frontend
npm install
npm run dev

4️⃣ AI Service Setup
cd ai-service
pip install -r requirements.txt
Create .env
GROQ_API_KEY=your_groq_key
Run AI Service
uvicorn main:app --reload --port 8000

🚀 API Routes
🔐 Auth
POST /api/auth/register
POST /api/auth/login

📄 Reports
GET /api/reports
POST /api/reports

🤖 Chat
POST /api/chat
GET /api/chat-history
⚡ AI Service
POST /extract-text
POST /extract-labs
POST /chat

📊 Dashboard Features
Reports Count
Metrics Count
Overall Risk
Health Trends
Compare Reports
AI Chat
PDF Summary

🔐 Security
JWT Protected Routes
Hidden API Keys in .env
Secure Uploads

🌟 Future Enhancements
Doctor Recommendation
Appointment Booking
Voice Assistant
Cloud Deployment
Mobile App
Multi-language Support

👨‍💻 Author

Poojashri D
