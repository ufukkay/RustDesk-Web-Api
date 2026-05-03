"use client";

import { useAppStore, Device } from "@/lib/store";
import { Search, Monitor, Laptop, Server, Play, MoreHorizontal, Plus, Filter, Smartphone, Trash2, LayoutGrid, List as ListIcon, ChevronRight, Edit2, Info, Cpu, HardDrive, Database, Activity } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type StatusFilter = "all" | "online" | "offline";
type ViewMode = "list" | "grouped";

export default function DevicesPage() {
  const { devices, addDevice, deleteDevice, fetchDevices } = useAppStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchDevices();
    fetch("/api/rustdesk/settings").then(res => res.json()).then(data => setSettings(data));
  }, [fetchDevices]);

  const handleConnect = (id: string) => {
    const pass = settings?.defaultPassword || "Ban41kam5";
    window.location.href = `rustdesk://${id}?password=${pass}`;
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
      const groupName = d.group || "Gruplanmamış";
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(d);
    });
    return groups;
  }, [filteredDevices]);


  const handleDelete = (id: string, name: string) => {
    if (confirm(`${name} cihazını silmek istediğinize emin misiniz?`)) {
      deleteDevice(id);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Cihazlar</h1>
          <p className="text-sm text-muted-foreground">Envanterinizi gruplayın ve yönetin.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
          <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Canlı İzleme Aktif</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cihaz ID veya adı ara…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-card border-border rounded-md shadow-sm focus-visible:ring-primary"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-muted/30 border border-border rounded-lg shadow-sm w-fit">
            {[
              { id: "all", label: `Hepsi (${devices.length})` },
              { id: "online", label: `Online` },
              { id: "offline", label: `Offline` },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setFilter(opt.id as StatusFilter)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  filter === opt.id 
                    ? "bg-card text-foreground shadow-sm border border-border" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted/30 border border-border rounded-lg shadow-sm">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-card text-primary shadow-sm border border-border" : "text-muted-foreground"}`}
            title="Liste Görünümü"
          >
            <ListIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grouped")}
            className={`p-2 rounded-md transition-all ${viewMode === "grouped" ? "bg-card text-primary shadow-sm border border-border" : "text-muted-foreground"}`}
            title="Grup Görünümü"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="bg-card rounded-brand-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-6 py-4 text-[11px] font-semibold text-muted-foreground tracking-wider">Durum</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-muted-foreground tracking-wider">Cihaz</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-muted-foreground tracking-wider">Kullanıcı</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-muted-foreground tracking-wider">Grup</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-muted-foreground tracking-wider text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDevices.map(d => (
                  <DeviceRow key={d.id} d={d} onDelete={handleDelete} onConnect={handleConnect} />
                ))}
              </tbody>
            </table>
          </div>
          {filteredDevices.length === 0 && <EmptyState />}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDevices).map(([groupName, groupDevices]) => (
            <div key={groupName} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <ChevronRight className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground tracking-wider">{groupName}</h2>
                <span className="text-xs text-muted-foreground">({groupDevices.length})</span>
              </div>
              <div className="bg-card rounded-brand-lg border border-border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-border">
                    {groupDevices.map(d => (
                      <DeviceRow key={d.id} d={d} onDelete={handleDelete} onConnect={handleConnect} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {filteredDevices.length === 0 && <EmptyState />}
        </div>
      )}
    </div>
  );
}

function DeviceRow({ d, onDelete, onConnect }: { d: Device, onDelete: (id: string, name: string) => void, onConnect: (id: string) => void }) {
  return (
    <tr className="hover:bg-muted/20 transition-colors group">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
          d.status === "online" ? "text-emerald-600 bg-emerald-500/10" : "text-muted-foreground bg-secondary"
        }`}>
          <div className={`w-1 h-1 rounded-full ${d.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
          {d.status === "online" ? "Online" : "Offline"}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
            {d.os.includes("Windows") ? <Monitor className="w-4.5 h-4.5" /> : d.os.includes("mac") ? <Laptop className="w-4.5 h-4.5" /> : d.os.includes("Android") ? <Smartphone className="w-4.5 h-4.5" /> : <Server className="w-4.5 h-4.5" />}
          </div>
          <Link href={`/devices/${d.id}`} className="hover:opacity-80 transition-opacity">
            <p className="text-sm font-bold text-foreground">ID: {d.id}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{d.name} · {d.os}</p>
          </Link>
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-medium text-muted-foreground">{d.user}</td>
      <td className="px-6 py-4">
        <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-[10px] font-semibold rounded-md border border-border">
          {d.group}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2 transition-all">
          <Button 
            disabled={d.status !== "online"}
            size="sm"
            className={`h-8 px-4 rounded-md text-xs font-semibold ${
              d.status === "online" 
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm" 
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            }`}
            onClick={() => onConnect(d.id)}
          >
            <Play className="w-3 h-3 mr-1.5 fill-current" /> Bağlan
          </Button>
          
          <Link href={`/devices/${d.id}`}>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-md border-border text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
              title="Detaylar"
            >
              <Info className="w-4 h-4" />
            </Button>
          </Link>

          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 rounded-md border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Düzenle"
          >
            <Edit2 className="w-4 h-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={() => onDelete(d.id, d.name)}
            title="Sil"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <Search className="w-10 h-10 text-muted/50 mx-auto mb-4" />
      <p className="text-muted-foreground font-medium text-sm">Cihaz bulunamadı.</p>
    </div>
  );
}
