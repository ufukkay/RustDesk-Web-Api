import sqlite3
import json
import sys
import os

DB_PATH = "/home/rd/rustdesk/db_v2.sqlite3"

def debug_log(msg):
    print(f"DEBUG: {msg}", file=sys.stderr)

try:
    if not os.path.exists(DB_PATH):
        debug_log(f"Hata: Veritabanı dosyası bulunamadı: {DB_PATH}")
        print(json.dumps({'ok': False, 'error': 'DB bulunamadı', 'tables': [], 'data': []}))
        sys.exit(0)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Mevcut tabloları bul
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in c.fetchall()]
    debug_log(f"Bulunan Tablolar: {tables}")

    data = []
    # RustDesk OSS'de cihazlar 'peer' tablosunda tutulur
    if 'peer' in tables:
        # Sütun isimlerini de debug için alalım
        c.execute("PRAGMA table_info(peer)")
        columns = [r[1] for r in c.fetchall()]
        debug_log(f"Peer Tablosu Sütunları: {columns}")

        c.execute("SELECT * FROM peer LIMIT 500")
        data = [dict(r) for r in c.fetchall()]
        debug_log(f"{len(data)} cihaz verisi çekildi.")
    else:
        debug_log("Hata: 'peer' tablosu veritabanında yok!")

    print(json.dumps({
        'ok': True, 
        'tables': tables, 
        'data': data
    }))

    conn.close()
except Exception as e:
    debug_log(f"Sistemsel Hata: {str(e)}")
    print(json.dumps({'ok': False, 'error': str(e), 'tables': [], 'data': []}))
