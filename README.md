<!-- # Enterprise RAG — Document Search System

> Internship project · Jun–Jul 2026 · FastAPI + React + Qdrant Cloud + OpenAI

---

## Project Structure

```
enterprise-rag/
├── backend/                  FastAPI application
│   ├── app/
│   │   ├── config/
│   │   │   └── settings.py   Pydantic settings (reads .env)
│   │   ├── routes/
│   │   │   ├── upload.py     POST /upload, GET /documents
│   │   │   ├── chunks.py     POST /chunk, GET /chunks
│   │   │   ├── embeddings.py POST /embed, GET /qdrant/stats
│   │   │   ├── auth.py       POST /auth/login, /auth/register
│   │   │   └── drive.py      GET /drive/files, POST /drive/import
│   │   ├── services/
│   │   │   ├── extractor.py  PDF/DOCX/PPTX/TXT text extraction + OCR
│   │   │   ├── chunker.py    RecursiveCharacterTextSplitter (800t/150t)
│   │   │   ├── embedder.py   OpenAI embeddings + Qdrant upsert
│   │   │   └── auth.py       JWT + bcrypt
│   │   ├── models.py         SQLAlchemy models (Document, Chunk, User, AuditLog)
│   │   ├── database.py       SQLAlchemy engine + session
│   │   └── main.py           FastAPI app entry point
│   ├── uploads/              Uploaded files (auto-created)
│   ├── requirements.txt
│   └── .env.example          → copy to .env and fill in secrets
│
└── frontend/                 React + Vite + Tailwind
    ├── src/
    │   ├── components/
    │   │   ├── Layout.tsx    Sidebar navigation
    │   │   └── StatusBadge.tsx
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── DocumentsPage.tsx  Status dashboard
    │   │   ├── UploadPage.tsx     Drag-and-drop upload
    │   │   ├── EmbeddingsPage.tsx Chunk + embed pipeline
    │   │   ├── DrivePage.tsx      Google Drive browser
    │   │   └── UsersPage.tsx      Admin RBAC panel
    │   ├── services/
    │   │   └── api.ts        Axios wrapper + all API calls
    │   ├── App.tsx           Router
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts        Proxy /api → localhost:8000
```

---

## Quick Start

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure secrets
cp .env.example .env
# Edit .env — fill in OPENAI_API_KEY, QDRANT_URL, QDRANT_API_KEY, JWT_SECRET_KEY

# Run
uvicorn app.main:app --reload --port 8000
# Swagger UI → http://localhost:8000/docs
```
cd backend && venv\Scripts\python.exe -m uvicorn app.main:app --port 8000

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App → http://localhost:5173
```

### 3. Google Drive (optional)

1. Create a Google Cloud project and enable the Drive API
2. Create a service account, download the JSON key
3. Save as `backend/credentials.json`
4. Share your Drive folder with the service account email

---

## Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key for `text-embedding-3-small` |
| `QDRANT_URL` | Qdrant Cloud cluster URL |
| `QDRANT_API_KEY` | Qdrant Cloud API key |
| `QDRANT_COLLECTION_NAME` | Collection name (default: `enterprise_rag`) |
| `JWT_SECRET_KEY` | Long random string for signing JWTs |
| `DATABASE_URL` | SQLite (default) or PostgreSQL connection string |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload single file |
| POST | `/api/upload/bulk` | Upload multiple files |
| GET | `/api/documents` | List all documents |
| GET | `/api/documents/{id}` | Document detail + status |
| DELETE | `/api/documents/{id}` | Delete document |
| POST | `/api/documents/{id}/chunk` | Chunk single document |
| POST | `/api/chunk/all` | Chunk all extracted docs |
| GET | `/api/documents/{id}/chunks` | List chunks |
| POST | `/api/documents/{id}/embed` | Embed single document |
| POST | `/api/embed/all` | Embed all chunked docs |
| GET | `/api/documents/{id}/embedding-status` | Embedding progress |
| GET | `/api/qdrant/stats` | Qdrant collection stats |
| POST | `/api/documents/{id}/reprocess` | Delete vectors + re-run |
| POST | `/api/process-all` | Extract (OCR retry), chunk, and embed ALL stored docs (manager+). |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login → JWT |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/chat` | Chat over documents with LLM answer generation |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/users` | List users (admin) |
| PUT | `/api/users/{id}/role` | Update role (admin) |
| PUT | `/api/users/{id}/disable` | Disable user (admin) |
| GET | `/api/drive/files` | List Drive files |
| POST | `/api/drive/import/{file_id}` | Import one file |
| POST | `/api/drive/import-all` | Import all files |

---

## OCR prerequisites (Windows)

`pytesseract` needs **Tesseract**, and `pdf2image` needs **Poppler** (specifically `pdftoppm`).

If OCR fails, the backend will mark the document as `failed` and include an actionable message in `extraction_error`.

---

## Migrating from Colab

Copy these from your Colab project to this repo:

| Colab path | Destination |
|---|---|
| `/content/project_root/rag_demo.db` | `backend/rag_demo.db` |
| `/content/project_root/uploads/` | `backend/uploads/` |
| `My Drive/credentials.json` | `backend/credentials.json` |

The `.env` file replaces all Colab `_secret()` calls.
