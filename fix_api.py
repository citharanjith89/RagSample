content = open('frontend/src/services/api.ts', 'r', encoding='utf-8').read()
old = "baseURL: import.meta.env.VITE_API_URL ? ${import.meta.env.VITE_API_URL}/api : '/api',"
new = "baseURL: import.meta.env.VITE_API_URL || '/api',"
content = content.replace(old, new)
open('frontend/src/services/api.ts', 'w', encoding='utf-8').write(content)
print('Done')
