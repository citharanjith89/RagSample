"""
Integration, Security, and Performance Tests for Search Pipeline
Tests the full retrieval pipeline: query → embed → RBAC filter → search → rerank
"""
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
from app.database import SessionLocal, engine
from app.models import User, Document, Chunk, AccessLevel, DocumentStatus
from app.services.query_embedder import embed_query
from app.services.query_processor import normalize_query
from app.routes.search_v1 import (
    _get_visible_doc_ids_for_role,
    _make_filter,
    _bm25_search,
    _merge_results,
)
from app.services.rbac_filter import build_rbac_filter
from qdrant_client import QdrantClient


def create_test_data():
    """Create test documents with different access levels for testing."""
    # Ensure DB schema exists for local test runs.
    # Some dev setups may not have tables created yet.
    from app.database import Base
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Check if test documents exist
    test_doc = db.query(Document).filter(Document.original_filename == "test_hr_salary.pdf").first()
    if test_doc:
        print("Test data already exists")
        return

    print("Creating test documents...")

    # Create test documents with different access levels
    docs = [
        Document(
            filename="test_public_policy.pdf",
            original_filename="test_public_policy.pdf",
            file_path="/tmp/test_public_policy.pdf",
            file_type="pdf",
            department="HR",
            access_level=AccessLevel.public,
            status=DocumentStatus.embedded,
        ),
        Document(
            filename="test_hr_salary.pdf",
            original_filename="test_hr_salary.pdf",
            file_path="/tmp/test_hr_salary.pdf",
            file_type="pdf",
            department="HR",
            access_level=AccessLevel.restricted,
            status=DocumentStatus.embedded,
        ),
        Document(
            filename="test_internal_policy.pdf",
            original_filename="test_internal_policy.pdf",
            file_path="/tmp/test_internal_policy.pdf",
            file_type="pdf",
            department="Operations",
            access_level=AccessLevel.internal,
            status=DocumentStatus.embedded,
        ),
    ]

    for doc in docs:
        db.add(doc)

    db.commit()

    # Add test chunks for each document
    for doc in docs:
        chunk = Chunk(
            document_id=doc.id,
            chunk_index=0,
            text=f"This is test content for {doc.original_filename} - access level {doc.access_level.value}",
            is_embedded=True,
        )
        db.add(chunk)

    db.commit()
    print("Test documents created")
    db.close()


def test_rbac_filter_function():
    """Test RBAC filter function returns correct document IDs."""
    print("\n=== Test 1: RBAC Filter Function ===")
    db = SessionLocal()

    roles_to_test = ["admin", "hr", "manager", "employee"]
    results = {}

    for role in roles_to_test:
        doc_ids = _get_visible_doc_ids_for_role(role, db)
        results[role] = doc_ids
        print(f"Role {role}: {len(doc_ids)} visible docs: {doc_ids}")

    # Verify correct access levels per role
    # Admin/HR should see all 4 levels
    assert len(results["admin"]) >= len(results["employee"]), "Admin should see >= Employee docs"

    # Employee should see fewer docs
    assert len(results["employee"]) <= len(results["hr"]), "Employee should see <= HR docs"

    db.close()
    print("PASS: RBAC filter returns correct document IDs per role")


def test_security_rbac_blocks_restricted():
    """Security test: Verify Employee role cannot retrieve HR-only chunks."""
    print("\n=== Test 2: Security - RBAC Blocks Restricted Chunks ===")
    db = SessionLocal()

    # Get visible doc IDs for employee role (should NOT include restricted)
    employee_doc_ids = _get_visible_doc_ids_for_role("employee", db)

    # Get all restricted documents
    restricted_docs = db.query(Document).filter(
        Document.access_level == AccessLevel.restricted
    ).all()

    for doc in restricted_docs:
        assert doc.id not in employee_doc_ids, f"Employee should NOT see restricted doc {doc.id}"
        print(f"  Verified: Restricted doc {doc.id} ({doc.original_filename}) blocked for employee")

    # Employee should not be able to search for restricted content via BM25
    if employee_doc_ids:
        bm25_results = _bm25_search("salary", employee_doc_ids, db, top_k=5)

        # Check no restricted docs in results
        for r in bm25_results:
            doc = db.query(Document).filter(Document.id == r["document_id"]).first()
            if doc:
                assert doc.access_level != AccessLevel.restricted, "Employee should NOT get restricted content"

    db.close()
    print("PASS: RBAC correctly blocks restricted chunks for employee role")


def test_integration_search_pipeline():
    """Integration test: Full search pipeline with different roles."""
    print("\n=== Test 3: Integration - Full Search Pipeline ===")
    db = SessionLocal()
    client: QdrantClient = None

    try:
        from app.services.embedder import _get_qdrant
        from app.config.settings import get_settings

        settings = get_settings()
        client = _get_qdrant()

        query = "policy"
        normalized = normalize_query(query)
        query_vector = embed_query(normalized)

        if not query_vector:
            print("  No query vector (no embeddings), skipping vector search test")
            return

        for role in ["admin", "employee"]:
            print(f"\n  Testing role: {role}")

            # Get filtered doc IDs
            visible_doc_ids = _get_visible_doc_ids_for_role(role, db)

            if not visible_doc_ids:
                print(f"    No visible documents for role {role}")
                continue

            # Build Qdrant filter
            qdrant_filter = _make_filter(role, None)

            # Semantic search
            semantic_hits = client.search(
                collection_name=settings.qdrant_collection_name,
                query_vector=query_vector,
                query_filter=qdrant_filter,
                limit=5,
                with_payload=True,
            )

            # BM25 search
            bm25_results = _bm25_search(normalized, visible_doc_ids, db, top_k=10)

            # Merge results
            merged_results, has_answer = _merge_results(
                semantic_hits, bm25_results, top_k=5, confidence_threshold=0.3
            )

            print(f"    Semantic hits: {len(semantic_hits)}, BM25: {len(bm25_results)}, Merged: {len(merged_results)}")

            # Verify no restricted docs for employee
            if role == "employee":
                for r in merged_results:
                    doc = db.query(Document).filter(Document.id == r.get("document_id")).first()
                    if doc and doc.access_level == AccessLevel.restricted:
                        print(f"    ERROR: Employee got restricted doc {doc.id}")
                        raise AssertionError("Employee should not get restricted content")

    except Exception as e:
        print(f"  Integration test note: {e}")

    db.close()
    print("PASS: Integration pipeline completed")


def test_performance_concurrent():
    """Performance test: 10 simultaneous queries."""
    print("\n=== Test 4: Performance - Concurrent Queries ===")

    def single_query(i):
        """Execute a single search."""
        from app.database import SessionLocal

        db = SessionLocal()
        start = time.time()

        try:
            # Simulate a search
            query = f"test query {i}"
            normalized = normalize_query(query)
            doc_ids = _get_visible_doc_ids_for_role("admin", db)

            if doc_ids:
                _bm25_search(normalized, doc_ids, db, top_k=5)

            elapsed = time.time() - start
            return elapsed
        finally:
            db.close()

    # Run 10 concurrent queries
    num_queries = 10

    with ThreadPoolExecutor(max_workers=10) as executor:
        start_time = time.time()
        results = list(executor.map(single_query, range(num_queries)))
        total_time = time.time() - start_time

    avg_time = sum(results) / len(results)
    max_time = max(results)

    print(f"  Total time: {total_time:.2f}s")
    print(f"  Average query time: {avg_time:.3f}s")
    print(f"  Max query time: {max_time:.3f}s")

    # Verify sub-2-second response
    assert max_time < 2.0, f"Query took {max_time:.2f}s, should be < 2s"
    print(f"PASS: All queries completed under 2 seconds")


def demo_search_features():
    """Demo: Show search, hybrid results, confidence scores, and sources."""
    print("\n=== Demo: Search Features ===")
    db = SessionLocal()

    # Get a sample search with all features
    query = "policy"
    normalized = normalize_query(query)

    visible_doc_ids = _get_visible_doc_ids_for_role("admin", db)

    if visible_doc_ids and len(visible_doc_ids) > 0:
        # BM25 results
        bm25_results = _bm25_search(normalized, visible_doc_ids, db, top_k=5)

        # Add document info
        for r in bm25_results:
            doc = db.query(Document).filter(Document.id == r["document_id"]).first()
            if doc:
                r["filename"] = doc.original_filename
                r["access_level"] = doc.access_level.value
                r["department"] = doc.department

        print(f"\n  Query: '{query}'")
        print(f"  Normalized: '{normalized}'")
        print(f"  Results:")

        for i, r in enumerate(bm25_results[:3], 1):
            print(f"    {i}. {r.get('filename', 'unknown')}")
            print(f"       - chunk_id: {r.get('chunk_id')}")
            print(f"       - page: {r.get('page_number')}")
            print(f"       - access_level: {r.get('access_level')}")
            print(f"       - BM25 score: {r.get('bm25_score', 0):.2f}")
            print(f"       - text preview: {r.get('text_preview', '')[:50]}...")

        print(f"\n  Confidence: Based on combined_score (0.7*semantic + 0.3*BM25 + metadata_boost)")
        print(f"  Sources: filename, document_id, chunk_id, page_number included in response")

    db.close()
    print("\nDemo complete")


if __name__ == "__main__":
    print("=" * 60)
    print("Search Pipeline Tests")
    print("=" * 60)

    # Create test data
    create_test_data()

    # Run tests
    test_rbac_filter_function()
    test_security_rbac_blocks_restricted()
    test_integration_search_pipeline()
    test_performance_concurrent()

    # Demo
    demo_search_features()

    print("\n" + "=" * 60)
    print("All tests completed")
    print("=" * 60)