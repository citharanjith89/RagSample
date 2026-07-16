content = open('app/routes/search_v1.py', 'r', encoding='utf-8').read()

old = '''        # Enrich results with drive_url from Document table
        for result in merged_results:
            doc_id = result.get("document_id")
            if doc_id:
                doc = db.query(Document).filter(Document.id == doc_id).first()
                if doc and doc.drive_file_id:
                    result["drive_file_id"] = doc.drive_file_id
                    result["drive_url"] = f"https://drive.google.com/file/d/{doc.drive_file_id}/view"'''

new = '''        # Enrich results with drive_url from Document table
        for result in merged_results:
            doc_id = result.get("document_id")
            filename = result.get("filename")
            doc = None
            if doc_id:
                doc = db.query(Document).filter(Document.id == doc_id).first()
            if not doc and filename:
                doc = db.query(Document).filter(Document.original_filename == filename).first()
            if doc and doc.drive_file_id:
                result["drive_file_id"] = doc.drive_file_id
                result["drive_url"] = f"https://drive.google.com/file/d/{doc.drive_file_id}/view"'''

if old in content:
    content = content.replace(old, new)
    open('app/routes/search_v1.py', 'w', encoding='utf-8').write(content)
    print('Done')
else:
    print('FAILED')
