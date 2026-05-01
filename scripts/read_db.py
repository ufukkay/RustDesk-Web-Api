import sqlite3
import json
import sys
import os

DB_PATH = "/home/rd/rustdesk/db_v2.sqlite3"

def debug_log(msg):
    print(f"DEBUG: {msg}", file=sys.stderr)

# Binary (bytes) verileri JSON'a çevrilebilir hale getiren yardımcı fonksiyon
def bytes_handler(obj):
    if isinstance(obj, bytes):
        return obj.hex() # Binary veriyi hex formatında metne çevir
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
        c.execute("SELECT * FROM peer LIMIT 1000")
        for r in c.fetchall():
            # Her satırdaki bytes verileri metne çeviriyoruz
            row_dict = {}
            for key in r.keys():
                val = r[key]
                if isinstance(val, bytes):
                    row_dict[key] = val.hex()
                else:
                    row_dict[key] = val
            data.append(row_dict)
        
        debug_log(f"{len(data)} cihaz verisi başarıyla işlendi.")

    # default=str parametresi ile kalan her şeyi stringe çeviriyoruz (garanti olsun)
    print(json.dumps({'ok': True, 'tables': tables, 'data': data}, default=str))

    conn.close()
except Exception as e:
    debug_log(f"Hata: {str(e)}")
    print(json.dumps({'ok': False, 'error': str(e), 'tables': [], 'data': []}))
