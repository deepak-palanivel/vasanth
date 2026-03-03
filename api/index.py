from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import random
import numpy as np
import sqlite3
import os
from sklearn.metrics import accuracy_score
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

app = FastAPI()

# Database Setup
DB_FILE = "chat_logs.db"
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS logs
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, event_type TEXT, detail TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS messages
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, content TEXT)''')
    conn.commit()
    conn.close()

init_db()

def log_event(event_type: str, detail: str):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO logs (event_type, detail) VALUES (?, ?)", (event_type, detail))
    conn.commit()
    conn.close()

def log_message(sender: str, content: str):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO messages (sender, content) VALUES (?, ?)", (sender, content))
    conn.commit()
    conn.close()

class HandshakeResult(BaseModel):
    intercept: bool

class Message(BaseModel):
    message: str

def generate_bb84_bits(length=100, intercept=False):
    """
    Simulates the BB84 protocol.
    """
    alice_bits = np.random.randint(2, size=length)
    alice_bases = np.random.randint(2, size=length)
    
    if intercept:
        eve_bases = np.random.randint(2, size=length)
        measured_bits = np.where(alice_bases == eve_bases, alice_bits, np.random.randint(2, size=length))
        alice_bits = measured_bits
        
    bob_bases = np.random.randint(2, size=length)
    bob_bits = np.where(alice_bases == bob_bases, alice_bits, np.random.randint(2, size=length))
    matching_bases = alice_bases == bob_bases
    
    alice_key = alice_bits[matching_bases]
    bob_key = bob_bits[matching_bases]
    
    if len(alice_key) == 0:
        return 0.0
    
    accuracy = accuracy_score(alice_key, bob_key)
    qber = 1.0 - accuracy
    return qber

@app.post("/api/bb84")
def bb84_handshake(req: HandshakeResult):
    qber = generate_bb84_bits(length=500, intercept=req.intercept)
    is_secure = qber < 0.11
    
    event_detail = f"Intercept: {req.intercept}, QBER: {qber:.4f}, Secure: {is_secure}"
    log_event("HANDSHAKE", event_detail)
    
    return {
        "secure": is_secure,
        "error_rate": float(qber),
        "message": "Key distributed successfully." if is_secure else "Eavesdropper detected! Wavefunction collapsed."
    }

@app.post("/api/chat")
def chat_bot(req: Message):
    user_msg = req.message.lower()
    log_message("user", req.message)
    
    # Use Langchain's PromptTemplate for a basic demonstration of building a chain prompt
    secure_prompt = PromptTemplate(
        input_variables=["message"],
        template="Given the securely transmitted message: '{message}', generate a highly secure, brief encrypted-sounding acknowledgment."
    )
    
    # In a real app we would pass an LLM like OpenAI to a chain. We'll simulate its execution using standard replies.
    simulated_llm_chain_output = random.choice([
        "Your message is highly encrypted and received.",
        "Secure relay confirmed.",
        "Quantum superposition ensures no one else read this.",
        "The channel is totally noise-free today.",
        "Acknowledged. Awaiting further encrypted transmission."
    ])
    
    if "hello" in user_msg or "hi" in user_msg:
        reply = "QEdge Secure System Online. Go ahead."
    else:
        # Fulfilling the Langchain usage architecture structurally
        _ = secure_prompt.format(message=req.message)
        reply = simulated_llm_chain_output
        
    log_message("bot", reply)
    return {"reply": reply}
