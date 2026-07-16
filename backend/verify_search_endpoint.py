from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.database import SessionLocal
import app.routes.search_v1 as search_mod

class DummyUser:
    def __init__(self):
        self.role = 'admin'

class FakePoint:
    def __init__(self, id, score, payload):
        self.id = id
        self.score = score
        self.payload = payload

class FakeResponse:
    def __init__(self, points):
        self.points = points

class FakeClient:
    def query_points(self, collection_name, query, query_filter, limit, with_payload):
        return FakeResponse([
            FakePoint(
                id='point1',
                score=0.9,
                payload={
                    'chunk_id': 1,
                    'document_id': 1,
                    'chunk_index': 0,
                    'page_number': 1,
                    'text_preview': 'Test preview',
                    'department': 'HR',
                    'access_level': 'public',
                    'filename': 'test.pdf',
                },
            )
        ])

app = FastAPI()
app.include_router(search_mod.router)

app.dependency_overrides[search_mod.get_current_user] = lambda: DummyUser()

def get_test_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[search_mod.get_db] = get_test_db
search_mod._get_qdrant = lambda: FakeClient()
search_mod.embed_query = lambda q: [0.1] * 384

client = TestClient(app)
response = client.post('/api/search', json={'query': 'policy', 'limit': 5})
print(response.status_code)
print(response.json())
