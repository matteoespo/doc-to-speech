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
from fastapi.responses import Response
import PyPDF2
from elevenlabs import ElevenLabs

# ---------------------------------------------------------------------------
# App initialisation
# ---------------------------------------------------------------------------

from dotenv import load_dotenv
load_dotenv()


app = FastAPI(title="Document-to-Speech API")

# Allow the Vite dev-server origin for local development.
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


@app.post("/api/convert-document")
async def convert_document(file: UploadFile = File(...)):
    """Accept a PDF or TXT upload, extract text, and return MP3 audio."""

    # --- 1. Validate the file extension --------------------------------
    filename = file.filename or ""
    extension = os.path.splitext(filename)[1].lower()

    if extension not in (".pdf", ".txt"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a .pdf or .txt file.",
        )

    # --- 2. Read and extract text --------------------------------------
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

    # --- 3. Validate extracted text ------------------------------------
    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract any text from the document.",
        )

    # --- 4. Truncate to a reasonable length ----------------------------
    # ElevenLabs requests can be large; cap at 2 000 characters to keep
    # latency and cost manageable during development.
    text = text[:2000]

    # --- 5. Convert text to speech via ElevenLabs ----------------------
    try:
        client = ElevenLabs(api_key=os.environ.get("ELEVENLABS_API_KEY"))

        audio_iterator = client.text_to_speech.convert(
            voice_id="JBFqnCBsd6RMkjVDRZzb",
            model_id="eleven_flash_v2_5",
            text=text,
            output_format="mp3_44100_128",
        )

        # Materialise the streamed chunks into a single bytes object.
        audio_bytes = b"".join(audio_iterator)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Text-to-speech conversion failed: {exc}",
        )

    # --- 6. Return the audio as a downloadable MP3 ---------------------
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Disposition": 'attachment; filename="output.mp3"'},
    )
