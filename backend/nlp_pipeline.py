"""
NLP Pipeline for NOVA Chatbot.
Performs: Sentiment Analysis (VADER), Intent Detection (zero-shot), NER (spaCy).
All models run locally — no cloud NLP APIs needed.
"""

import spacy
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from transformers import pipeline
from typing import Dict, List, Any

# ── Initialize Models (loaded once at import time) ──────────────────────────

# spaCy NER model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("[WARN] spaCy model not found. Run: python -m spacy download en_core_web_sm")
    nlp = None

# VADER Sentiment Analyzer
vader = SentimentIntensityAnalyzer()

# Zero-shot intent classifier (HuggingFace)
# Uses facebook/bart-large-mnli — downloads once, cached locally
_intent_classifier = None

INTENT_LABELS = [
    "question",
    "greeting",
    "command",
    "complaint",
    "compliment",
    "farewell",
    "information",
    "request",
]


def _get_intent_classifier():
    """Lazy-load the intent classifier to avoid slow startup."""
    global _intent_classifier
    if _intent_classifier is None:
        print("[*] Loading zero-shot classifier (first time may take a minute)...")
        _intent_classifier = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli",
            device=-1,  # CPU
        )
        print("[OK] Zero-shot classifier loaded!")
    return _intent_classifier


# ── Sentiment Analysis ──────────────────────────────────────────────────────

def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Analyze sentiment using VADER.
    Returns compound score (-1 to 1) and label.
    """
    scores = vader.polarity_scores(text)
    compound = scores["compound"]
    
    if compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"
    
    return {
        "compound": round(compound, 4),
        "positive": round(scores["pos"], 4),
        "negative": round(scores["neg"], 4),
        "neutral": round(scores["neu"], 4),
        "label": label,
    }


# ── Intent Detection ────────────────────────────────────────────────────────

def detect_intent(text: str) -> Dict[str, Any]:
    """
    Detect user intent via zero-shot classification.
    Returns top intent label and confidence scores.
    """
    try:
        classifier = _get_intent_classifier()
        result = classifier(text, INTENT_LABELS, multi_label=False)
        
        return {
            "top_intent": result["labels"][0],
            "confidence": round(result["scores"][0], 4),
            "all_intents": {
                label: round(score, 4)
                for label, score in zip(result["labels"], result["scores"])
            },
        }
    except Exception as e:
        print(f"[WARN] Intent detection error: {e}")
        return {
            "top_intent": "unknown",
            "confidence": 0.0,
            "all_intents": {},
        }


# ── Named Entity Recognition ───────────────────────────────────────────────

ENTITY_COLORS = {
    "PERSON": "purple",
    "ORG": "cyan",
    "GPE": "green",
    "DATE": "orange",
    "TIME": "orange",
    "MONEY": "yellow",
    "PRODUCT": "pink",
    "EVENT": "blue",
    "LOC": "green",
    "NORP": "teal",
    "FAC": "indigo",
    "WORK_OF_ART": "rose",
}


def extract_entities(text: str) -> List[Dict[str, str]]:
    """
    Extract named entities using spaCy.
    Returns list of entities with text, label, start/end positions, and color.
    """
    if nlp is None:
        return []
    
    doc = nlp(text)
    entities = []
    
    for ent in doc.ents:
        entities.append({
            "text": ent.text,
            "label": ent.label_,
            "start": ent.start_char,
            "end": ent.end_char,
            "color": ENTITY_COLORS.get(ent.label_, "gray"),
        })
    
    return entities


# ── Full Pipeline ───────────────────────────────────────────────────────────

def run_full_pipeline(text: str) -> Dict[str, Any]:
    """
    Run the complete NLP pipeline on a message.
    Returns sentiment, intent, and entities.
    """
    return {
        "sentiment": analyze_sentiment(text),
        "intent": detect_intent(text),
        "entities": extract_entities(text),
    }
