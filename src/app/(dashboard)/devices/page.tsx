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
      <aside className="rd2-filter-sidebar min-h-[400px]">
        <div className="rd2-filter-head">
          <span>Filtreler</span>
          {(search || filter !== "all") && (
            <button className="rd2-clear-btn" onClick={() => { setSearch(""); setFilter("all"); }}>Temizle</button>
          )}
        </div>

        {/* Search */}
        <div className="rd2-filter-section">
          <div className="rd2-search w-full">
            <Search className="w-4 h-4" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Cihaz veya ID..." 
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
                className={`rd2-fpill ${filter === k ? "on" : ""}`}
                style={filter === k ? { background: "var(--primary)", color: "var(--primary-foreground)" } : {}}
              >
                {k === "online" && <span className="rd2-dot rd2-dot-green" />}
                {k === "offline" && <span className="rd2-dot rd2-dot-gray" />}
                {k === "all" ? "Tümü" : k.charAt(0).toUpperCase() + k.slice(1)}
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
        <div className="rd2-toolbar">
          <div className="text-[13px] font-semibold text-muted-foreground">
            <b className="text-foreground">{filteredDevices.length}</b> / {devices.length} cihaz listeleniyor
          </div>
          <div className="flex-1" />
          <div className="rd2-view-toggle">
            <button 
              className={`rd2-icon-btn rd2-icon-btn-sm ${viewMode === "list" ? "on" : ""}`}
              onClick={() => setViewMode("list")}
              style={viewMode === "list" ? { background: "var(--primary)", color: "var(--primary-foreground)" } : {}}
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button 
              className={`rd2-icon-btn rd2-icon-btn-sm ${viewMode === "grouped" ? "on" : ""}`}
              onClick={() => setViewMode("grouped")}
              style={viewMode === "grouped" ? { background: "var(--primary)", color: "var(--primary-foreground)" } : {}}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Devices List */}
        <section className="rd2-card p-0 overflow-hidden">
          {viewMode === "list" ? (
            <table className="rd2-table">
              <thead>
                <tr>
                  <th>Durum</th>
                  <th>Cihaz</th>
                  <th>Kullanıcı</th>
                  <th>Grup</th>
                  <th className="text-right">İşlem</th>
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
            <div className="flex flex-col">
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
    <tr className="rd2-tr-hover transition-colors group">
      <td>
        <span className={`rd2-pill ${d.status === "online" ? "rd2-pill-on" : "rd2-pill-off"}`}>
          <span className={`rd2-dot ${d.status === "online" ? "rd2-dot-green animate-brand-pulse" : "rd2-dot-gray"}`} />
          {d.status === "online" ? "Online" : "Offline"}
        </span>
      </td>
      <td>
        <div className="rd2-device-cell">
          <div className={`rd2-device-icon bg-secondary text-muted-foreground group-hover:text-foreground transition-colors ${d.status === "online" ? "!bg-brand-yellow/20 !text-brand-ink" : ""}`}>
            {d.os.includes("Windows") ? <Monitor className="w-4 h-4" /> : d.os.includes("mac") ? <Laptop className="w-4 h-4" /> : d.os.includes("Android") ? <Smartphone className="w-4 h-4" /> : <Server className="w-4 h-4" />}
          </div>
          <div>
            <Link href={`/devices/${d.id}`} className="hover:opacity-80 transition-opacity">
              <div className="rd2-device-name">ID: {d.id}</div>
              <div className="rd2-device-meta font-mono">{d.name} · {d.os}</div>
            </Link>
          </div>
        </div>
      </td>
      <td className="text-[13px] font-medium text-muted-foreground">{d.user}</td>
      <td>
        <span className="rd2-chip">{d.group}</span>
      </td>
      <td className="text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            disabled={d.status !== "online"}
            className={`rd2-btn rd2-btn-sm ${d.status === "online" ? "bg-brand-yellow text-brand-ink border-brand-ink/10" : "bg-gray-bg text-muted2"}`}
            onClick={() => onConnect(d.id)}
          >
            <Play className="w-3 h-3 fill-current" /> Bağlan
          </button>
          <Link href={`/devices/${d.id}`}>
            <button className="rd2-icon-btn rd2-icon-btn-sm">
              <Info className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </td>
    </tr>
  );
}
