import json
import os
from datetime import datetime

from app.database import SessionLocal
from app.services.chunker import chunk_all_documents
from app.services.embedder import embed_all_documents, get_qdrant_stats

db = SessionLocal()

chunk_result = chunk_all_documents(db)
print('Chunking result:', chunk_result)

embed_result = embed_all_documents(db)
print('Embedding result:', embed_result)

qdrant_stats = get_qdrant_stats()
print('Qdrant stats:', qdrant_stats)

out = {
    "timestamp": datetime.utcnow().isoformat() + "Z",
    "chunking": chunk_result,
    "embedding": embed_result,
    "qdrant": qdrant_stats,
}

os.makedirs("./backend_reports", exist_ok=True)
out_path = "./backend_reports/embed_run_" + datetime.utcnow().strftime("%Y%m%d_%H%M%S") + ".json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

print(f"Saved report: {out_path}")
