"""
LLM Handler for NOVA Chatbot.
Supports both OpenAI and Anthropic APIs.
Builds prompts with conversation history for context-aware responses.
"""

import os
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """You are NOVA (Neural Optimized Virtual Assistant), an advanced AI assistant built for intelligent conversation. You are:

- Highly knowledgeable and articulate
- Concise but thorough in your responses  
- Context-aware — you remember and reference earlier parts of the conversation
- Friendly yet professional in tone
- Capable of explaining complex topics clearly

You were created as a showcase of advanced NLP and AI capabilities. When asked about yourself, explain that you combine sentiment analysis, intent detection, named entity recognition, and large language model reasoning.

Always respond helpfully and intelligently. Keep responses focused and under 200 words unless a detailed explanation is requested."""


def _get_provider() -> str:
    return os.getenv("API_PROVIDER", "openai").lower()


def _build_messages(history: List[Dict], user_message: str) -> List[Dict]:
    """Build message list with system prompt + conversation history."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    for msg in history:
        messages.append({
            "role": msg["role"],
            "content": msg["content"],
        })
    
    messages.append({"role": "user", "content": user_message})
    return messages


async def get_llm_response(
    user_message: str,
    history: List[Dict],
) -> str:
    """
    Get response from LLM API (OpenAI or Anthropic).
    Falls back to a smart local response if no API key is configured.
    """
    provider = _get_provider()
    
    # ── Try OpenAI ──────────────────────────────────────────────────
    if provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY", "")
        if api_key and api_key != "your_openai_key_here":
            try:
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=api_key)
                messages = _build_messages(history, user_message)
                
                response = await client.chat.completions.create(
                    model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
                    messages=messages,
                    max_tokens=500,
                    temperature=0.7,
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"⚠️  OpenAI API error: {e}")
    
    # ── Try Anthropic ───────────────────────────────────────────────
    elif provider == "anthropic":
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if api_key and api_key != "your_anthropic_key_here":
            try:
                import anthropic
                client = anthropic.AsyncAnthropic(api_key=api_key)
                
                # Build messages without system (Anthropic handles it separately)
                msgs = []
                for msg in history:
                    msgs.append({
                        "role": msg["role"],
                        "content": msg["content"],
                    })
                msgs.append({"role": "user", "content": user_message})
                
                response = await client.messages.create(
                    model=os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307"),
                    max_tokens=500,
                    system=SYSTEM_PROMPT,
                    messages=msgs,
                )
                return response.content[0].text
            except Exception as e:
                print(f"⚠️  Anthropic API error: {e}")
    
    # ── Fallback: Smart local response ──────────────────────────────
    return _generate_local_response(user_message, history)


def _generate_local_response(user_message: str, history: List[Dict]) -> str:
    """
    Generate an intelligent local response without an LLM API.
    This provides a great demo experience even without API keys.
    """
    msg_lower = user_message.lower().strip()
    turn_count = len(history) // 2 + 1
    
    # Greeting responses
    greetings = ["hello", "hi", "hey", "greetings", "good morning", "good evening", "good afternoon"]
    if any(g in msg_lower for g in greetings):
        responses = [
            f"Hello! I'm NOVA, your Neural Optimized Virtual Assistant. This is turn {turn_count} of our conversation. How can I help you today?",
            f"Hey there! Welcome to NOVA. I'm an AI assistant powered by advanced NLP — I can analyze sentiment, detect intents, and recognize named entities in real-time. What would you like to explore?",
            f"Hi! Great to see you. I'm NOVA — check out the NLP panel on the right to see real-time analysis of our conversation. What's on your mind?",
        ]
        return responses[turn_count % len(responses)]
    
    # Questions about NOVA
    if any(w in msg_lower for w in ["who are you", "what are you", "about you", "your name", "what can you do"]):
        return ("I'm NOVA — Neural Optimized Virtual Assistant. I'm a showcase of modern NLP capabilities:\n\n"
                "🔹 **Sentiment Analysis** — I analyze the emotional tone of your messages using VADER\n"
                "🔹 **Intent Detection** — I classify your intent using zero-shot learning (BART-MNLI)\n"  
                "🔹 **Named Entity Recognition** — I identify people, organizations, places, and dates using spaCy\n"
                "🔹 **Context Memory** — I remember our last 10 conversation turns\n\n"
                "Try mentioning a person, company, or place — watch the NLP panel light up!")
    
    # Questions about NLP
    if any(w in msg_lower for w in ["sentiment", "nlp", "entity", "intent", "ner", "natural language"]):
        return ("Great question! Here's what's happening behind the scenes:\n\n"
                "📊 **Sentiment Analysis (VADER)** scores your message from -1 (negative) to +1 (positive)\n"
                "🎯 **Intent Detection** uses Facebook's BART-MNLI model for zero-shot classification\n"
                "🏷️ **Named Entity Recognition** uses spaCy's transformer pipeline to find entities\n\n"
                f"I'm currently remembering {turn_count} turns of our conversation. "
                "Check the right panel to see all these analyses in real-time!")
    
    # Farewell
    if any(w in msg_lower for w in ["bye", "goodbye", "see you", "farewell", "quit", "exit"]):
        return f"Goodbye! It was great chatting with you over {turn_count} turns. Feel free to come back anytime! 👋"
    
    # Thank you
    if any(w in msg_lower for w in ["thank", "thanks", "appreciate"]):
        return "You're welcome! I'm here to help. Feel free to ask me anything — and keep an eye on the NLP panel to see how I analyze each message! 🚀"
    
    # Help
    if any(w in msg_lower for w in ["help", "how to", "guide"]):
        return ("Here are some things you can try to see NOVA's NLP capabilities:\n\n"
                "💬 **Mention entities**: 'Tell me about Google's office in New York'\n"
                "😊 **Express emotion**: 'I'm really happy today!' or 'This is frustrating'\n"
                "❓ **Ask questions**: 'What is machine learning?'\n"
                "👋 **Greetings/Farewells**: 'Hello!' or 'Goodbye!'\n"
                "📝 **Give commands**: 'Summarize the key NLP techniques'\n\n"
                "Watch the NLP panel update in real-time with each message!")
    
    # Default intelligent response
    context_note = f" (I've been tracking our conversation for {turn_count} turns)" if turn_count > 1 else ""
    
    return (f"That's an interesting message{context_note}! I've analyzed it with my NLP pipeline — "
            f"check the panel on the right to see the sentiment score, detected intent, and any named entities I found.\n\n"
            f"💡 **Tip**: Try mentioning specific people (like 'Elon Musk'), organizations (like 'NASA'), "
            f"or places (like 'Tokyo') to see entity recognition in action!\n\n"
            f"I'm running in local mode — connect an OpenAI or Anthropic API key in the .env file for full LLM-powered responses.")
