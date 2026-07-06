# Document Audio Reader

A full-stack Document-to-Speech application that converts PDF and TXT files into lifelike audio using the ElevenLabs API.

**Backend:** FastAPI (Python) · **Frontend:** React + Vite + Tailwind CSS v4

---

## Prerequisites

- **Docker** and **Docker Compose** (Recommended)
- OR **Python 3.12+** and **uv** (for local development)
- **Node.js 18+** and npm (if running locally without Docker)
- An **[ElevenLabs](https://elevenlabs.io/) API key** (free tier available)

---

## Project Structure

```
doc-to-speech/
├── backend/
│   ├── main.py              # FastAPI application
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # React UI component
│   │   ├── index.css        # Tailwind CSS entry
│   │   └── main.jsx         # React entry point
│   ├── index.html           # HTML shell
│   ├── vite.config.js       # Vite + Tailwind config
│   ├── package.json         # Node dependencies
│   └── Dockerfile           # Frontend container
├── docker-compose.yml       # Docker services configuration
├── .env.example             # Example environment variables
└── README.md
```

---

## Quick Start

### 1. Set your ElevenLabs API key

Copy the example `.env` file and add your key:

```bash
cp .env.example .env
```

Edit `.env` to include your actual API key:
```env
ELEVENLABS_API_KEY=your-api-key-here
```

### 2. Run with Docker Compose (Recommended)

Start both the backend and frontend in one command:

```bash
docker-compose up --build
```

- The API will be available at **http://localhost:8000**
- The web app will be available at **http://localhost:5173**

---

### Alternative: Run locally (without Docker)

If you prefer to run the services directly on your host machine.

#### Backend (using uv)

```bash
cd backend

# Create a virtual environment with uv and activate it
uv venv
source .venv/bin/activate

# Install dependencies using uv
uv pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

#### Frontend

Open a **new terminal** and run:

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

---

## Usage

1. Open **http://localhost:5173** in your browser.
2. Drag and drop a `.pdf` or `.txt` file onto the upload area (or click to browse).
3. Click **"Read Document to Me"**.
4. Wait for the ElevenLabs API to generate the audio (a spinner will show).
5. Once ready, an audio player will appear — hit play and listen!

---

## API Reference

### `POST /api/convert-document`

Accepts a file upload and returns an MP3 audio file.

| Parameter | Type       | Description                    |
| --------- | ---------- | ------------------------------ |
| `file`    | `UploadFile` | A `.pdf` or `.txt` file      |

**Response:** `audio/mpeg` (MP3 binary stream)

**Constraints:**
- Text is truncated to the first **2,000 characters** before conversion.
- Only `.pdf` and `.txt` files are accepted.

---

## Configuration

| Environment Variable   | Required | Description                                |
| ---------------------- | -------- | ------------------------------------------ |
| `ELEVENLABS_API_KEY`   | Yes      | Your ElevenLabs API key                    |

The backend uses the **`eleven_flash_v2_5`** model with the **George** voice (`JBFqnCBsd6RMkjVDRZzb`) by default. You can change the voice and model in `backend/main.py`.

---

## Tech Stack

| Layer    | Technology                                              |
| -------- | ------------------------------------------------------- |
| Backend  | Python 3.12+, FastAPI, Uvicorn, PyPDF2, ElevenLabs SDK  |
| Frontend | React 19, Vite, Tailwind CSS v4                         |
| TTS      | ElevenLabs API (`eleven_flash_v2_5`)                    |

---

## License

MIT
