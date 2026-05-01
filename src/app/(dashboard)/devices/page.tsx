"use client";

import { useAppStore } from "@/lib/store";
import { Search, Monitor, Laptop, Server, Play, MoreHorizontal, Plus, Filter, Smartphone } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type StatusFilter = "all" | "online" | "offline";

export default function DevicesPage() {
  const { devices, addDevice } = useAppStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [isOpen, setIsOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({ id: "", name: "", os: "Windows 11", user: "", group: "Genel" });

  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.id.includes(search);
      const matchesFilter = filter === "all" || d.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [devices, search, filter]);

  const handleAddDevice = () => {
    addDevice({ ...newDevice, status: "offline", lastSeen: "Hiç", ip: "-" });
    setIsOpen(false);
    setNewDevice({ id: "", name: "", os: "Windows 11", user: "", group: "Genel" });
  };

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Cihazlar</h1>
          <p className="text-sm text-muted-foreground">Tüm envanterinizi buradan yönetin.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:opacity-90 font-semibold px-6 rounded-md">
              <Plus className="w-4 h-4 mr-2" /> Yeni Cihaz
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground font-semibold">Yeni Cihaz Kaydı</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">RustDesk ID</Label>
                <Input placeholder="983 214 556" value={newDevice.id} onChange={e => setNewDevice({...newDevice, id: e.target.value})} className="bg-secondary/50 border-border h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Cihaz Adı</Label>
                <Input placeholder="MUHASEBE-PC" value={newDevice.name} onChange={e => setNewDevice({...newDevice, name: e.target.value})} className="bg-secondary/50 border-border h-10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Sistem</Label>
                  <select 
                    value={newDevice.os} 
                    onChange={e => setNewDevice({...newDevice, os: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option>Windows 11</option>
                    <option>Windows 10</option>
                    <option>macOS</option>
                    <option>Linux</option>
                    <option>Android</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Grup</Label>
                  <Input placeholder="Ofis" value={newDevice.group} onChange={e => setNewDevice({...newDevice, group: e.target.value})} className="bg-secondary/50 border-border h-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Kullanıcı</Label>
                <Input placeholder="Ayşe Yılmaz" value={newDevice.user} onChange={e => setNewDevice({...newDevice, user: e.target.value})} className="bg-secondary/50 border-border h-10" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddDevice} className="bg-primary text-primary-foreground font-semibold w-full h-10 rounded-md">
                Cihazı Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cihaz ID veya adı ara…" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-card border-border rounded-md shadow-brand-sm focus-visible:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-muted/30 border border-border rounded-lg shadow-brand-sm">
          {[
            { id: "all", label: `Tümü (${devices.length})` },
            { id: "online", label: `Çevrimiçi (${devices.filter(d => d.status === "online").length})` },
            { id: "offline", label: `Çevrimdışı (${devices.filter(d => d.status === "offline").length})` },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id as StatusFilter)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filter === opt.id 
                  ? "bg-card text-foreground shadow-brand-sm border border-border" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-brand-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-6 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Durum</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cihaz</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Kullanıcı</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Grup</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Son Görülme</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDevices.map(d => (
                <tr key={d.id} className="hover:bg-muted/20 transition-colors group">
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
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">ID: {d.id} · {d.os}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-muted-foreground">{d.user}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-[10px] font-semibold rounded-md border border-border">
                      {d.group}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{d.lastSeen}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <Button 
                        disabled={d.status !== "online"}
                        size="sm"
                        className={`h-8 px-4 rounded-md text-xs font-semibold ${
                          d.status === "online" 
                            ? "bg-primary text-primary-foreground hover:opacity-90" 
                            : "bg-secondary text-muted-foreground cursor-not-allowed"
                        }`}
                        onClick={() => window.location.href = `rustdesk://${d.id}`}
                      >
                        <Play className="w-3 h-3 mr-1.5 fill-current" /> Bağlan
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDevices.length === 0 && (
          <div className="py-20 text-center">
            <Search className="w-10 h-10 text-muted/50 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium text-sm">Cihaz bulunamadı.</p>
          </div>
        )}

        <div className="px-6 py-3 border-t border-border bg-muted/10 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>{filteredDevices.length} cihaz listeleniyor</span>
          <div className="flex items-center gap-3">
            <button className="p-1 hover:bg-secondary rounded-md disabled:opacity-30" disabled>‹</button>
            <span className="text-foreground">1 / 1</span>
            <button className="p-1 hover:bg-secondary rounded-md disabled:opacity-30" disabled>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
