from app.database import SessionLocal
from app.models import Document, DocumentStatus
from app.services.embedder import embed_document
db = SessionLocal()
doc = db.query(Document).filter(Document.status == DocumentStatus.chunked).first()
if not doc:
    print('No chunked docs found')
else:
    print(f'Testing embed on: {doc.original_filename}')
    result = embed_document(doc, db)
    print(f'Result: {result}')