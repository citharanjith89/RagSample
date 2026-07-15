content = open('backend/app/main.py', 'r', encoding='utf-8').read()
old = 'allow_origins=["http://localhost:5173", "http://localhost:3000", "https://*.onrender.com"],'
new = 'allow_origins=["http://localhost:5173", "http://localhost:3000", "https://*.onrender.com", "https://enterprise-rag-frontend-ez1k.onrender.com"],'
content = content.replace(old, new)
open('backend/app/main.py', 'w', encoding='utf-8').write(content)
print('Done')
