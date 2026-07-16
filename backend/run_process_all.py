"""
Run full pipeline (extract + chunk + embed) on all stored documents.
Works regardless of current status (pending, failed, extracted, etc.)
"""

import os
from pathlib import Path

# Add backend dir to path for imports
os.chdir(Path(__file__).parent)
import sys
sys.path.insert(0, str(Path(__file__).parent))

from datetime import datetime
from app.database import SessionLocal
from app.services.process_all import process_all_documents

db = SessionLocal()

print("Starting full pipeline: extract + chunk + embed...")
print(f"Working directory: {os.getcwd()}")

result = process_all_documents(db)

print("\n=== Results ===")
print(f"Total documents: {result['total']}")
print(f"Extracted: {result['extracted']}")
print(f"Chunked: {result['chunked']}")
print(f"Embedded: {result['embedded']}")
print(f"Failed: {result['failed']}")
print(f"Skipped: {result.get('skipped', 0)}")

if result['errors']:
    print("\nErrors:")
    for doc_id, error in result['errors'].items():
        print(f"  Doc {doc_id}: {error}")

db.close()
print("\nDone!")