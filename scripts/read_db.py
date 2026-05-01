import sqlite3
import json
import sys

DB_PATH = "/home/rd/rustdesk/db_v2.sqlite3"

try:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in c.fetchall()]

    if 'peer' in tables:
        c.execute("SELECT * FROM peer LIMIT 200")
        rows = [dict(r) for r in c.fetchall()]
        print(json.dumps({'ok': True, 'tables': tables, 'data': rows}))
    else:
        print(json.dumps({'ok': False, 'tables': tables, 'data': []}))

    conn.close()
except Exception as e:
    print(json.dumps({'ok': False, 'error': str(e), 'tables': [], 'data': []}))
