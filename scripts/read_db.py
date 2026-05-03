import sqlite3
import json
import sys
import os

# RustDesk veritabanı yolu (Linux/Ubuntu varsayılan)
DB_PATH = "/home/rd/rustdesk/db_v2.sqlite3"

def debug_log(msg):
    """Hata ayıklama loglarını standart hata akışına basar (JSON çıktısını bozmamak için)"""
    print(f"DEBUG: {msg}", file=sys.stderr)

def bytes_handler(obj):
    """SQLite'dan gelen byte verilerini JSON için hex formatına çevirir"""
    if isinstance(obj, bytes):
        return obj.hex()
    return str(obj)

try:
    # 1. Veritabanı dosyasının varlığını kontrol et
    if not os.path.exists(DB_PATH):
        print(json.dumps({'ok': False, 'error': 'Veritabanı dosyası bulunamadı', 'tables': [], 'data': []}))
        sys.exit(0)

    # 2. SQLite bağlantısını kur
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row # Satırlara kolon adıyla erişebilmek için
    c = conn.cursor()

    # 3. Mevcut tabloları listele
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in c.fetchall()]

    data = []
    # 4. 'peer' tablosu (cihazların listelendiği tablo) varsa verileri çek
    if 'peer' in tables:
        c.execute("SELECT * FROM peer LIMIT 500")
        rows = c.fetchall()
        
        # Geliştirme aşamasında kolon yapısını görmek için debug logları
        if len(rows) > 0:
            first_row = dict(rows[0])
            debug_log(f"MEVCUT KOLONLAR: {list(first_row.keys())}")
            debug_log(f"ÖRNEK VERİ: {json.dumps(first_row, default=bytes_handler)}")
            if 'info' in first_row:
                debug_log(f"INFO İÇERİĞİ: {first_row['info']}")

        # 5. Verileri sözlük yapısına çevir ve byte verilerini temizle
        for r in rows:
            row_dict = {}
            for key in r.keys():
                val = r[key]
                if isinstance(val, bytes):
                    row_dict[key] = val.hex()
                else:
                    row_dict[key] = val
            data.append(row_dict)

    # 6. Sonucu JSON olarak standart çıktıya bas (Next.js bunu okur)
    print(json.dumps({'ok': True, 'tables': tables, 'data': data}, default=str))
    conn.close()
except Exception as e:
    debug_log(f"Hata oluştu: {str(e)}")
    print(json.dumps({'ok': False, 'error': str(e), 'tables': [], 'data': []}))
