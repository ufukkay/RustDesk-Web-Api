"use client";

import { useAppStore, Device } from "@/lib/store";
import { Search, Monitor, Laptop, Server, Play, MoreHorizontal, Plus, Filter, Smartphone, Trash2, LayoutGrid, List as ListIcon, ChevronRight, Edit2, Info, Cpu, HardDrive, Database, Activity, Network } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type StatusFilter = "all" | "online" | "offline";
type ViewMode = "list" | "grouped";

export default function DevicesPage() {
  const { devices, deleteDevice, fetchDevices } = useAppStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleConnect = (id: string) => {
    const cleanId = String(id).replace(/\s+/g, "");
    if (!cleanId) return;

    // RustDesk resmi protokolü (Zero-Config)
    const host = "192.168.0.184";
    const key = "5XE+DKQ46fl1EgSLWqKV9qkV+nGT4VLBrhJKYUrFbD0=";
    const password = "Ban41kam5";
    const url = `rustdesk://${cleanId}?password=${password}&host=${host}&key=${encodeURIComponent(key)}`;
    
    window.open(url, "_self");
  };

  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.id.includes(search);
      const matchesFilter = filter === "all" || d.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [devices, search, filter]);

  const groupedDevices = useMemo(() => {
    const groups: Record<string, Device[]> = {};
    filteredDevices.forEach(d => {
      const groupName = d.group || "Genel";
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(d);
    });
    return groups;
  }, [filteredDevices]);

  return (
    <div className="rd2-devices-layout">
      {/* Filter Sidebar */}
      <aside className="rd2-filter-sidebar">
        <div className="rd2-filter-head">
          <span>Filtreler</span>
          {(search || filter !== "all") && (
            <button className="rd2-clear-btn" onClick={() => { setSearch(""); setFilter("all"); }}>Temizle</button>
          )}
        </div>

        {/* Search */}
        <div className="rd2-filter-section">
          <div className="rd2-search" style={{ width: "100%" }}>
            <Search width="14" height="14" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Ara..." 
            />
          </div>
        </div>

        {/* Status */}
        <div className="rd2-filter-section">
          <div className="rd2-filter-label">Durum</div>
          <div className="rd2-filter-pills">
            {(["all", "online", "offline"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rd2-fpill${filter === k ? " on" : ""}`}
                style={filter === k ? { background: "#FFCC00", color: "#0E1116", borderColor: "transparent" } : {}}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {k === "online" && <span className="rd2-dot rd2-dot-green" />}
                  {k === "offline" && <span className="rd2-dot rd2-dot-gray" />}
                  <span>{k === "all" ? "Tümü" : k.charAt(0).toUpperCase() + k.slice(1)}</span>
                </div>
                <span className="rd2-fpill-count">
                  {k === "all" ? devices.length : devices.filter(d => d.status === k).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="rd2-devices-content">
        {/* Toolbar */}
        <div className="rd2-toolbar" style={{ flexWrap: "nowrap" }}>
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
            <b style={{ color: "var(--text)" }}>{filteredDevices.length}</b> / {devices.length} cihaz
          </div>
          <div style={{ flex: 1 }} />
          <div className="rd2-view-toggle">
            <button 
              className={`rd2-icon-btn${viewMode === "list" ? " on" : ""}`}
              style={viewMode === "list" ? { background: "#FFCC00", color: "#0E1116", borderColor: "transparent" } : {}}
              onClick={() => setViewMode("list")}
              title="Liste"
            >
              <ListIcon width="15" height="15" />
            </button>
            <button 
              className={`rd2-icon-btn${viewMode === "grouped" ? " on" : ""}`}
              style={viewMode === "grouped" ? { background: "#FFCC00", color: "#0E1116", borderColor: "transparent" } : {}}
              onClick={() => setViewMode("grouped")}
              title="Gruplu"
            >
              <LayoutGrid width="15" height="15" />
            </button>
          </div>
        </div>

        {/* Devices List */}
        <section className="rd2-card rd2-card-flush">
          {viewMode === "list" ? (
            <table className="rd2-table">
              <thead>
                <tr>
                  <th>Durum</th>
                  <th>Cihaz</th>
                  <th>Kullanıcı</th>
                  <th>Grup</th>
                  <th className="rd2-tr">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map(d => (
                  <DeviceRow key={d.id} d={d} onConnect={handleConnect} />
                ))}
                {filteredDevices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="rd2-empty">Eşleşen cihaz bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(groupedDevices).map(([group, groupDevices]) => (
                <div key={group}>
                  <div className="rd2-grp-header">
                    <span className="rd2-grp-name">{group}</span>
                    <span className="rd2-grp-count">{groupDevices.length}</span>
                  </div>
                  <table className="rd2-table">
                    <tbody>
                      {groupDevices.map(d => (
                        <DeviceRow key={d.id} d={d} onConnect={handleConnect} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DeviceRow({ d, onConnect }: { d: Device, onConnect: (id: string) => void }) {
  return (
    <tr className="rd2-tr-hover">
      <td>
        <span className={`rd2-pill ${d.status === "online" ? "rd2-pill-on" : "rd2-pill-off"}`}>
          <span className={`rd2-dot ${d.status === "online" ? "rd2-dot-green animate-brand-pulse" : "rd2-dot-gray"}`} />
          {d.status === "online" ? "Online" : "Offline"}
        </span>
      </td>
      <td>
        <div className="rd2-device-cell">
          <div className="rd2-device-icon" style={{ background: d.status === "online" ? "#FFCC0033" : "#F1F2F4", color: "#0E1116" }}>
            {d.os.includes("Windows") ? <Monitor width="16" height="16" /> : d.os.includes("mac") ? <Laptop width="16" height="16" /> : d.os.includes("Android") ? <Smartphone width="16" height="16" /> : <Server width="16" height="16" />}
          </div>
          <div>
            <Link href={`/devices/${d.id}`}>
              <div className="rd2-device-name">ID: {d.id}</div>
              <div className="rd2-device-meta rd2-mono">{d.name} · {d.os}</div>
            </Link>
          </div>
        </div>
      </td>
      <td className="rd2-cell-muted">{d.user}</td>
      <td>
        <span className="rd2-chip">{d.group}</span>
      </td>
      <td className="rd2-tr">
        <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <button
            disabled={d.status !== "online"}
            className="rd2-btn rd2-btn-sm"
            style={d.status === "online" ? { background: "#FFCC00", color: "#0E1116", border: `1px solid #0E111614` } : { background: "#F1F2F4", color: "#8B92A0" }}
            onClick={() => onConnect(d.id)}
          >
            <Play width="11" height="11" /> Bağlan
          </button>
          <Link href={`/devices/${d.id}`}>
            <button className="rd2-icon-btn rd2-icon-btn-sm">
              <Info width="14" height="14" />
            </button>
          </Link>
        </div>
      </td>
    </tr>
  );
}
