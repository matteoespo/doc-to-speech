"""
Document-to-Speech API

FastAPI backend that accepts PDF or TXT document uploads,
extracts the text content, and converts it to speech using
the ElevenLabs text-to-speech API.
"""

import io
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import PyPDF2
from elevenlabs import ElevenLabs

# App initialisation
from dotenv import load_dotenv
load_dotenv()


app = FastAPI(title="Document-to-Speech API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Warn early if the API key is missing so the developer knows before
# the first request hits the ElevenLabs client.
if not os.environ.get("ELEVENLABS_API_KEY"):
    print(
        "WARNING: ELEVENLABS_API_KEY environment variable is not set. "
        "Text-to-speech conversion will fail."
    )

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/")
async def root():
    """Health-check / landing endpoint."""
    return {"status": "ok", "message": "Document-to-Speech API"}


@app.post("/api/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """Accept a PDF or TXT upload and extract text."""
    filename = file.filename or ""
    extension = os.path.splitext(filename)[1].lower()

    if extension not in (".pdf", ".txt"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a .pdf or .txt file.",
        )

    file_bytes = await file.read()
    text = ""

    if extension == ".txt":
        text = file_bytes.decode("utf-8")
    elif extension == ".pdf":
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text

    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract any text from the document.",
        )

    return {"text": text[:2000]}  # Cap at 2000 characters initially


class AudioRequest(BaseModel):
    text: str
    voice_id: str = "JBFqnCBsd6RMkjVDRZzb"


@app.post("/api/generate-audio")
async def generate_audio(request: AudioRequest):
    """Convert text to speech using ElevenLabs and stream the response."""
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    # Cap at 2000 characters for safety/costs
    text = text[:2000]

    try:
        client = ElevenLabs(api_key=os.environ.get("ELEVENLABS_API_KEY"))

        audio_iterator = client.text_to_speech.convert(
            voice_id=request.voice_id,
            model_id="eleven_flash_v2_5",
            text=text,
            output_format="mp3_44100_128",
        )

        def audio_streamer():
            for chunk in audio_iterator:
                if chunk:
                    yield chunk

        return StreamingResponse(
            audio_streamer(),
            media_type="audio/mpeg",
            headers={"Content-Disposition": 'inline; filename="output.mp3"'},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Text-to-speech conversion failed: {exc}",
        )
