content = open('app/routes/search_v1.py', 'r', encoding='utf-8').read()

old = '''        # Enrich results with drive_url from Document table
        for result in merged_results:'''

new = '''        # Enrich results with full chunk text and drive_url from DB
        for result in merged_results:
            chunk_id = result.get("chunk_id")
            if chunk_id:
                chunk = db.query(Chunk).filter(Chunk.id == chunk_id).first()
                if chunk and chunk.text:
                    result["text"] = chunk.text
                    result["text_preview"] = chunk.text[:200]
'''

new += '''        # Enrich results with drive_url from Document table
        for result in merged_results:'''

if old in content:
    content = content.replace(old, new)
    open('app/routes/search_v1.py', 'w', encoding='utf-8').write(content)
    print('Done')
else:
    print('FAILED')
    idx = content.find('Enrich results with drive_url')
    print('Found at:', idx)
