import sqlite3
import json
import sys
import os

DB_PATH = "/home/rd/rustdesk/db_v2.sqlite3"

def debug_log(msg):
    print(f"DEBUG: {msg}", file=sys.stderr)

def bytes_handler(obj):
    if isinstance(obj, bytes):
        return obj.hex()
    return str(obj)

try:
    if not os.path.exists(DB_PATH):
        print(json.dumps({'ok': False, 'error': 'DB bulunamadı', 'tables': [], 'data': []}))
        sys.exit(0)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in c.fetchall()]

    data = []
    if 'peer' in tables:
        c.execute("SELECT * FROM peer LIMIT 500")
        rows = c.fetchall()
        
        if len(rows) > 0:
            # DEBUG İÇİN TÜM KOLONLARI VE ÖRNEK VERİYİ BAS
            first_row = dict(rows[0])
            debug_log(f"MEVCUT KOLONLAR: {list(first_row.keys())}")
            debug_log(f"ÖRNEK VERİ: {json.dumps(first_row, default=bytes_handler)}")
            if 'info' in first_row:
                debug_log(f"INFO İÇERİĞİ: {first_row['info']}")

        for r in rows:
            row_dict = {}
            for key in r.keys():
                val = r[key]
                if isinstance(val, bytes):
                    row_dict[key] = val.hex()
                else:
                    row_dict[key] = val
            data.append(row_dict)

    print(json.dumps({'ok': True, 'tables': tables, 'data': data}, default=str))
    conn.close()
except Exception as e:
    debug_log(f"Hata: {str(e)}")
    print(json.dumps({'ok': False, 'error': str(e), 'tables': [], 'data': []}))
