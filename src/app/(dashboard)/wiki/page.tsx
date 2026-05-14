"use client";

import { useEffect, useState } from "react";
import { 
  Plus, Search, FileText, Edit2, Save, Trash2, 
  ChevronRight, BookOpen, Clock, Tag
} from "lucide-react";
import { toast } from "sonner";

interface WikiArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
}

export default function WikiPage() {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<WikiArticle>>({});

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/wiki");
      const data = await res.json();
      setArticles(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (error) {
      toast.error("Wiki yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const selectedArticle = articles.find(a => a.id === selectedId);

  const handleSave = async () => {
    if (!editData.title || !editData.content) {
      toast.error("Başlık ve içerik gereklidir");
      return;
    }

    try {
      const res = await fetch("/api/wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        toast.success("Kayıt başarılı");
        setIsEditing(false);
        fetchArticles();
      }
    } catch (error) {
      toast.error("Kaydedilemedi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu makaleyi silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch("/api/wiki", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        toast.success("Silindi");
        setSelectedId(null);
        fetchArticles();
      }
    } catch (error) {
      toast.error("Silinemedi");
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.content.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rd2-page">
      <div className="rd2-header-row">
        <div>
          <h1 className="rd2-h1">Bilgi Bankası</h1>
          <p className="rd2-muted">Sistem notları, prosedürler ve teknik dokümanlar.</p>
        </div>
        <button 
          className="rd2-btn rd2-btn-primary"
          onClick={() => {
            setEditData({ title: "", content: "", category: "Genel" });
            setIsEditing(true);
          }}
        >
          <Plus width={16} height={16} /> Yeni Makale
        </button>
      </div>

      <div className="wiki-container">
        {/* Sidebar */}
        <div className="wiki-sidebar">
          <div className="wiki-search">
            <Search width={16} height={16} />
            <input 
              type="text" 
              placeholder="Ara..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="wiki-list">
            {loading ? (
              <div className="wiki-loading">Yükleniyor...</div>
            ) : filteredArticles.map(article => (
              <div 
                key={article.id} 
                className={`wiki-item ${selectedId === article.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedId(article.id);
                  setIsEditing(false);
                }}
              >
                <div className="wiki-item-icon">
                  <FileText width={14} height={14} />
                </div>
                <div className="wiki-item-info">
                  <div className="wiki-item-title">{article.title}</div>
                  <div className="wiki-item-meta">{article.category}</div>
                </div>
                <ChevronRight className="wiki-item-chevron" width={14} height={14} />
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="wiki-main">
          {isEditing ? (
            <div className="wiki-editor">
              <div className="wiki-editor-header">
                <input 
                  type="text" 
                  placeholder="Makale Başlığı" 
                  value={editData.title}
                  onChange={e => setEditData({...editData, title: e.target.value})}
                  className="wiki-input-title"
                />
                <input 
                  type="text" 
                  placeholder="Kategori" 
                  value={editData.category}
                  onChange={e => setEditData({...editData, category: e.target.value})}
                  className="wiki-input-category"
                />
              </div>
              <textarea 
                placeholder="Markdown içeriği buraya yazın..."
                value={editData.content}
                onChange={e => setEditData({...editData, content: e.target.value})}
                className="wiki-textarea"
              />
              <div className="wiki-editor-footer">
                <button className="rd2-btn" onClick={() => setIsEditing(false)}>İptal</button>
                <button className="rd2-btn rd2-btn-primary" onClick={handleSave}>
                  <Save width={16} height={16} /> Kaydet
                </button>
              </div>
            </div>
          ) : selectedArticle ? (
            <div className="wiki-view">
              <div className="wiki-view-header">
                <div>
                  <div className="wiki-view-category">
                    <Tag width={12} height={12} /> {selectedArticle.category}
                  </div>
                  <h2 className="wiki-view-title">{selectedArticle.title}</h2>
                  <div className="wiki-view-meta">
                    <Clock width={12} height={12} /> Son Güncelleme: {new Date(selectedArticle.updatedAt).toLocaleString('tr-TR')}
                  </div>
                </div>
                <div className="wiki-view-actions">
                  <button 
                    className="wiki-action-btn"
                    onClick={() => {
                      setEditData(selectedArticle);
                      setIsEditing(true);
                    }}
                  >
                    <Edit2 width={16} height={16} /> Düzenle
                  </button>
                  <button 
                    className="wiki-action-btn wiki-action-delete"
                    onClick={() => handleDelete(selectedArticle.id)}
                  >
                    <Trash2 width={16} height={16} /> Sil
                  </button>
                </div>
              </div>
              <div className="wiki-content">
                {/* 
                  Note: In a production app, we would use react-markdown here.
                  For now, we use a simple pre-wrap div.
                */}
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedArticle.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="wiki-empty">
              <BookOpen width={48} height={48} />
              <p>Görüntülenecek makale seçin veya yeni bir tane oluşturun.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .wiki-container {
          display: flex;
          background: var(--card-bg);
          border: 1px solid var(--line);
          border-radius: 12px;
          height: calc(100vh - 200px);
          overflow: hidden;
          margin-top: 20px;
        }

        .wiki-sidebar {
          width: 300px;
          border-right: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          background: rgba(0,0,0,0.05);
        }

        .wiki-search {
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--line);
          background: var(--gray-bg);
        }

        .wiki-search input {
          background: transparent;
          border: none;
          color: var(--text);
          font-size: 13px;
          width: 100%;
          outline: none;
        }

        .wiki-list {
          flex: 1;
          overflow-y: auto;
        }

        .wiki-item {
          padding: 12px 15px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 1px solid var(--line);
        }

        .wiki-item:hover {
          background: rgba(255,255,255,0.05);
        }

        .wiki-item.active {
          background: #FFCC0020;
          border-left: 3px solid #FFCC00;
        }

        .wiki-item-icon {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          background: var(--line);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
        }

        .active .wiki-item-icon {
          background: #FFCC00;
          color: #0E1116;
        }

        .wiki-item-info {
          flex: 1;
        }

        .wiki-item-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }

        .wiki-item-meta {
          font-size: 11px;
          color: var(--muted);
          margin-top: 2px;
        }

        .wiki-item-chevron {
          color: var(--muted);
          opacity: 0.5;
        }

        .wiki-main {
          flex: 1;
          background: var(--card-bg);
          overflow-y: auto;
        }

        .wiki-view {
          padding: 40px;
        }

        .wiki-view-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--line);
        }

        .wiki-view-category {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #FFCC00;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 8px;
        }

        .wiki-view-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--text);
          margin: 0;
        }

        .wiki-view-meta {
          font-size: 12px;
          color: var(--muted);
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .wiki-view-actions {
          display: flex;
          gap: 10px;
        }

        .wiki-action-btn {
          background: var(--gray-bg);
          border: 1px solid var(--line);
          color: var(--text);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .wiki-action-btn:hover {
          background: var(--line);
        }

        .wiki-action-delete:hover {
          background: #DC2626;
          color: white;
          border-color: #DC2626;
        }

        .wiki-content {
          font-size: 15px;
          line-height: 1.6;
          color: var(--text-light);
        }

        .wiki-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--muted);
          gap: 15px;
        }

        .wiki-editor {
          padding: 30px;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .wiki-editor-header {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }

        .wiki-input-title {
          flex: 1;
          background: var(--gray-bg);
          border: 1px solid var(--line);
          padding: 12px 15px;
          border-radius: 8px;
          color: var(--text);
          font-size: 18px;
          font-weight: 700;
          outline: none;
        }

        .wiki-input-category {
          width: 150px;
          background: var(--gray-bg);
          border: 1px solid var(--line);
          padding: 12px 15px;
          border-radius: 8px;
          color: var(--text);
          font-size: 14px;
          outline: none;
        }

        .wiki-textarea {
          flex: 1;
          background: var(--gray-bg);
          border: 1px solid var(--line);
          padding: 20px;
          border-radius: 8px;
          color: var(--text);
          font-size: 14px;
          font-family: 'JetBrains Mono', monospace;
          resize: none;
          outline: none;
          margin-bottom: 20px;
        }

        .wiki-editor-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
      `}</style>
    </div>
  );
}
