from app.services.embedder import _get_qdrant
from app.config.settings import get_settings
settings = get_settings()
client = _get_qdrant()
client.delete_collection(settings.qdrant_collection_name)
print('Collection deleted')