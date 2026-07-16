from app.services.embedder import _get_qdrant
from app.config.settings import get_settings
from app.database import SessionLocal
from app.models import Chunk

client = _get_qdrant()
settings = get_settings()
db = SessionLocal()

points, _ = client.scroll(
    collection_name=settings.qdrant_collection_name,
    limit=500,
    with_payload=True,
)

stale_ids = []
valid_ids = []

for p in points:
    if not p.payload:
        continue
    doc_id = p.payload.get("document_id")
    chunk_id = p.payload.get("chunk_id")
    
    if doc_id and chunk_id:
        # Check if this chunk exists in DB
        chunk = db.query(Chunk).filter(Chunk.id == chunk_id, Chunk.document_id == doc_id).first()
        if not chunk:
            stale_ids.append(p.id)
            print(f"STALE: {p.id} | {p.payload.get('filename')} | doc_id={doc_id} chunk_id={chunk_id}")
        else:
            valid_ids.append(p.id)

print(f"\nStale points: {len(stale_ids)}")
print(f"Valid points: {len(valid_ids)}")

if stale_ids:
    client.delete(
        collection_name=settings.qdrant_collection_name,
        points_selector=stale_ids,
    )
    print("Deleted stale points from Qdrant")

db.close()
