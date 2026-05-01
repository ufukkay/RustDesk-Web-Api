import sqlite3
import json
import os

db_path = "/home/rd/rustdesk/db_v2.sqlite3"

def discover():
    if not os.path.exists(db_path):
        print(json.dumps({"ok": False, "error": "DB not found"}))
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Tüm tabloları listele
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    
    results = {"ok": True, "tables": tables, "samples": {}}
    
    # Her tablodan 1 örnek alalım (Gizli bilgi var mı bakalım)
    for table in tables:
        try:
            cursor.execute(f"SELECT * FROM {table} LIMIT 1")
            results["samples"][table] = cursor.fetchone()
        except: pass
        
    print(json.dumps(results))
    conn.close()

if __name__ == "__main__":
    discover()
