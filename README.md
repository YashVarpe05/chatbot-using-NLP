# 🌟 NOVA — Neural Optimized Virtual Assistant

An advanced AI chatbot showcasing real-time NLP analysis capabilities, built for college presentation and demo.

![Tech Stack](https://img.shields.io/badge/React-18-blue?style=flat-square)
![Tech Stack](https://img.shields.io/badge/FastAPI-Python-green?style=flat-square)
![Tech Stack](https://img.shields.io/badge/NLP-spaCy%20%7C%20VADER%20%7C%20BART-purple?style=flat-square)

## ✨ Features

| Feature | Technology | What It Does |
|---------|-----------|--------------|
| 🎭 Sentiment Analysis | VADER | Scores message emotion from -1 to +1 with animated gauge |
| 🎯 Intent Detection | BART-MNLI (Zero-Shot) | Classifies intent: question, greeting, command, etc. |
| 🏷️ Named Entity Recognition | spaCy | Highlights people, organizations, places, dates |
| 🧠 Context Memory | Python Dict | Remembers last 10 conversation turns |
| 💬 AI Responses | OpenAI / Anthropic / Local | Contextual responses with conversation history |

## 🏗️ Architecture

```
User Message
    │
    ├── VADER Sentiment → Score + Label
    ├── BART-MNLI → Intent Classification
    ├── spaCy NER → Named Entities
    │
    ├── Memory (last 10 turns)
    │
    └── LLM API → Contextual Response
    
Response + NLP Analysis → Frontend
```

## 🚀 Local Setup (Windows)

### Prerequisites
- **Python 3.9+** installed
- **Node.js 18+** installed
- (Optional) OpenAI or Anthropic API key

### Backend Setup

```powershell
cd nova-chatbot\backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy language model
python -m spacy download en_core_web_sm

# (Optional) Copy and edit .env for LLM API
copy .env.example .env
# Edit .env with your API key if you have one

# Start the server
uvicorn main:app --reload
```

The API will be available at **http://localhost:8000**  
API docs at **http://localhost:8000/docs**

### Frontend Setup

```powershell
cd nova-chatbot\frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at **http://localhost:5173**

## 🚀 Local Setup (Mac/Linux)

### Backend Setup

```bash
cd nova-chatbot/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy language model
python -m spacy download en_core_web_sm

# (Optional) Copy and edit .env for LLM API
cp .env.example .env

# Start the server
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd nova-chatbot/frontend
npm install
npm run dev
```

## ⚙️ Environment Variables

Create a `.env` file in `/backend`:

```env
# Choose your LLM provider
API_PROVIDER=openai          # or "anthropic"

# API Keys (at least one required for full LLM responses)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Model selection (optional, defaults shown)
OPENAI_MODEL=gpt-3.5-turbo
ANTHROPIC_MODEL=claude-3-haiku-20240307
```

> **Note:** NOVA works WITHOUT an API key! It uses a smart local fallback mode that provides intelligent responses and demonstrates all NLP capabilities.

## 🎨 UI Features

- **Glassmorphism** UI with frosted glass effects
- **Neon accents** (purple, cyan, electric blue)
- **Animated particle field** background with connected nodes
- **Framer Motion** animations on every interaction
- **Real-time NLP panel** showing live analysis
- **Animated sentiment gauge** with arc visualization
- **Color-coded entity chips** (PERSON=purple, ORG=cyan, GPE=green, DATE=orange)
- **Dark theme** with deep navy/black base
- **Mobile responsive** layout

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API info |
| `GET` | `/health` | Health check |
| `POST` | `/chat` | Send message, get response + NLP analysis |
| `POST` | `/clear` | Clear session memory |
| `GET` | `/analyze?text=...` | Analyze text without LLM response |
| `WS` | `/ws/{session_id}` | WebSocket real-time chat |

### POST /chat Request
```json
{
  "message": "Tell me about Google's office in New York",
  "session_id": "optional-uuid"
}
```

### POST /chat Response
```json
{
  "reply": "...",
  "sentiment": {
    "compound": 0.0,
    "positive": 0.0,
    "negative": 0.0,
    "neutral": 1.0,
    "label": "neutral"
  },
  "intent": {
    "top_intent": "question",
    "confidence": 0.89,
    "all_intents": { ... }
  },
  "entities": [
    { "text": "Google", "label": "ORG", "color": "cyan" },
    { "text": "New York", "label": "GPE", "color": "green" }
  ],
  "memory_length": 2,
  "session_id": "uuid"
}
```

## 🧪 Demo Tips for Presentation

1. **Entity Recognition**: Say "Elon Musk works at Tesla in California"
2. **Sentiment Analysis**: Say "I'm absolutely thrilled!" vs "This is terrible"
3. **Intent Detection**: Try a question, greeting, and command
4. **Memory**: Ask a question referencing something from 3+ turns ago
5. **NLP Panel**: Toggle the panel and show the full analysis breakdown

## 📁 Project Structure

```
nova-chatbot/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatPage.jsx        # Main chat interface
│   │   │   ├── MessageBubble.jsx   # Glassmorphism chat bubbles
│   │   │   ├── NLPPanel.jsx        # Right-side analysis panel
│   │   │   ├── SentimentGauge.jsx  # Animated arc gauge
│   │   │   ├── EntityChips.jsx     # Color-coded entity badges
│   │   │   ├── TypingIndicator.jsx # Animated neon dots
│   │   │   ├── ParticleBackground.jsx # Canvas particle field
│   │   │   ├── Navbar.jsx          # Glass navbar with status
│   │   │   ├── Landing.jsx         # Hero landing page
│   │   │   └── AboutPage.jsx       # NLP techniques explained
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css               # Glassmorphism + neon styles
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/
│   ├── main.py              # FastAPI server
│   ├── nlp_pipeline.py      # VADER + BART + spaCy
│   ├── memory.py            # Session memory manager
│   ├── llm_handler.py       # LLM API integration
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 3, Framer Motion |
| Backend | FastAPI, Uvicorn |
| Sentiment | VADER (vaderSentiment) |
| Intent | BART-MNLI (HuggingFace Transformers) |
| NER | spaCy (en_core_web_sm) |
| LLM | OpenAI / Anthropic (with local fallback) |
| Icons | Lucide React |
| Font | Inter (UI), JetBrains Mono (code) |

---

**Built with ❤️ for college presentation**
