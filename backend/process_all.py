import json
from datetime import datetime

from app.database import SessionLocal
from app.services.process_all import process_all_documents
from app.services.embedder import get_qdrant_stats


def main():
    db = SessionLocal()
    result = process_all_documents(db)
    stats = get_qdrant_stats()

    out = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "process_all": result,
        "qdrant": stats,
    }

    import os

    os.makedirs("./backend_reports", exist_ok=True)
    out_path = "./backend_reports/process_all_run_" + datetime.utcnow().strftime("%Y%m%d_%H%M%S") + ".json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"Saved report: {out_path}")
    print(out)


if __name__ == "__main__":
    main()

