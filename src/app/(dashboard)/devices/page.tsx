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
    <div className="flex flex-col lg:flex-row gap-6 rd2-devices-layout">
      {/* Filter Sidebar */}
      <aside className="w-full lg:w-60 bg-white border border-black/5 rounded-xl shadow-sm flex flex-col overflow-hidden rd2-filter-sidebar">
        <div className="flex items-center justify-between p-4 border-b border-black/[0.03] rd2-filter-head">
          <span className="font-black text-[11px] uppercase tracking-wider text-[#5C6573]">Filtreler</span>
          {(search || filter !== "all") && (
            <button className="text-[10px] font-black text-[#C0392B] bg-[#FCEAEA] px-2 py-0.5 rounded-md hover:brightness-95 rd2-clear-btn" onClick={() => { setSearch(""); setFilter("all"); }}>Temizle</button>
          )}
        </div>

        {/* Search */}
        <div className="p-4 border-b border-black/[0.03] rd2-filter-section">
          <div className="flex items-center gap-2 bg-[#F1F2F4] border border-black/5 rounded-lg px-3 py-2 rd2-search w-full">
            <Search className="w-4 h-4 text-[#8B92A0]" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Ara..." 
              className="bg-transparent border-0 outline-0 text-[13px] flex-1"
            />
          </div>
        </div>

        {/* Status */}
        <div className="p-4 rd2-filter-section">
          <div className="text-[10.5px] font-black text-[#8B92A0] uppercase tracking-widest mb-3 rd2-filter-label">Durum</div>
          <div className="flex flex-col gap-1 rd2-filter-pills">
            {(["all", "online", "offline"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-bold transition-colors rd2-fpill ${filter === k ? "bg-[#FFCC00] text-[#0E1116]" : "text-[#5C6573] hover:bg-[#F1F2F4]"}`}
              >
                <div className="flex items-center gap-2">
                  {k === "online" && <span className="w-2 h-2 rounded-full bg-emerald-500 rd2-dot rd2-dot-green" />}
                  {k === "offline" && <span className="w-2 h-2 rounded-full bg-[#B6BAC2] rd2-dot rd2-dot-gray" />}
                  <span>{k === "all" ? "Tümü" : k.charAt(0).toUpperCase() + k.slice(1)}</span>
                </div>
                <span className="text-[11px] font-black opacity-40 rd2-fpill-count">
                  {k === "all" ? devices.length : devices.filter(d => d.status === k).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 rd2-devices-content">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 rd2-toolbar">
          <div className="text-[13px] font-bold text-[#5C6573]">
            <b className="text-[#0E1116]">{filteredDevices.length}</b> / {devices.length} cihaz listeleniyor
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1 bg-white border border-black/5 p-1 rounded-xl rd2-view-toggle">
            <button 
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors rd2-icon-btn rd2-icon-btn-sm ${viewMode === "list" ? "bg-[#FFCC00] text-[#0E1116]" : "text-[#8B92A0] hover:bg-[#F1F2F4]"}`}
              onClick={() => setViewMode("list")}
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button 
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors rd2-icon-btn rd2-icon-btn-sm ${viewMode === "grouped" ? "bg-[#FFCC00] text-[#0E1116]" : "text-[#8B92A0] hover:bg-[#F1F2F4]"}`}
              onClick={() => setViewMode("grouped")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Devices List */}
        <section className="bg-white border border-black/5 rounded-xl shadow-sm overflow-hidden rd2-card p-0">
          {viewMode === "list" ? (
            <table className="w-full rd2-table">
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
    <tr className="border-b border-black/[0.03] last:border-0 hover:bg-black/[0.015] transition-colors group rd2-tr-hover">
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-black transition-colors rd2-pill ${d.status === "online" ? "bg-[#E8F7EE] text-[#1A8245] rd2-pill-on" : "bg-[#F1F2F4] text-[#8B92A0] rd2-pill-off"}`}>
          <span className={`w-1.5 h-1.5 rounded-full rd2-dot ${d.status === "online" ? "bg-emerald-500 animate-brand-pulse rd2-dot-green" : "bg-[#B6BAC2] rd2-dot-gray"}`} />
          {d.status === "online" ? "Online" : "Offline"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 rd2-device-cell">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors rd2-device-icon ${d.status === "online" ? "bg-[#FFCC00]/20 text-[#0E1116]" : "bg-[#F1F2F4] text-[#8B92A0]"}`}>
            {d.os.includes("Windows") ? <Monitor className="w-4.5 h-4.5" /> : d.os.includes("mac") ? <Laptop className="w-4.5 h-4.5" /> : d.os.includes("Android") ? <Smartphone className="w-4.5 h-4.5" /> : <Server className="w-4.5 h-4.5" />}
          </div>
          <div>
            <Link href={`/devices/${d.id}`} className="hover:opacity-80 transition-opacity">
              <div className="text-[13px] font-black tracking-tight rd2-device-name">ID: {d.id}</div>
              <div className="text-[11px] font-mono font-bold text-[#8B92A0] mt-0.5 rd2-device-meta">{d.name} · {d.os}</div>
            </Link>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-[13px] font-black text-[#5C6573]">{d.user}</td>
      <td className="px-4 py-3">
        <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-black/[0.05] text-[#8B92A0] border border-black/5 rd2-chip">{d.group}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            disabled={d.status !== "online"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-black transition-all rd2-btn rd2-btn-sm ${d.status === "online" ? "bg-[#FFCC00] text-[#0E1116] shadow-sm hover:brightness-95 active:translate-y-px" : "bg-[#F1F2F4] text-[#8B92A0] cursor-not-allowed opacity-50"}`}
            onClick={() => onConnect(d.id)}
          >
            <Play className="w-3 h-3 fill-current" /> Bağlan
          </button>
          <Link href={`/devices/${d.id}`}>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-black/5 text-[#5C6573] hover:text-[#0E1116] hover:bg-[#F1F2F4] transition-colors rd2-icon-btn rd2-icon-btn-sm">
              <Info className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </td>
    </tr>
  );
}
