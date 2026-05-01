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
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-brand-ink">Cihazlar</h1>
          <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Tüm Envanter Yönetimi</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<Button className="bg-brand-yellow text-brand-ink hover:bg-brand-yellow/90 font-black shadow-brand-sm ring-1 ring-brand-ink/10 h-10 px-5 rounded-brand" />}>
            <Plus className="w-4 h-4 mr-2" /> Yeni Cihaz
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-white border-brand-ink/10 rounded-brand-lg">
            <DialogHeader>
              <DialogTitle className="text-brand-ink font-black">Yeni Cihaz Kaydı</DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="space-y-2">
                <Label className="text-[12px] font-black text-brand-ink uppercase">RustDesk ID</Label>
                <Input placeholder="983 214 556" value={newDevice.id} onChange={e => setNewDevice({...newDevice, id: e.target.value})} className="bg-brand-bg/30 border-brand-ink/10 h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-black text-brand-ink uppercase">Cihaz Adı</Label>
                <Input placeholder="MUHASEBE-PC" value={newDevice.name} onChange={e => setNewDevice({...newDevice, name: e.target.value})} className="bg-brand-bg/30 border-brand-ink/10 h-11" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[12px] font-black text-brand-ink uppercase">İşletim Sistemi</Label>
                  <select 
                    value={newDevice.os} 
                    onChange={e => setNewDevice({...newDevice, os: e.target.value})}
                    className="flex h-11 w-full rounded-md border border-brand-ink/10 bg-brand-bg/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
                  >
                    <option>Windows 11</option>
                    <option>Windows 10</option>
                    <option>macOS</option>
                    <option>Linux</option>
                    <option>Android</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-black text-brand-ink uppercase">Grup</Label>
                  <Input placeholder="Ofis" value={newDevice.group} onChange={e => setNewDevice({...newDevice, group: e.target.value})} className="bg-brand-bg/30 border-brand-ink/10 h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-black text-brand-ink uppercase">Kullanıcı</Label>
                <Input placeholder="Ayşe Yılmaz" value={newDevice.user} onChange={e => setNewDevice({...newDevice, user: e.target.value})} className="bg-brand-bg/30 border-brand-ink/10 h-11" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddDevice} className="bg-brand-yellow text-brand-ink hover:bg-brand-yellow/90 font-black w-full h-11 rounded-brand">
                Cihazı Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cihaz ID veya adı ara…" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-white border-brand-ink/10 rounded-brand shadow-brand-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-white border border-brand-ink/10 rounded-brand shadow-brand-sm">
          {[
            { id: "all", label: `Tümü (${devices.length})` },
            { id: "online", label: `Çevrimiçi (${devices.filter(d => d.status === "online").length})` },
            { id: "offline", label: `Çevrimdışı (${devices.filter(d => d.status === "offline").length})` },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id as StatusFilter)}
              className={`px-4 py-2 text-[12px] font-black rounded-[7px] transition-all ${
                filter === opt.id 
                  ? "bg-brand-yellow text-brand-ink shadow-brand-sm" 
                  : "text-slate-500 hover:text-brand-ink hover:bg-brand-ink/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Button variant="outline" className="h-11 border-brand-ink/10 rounded-brand bg-white font-black text-[12px] text-slate-600">
          <Filter className="w-4 h-4 mr-2" /> Filtrele
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-brand-lg border border-brand-ink/5 shadow-brand-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-bg/10 border-b border-brand-ink/5">
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Durum</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cihaz</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Kullanıcı</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Grup</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Son Görülme</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-ink/5">
            {filteredDevices.map(d => (
              <tr key={d.id} className="hover:bg-brand-bg/10 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black tracking-tight ${
                    d.status === "online" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-slate-100 text-slate-400"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${d.status === "online" ? "bg-emerald-500 animate-brand-pulse" : "bg-slate-300"}`} />
                    {d.status === "online" ? "ÇEVRİMİÇİ" : "ÇEVRİMDIŞI"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-brand-sm ring-1 ring-brand-ink/5 ${d.status === "online" ? "bg-brand-yellow/10 text-brand-ink" : "bg-slate-50 text-slate-400"}`}>
                      {d.os.includes("Windows") ? <Monitor className="w-5 h-5" /> : d.os.includes("mac") ? <Laptop className="w-5 h-5" /> : d.os.includes("Android") ? <Smartphone className="w-5 h-5" /> : <Server className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-[13.5px] font-black text-brand-ink">{d.name}</p>
                      <p className="text-[11px] text-slate-400 font-bold mt-1 tracking-tight">ID: <span className="text-brand-ink/70 font-black font-mono">{d.id}</span> · {d.os}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-[13px] font-bold text-slate-600">{d.user}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[11px] font-black rounded-lg border border-brand-ink/5">
                    {d.group}
                  </span>
                </td>
                <td className="px-6 py-4 text-[13px] font-medium text-slate-500">{d.lastSeen}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      disabled={d.status !== "online"}
                      className={`h-9 px-4 rounded-brand text-[12px] font-black shadow-brand-sm ${
                        d.status === "online" 
                          ? "bg-brand-yellow text-brand-ink hover:bg-brand-yellow/90 ring-1 ring-brand-ink/10" 
                          : "bg-white text-slate-300 border border-brand-ink/10"
                      }`}
                      onClick={() => window.location.href = `rustdesk://${d.id}`}
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Bağlan
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-brand hover:bg-brand-ink/5 text-slate-400 hover:text-brand-ink transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredDevices.length === 0 && (
          <div className="py-20 text-center">
            <Search className="w-10 h-10 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold text-sm">Aradığınız kriterlere uygun cihaz bulunamadı.</p>
          </div>
        )}

        <div className="px-6 py-4 border-t border-brand-ink/5 bg-brand-bg/5 flex items-center justify-between text-[12px] font-bold text-slate-400">
          <span>{filteredDevices.length} cihaz listeleniyor · Toplam {devices.length}</span>
          <div className="flex items-center gap-3">
            <button className="p-1.5 hover:bg-brand-ink/5 rounded-lg disabled:opacity-30" disabled>‹</button>
            <span className="text-brand-ink">1 / 1</span>
            <button className="p-1.5 hover:bg-brand-ink/5 rounded-lg disabled:opacity-30" disabled>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
