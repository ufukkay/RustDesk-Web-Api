"use client";

import { useAppStore, Technician } from "@/lib/store";
import { UserPlus, Search, Shield, User, Trash2, Edit2, Mail } from "lucide-react";
import { useState } from "react";
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

export default function TechniciansPage() {
  const { technicians, addTechnician, deleteTechnician } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newTech, setNewTech] = useState<Partial<Technician>>({ name: "", email: "", password: "", role: "Teknisyen" });

  const handleAdd = () => {
    if (!newTech.name || !newTech.email) return;
    addTechnician({
      id: Math.random().toString(36).substr(2, 9),
      name: newTech.name,
      email: newTech.email,
      password: newTech.password,
      role: newTech.role as "Admin" | "Teknisyen",
      status: "Aktif",
      lastLogin: "Hiç",
    });
    setIsOpen(false);
    setNewTech({ name: "", email: "", password: "", role: "Teknisyen" });
  };

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Title & Add */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Teknisyenler</h1>
          <p className="text-sm text-muted-foreground">Yetkili kullanıcıları yönetin.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <Button 
            onClick={() => setIsOpen(true)}
            className="bg-primary text-primary-foreground font-semibold px-6 rounded-md"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Yeni Teknisyen
          </Button>
          <DialogContent className="sm:max-w-md bg-card border-border rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground font-semibold">Yeni Teknisyen Davet Et</DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="space-y-2">
                <Label className="text-[12px] font-black text-brand-ink uppercase">Ad Soyad</Label>
                <Input placeholder="Selin Demir" value={newTech.name} onChange={e => setNewTech({...newTech, name: e.target.value})} className="bg-brand-bg/30 border-brand-ink/10 h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-black text-brand-ink uppercase">E-posta Adresi</Label>
                <Input type="email" placeholder="selin@rustdesk.local" value={newTech.email} onChange={e => setNewTech({...newTech, email: e.target.value})} className="bg-brand-bg/30 border-brand-ink/10 h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-black text-brand-ink uppercase">Şifre</Label>
                <Input type="password" placeholder="••••••••" value={newTech.password} onChange={e => setNewTech({...newTech, password: e.target.value})} className="bg-brand-bg/30 border-brand-ink/10 h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-black text-brand-ink uppercase">Yetki Rolü</Label>
                <select 
                  value={newTech.role} 
                  onChange={e => setNewTech({...newTech, role: e.target.value as any})}
                  className="flex h-11 w-full rounded-md border border-brand-ink/10 bg-brand-bg/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
                >
                  <option value="Teknisyen">Teknisyen (Sınırlı)</option>
                  <option value="Admin">Admin (Tam Yetki)</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} className="bg-brand-yellow text-brand-ink hover:bg-brand-yellow/90 font-black w-full h-11 rounded-brand">
                Teknisyen Ekle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "Toplam Teknisyen", value: technicians.length, sub: "Tümü aktif" },
          { label: "Yöneticiler", value: technicians.filter(t => t.role === "Admin").length, sub: "Tam yetkili" },
          { label: "Bugün Aktif", value: technicians.length, sub: "Sisteme girenler" },
        ].map((s) => (
          <div key={s.label} className="bg-card p-5 rounded-brand border border-border shadow-brand-sm">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <div className="flex items-end gap-2 mt-2">
              <p className="text-2xl font-black text-foreground leading-none">{s.value}</p>
              <p className="text-[11px] text-muted-foreground font-bold pb-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-brand-lg border border-border shadow-brand-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Teknisyen ara..." className="pl-9 h-9 bg-card border-border text-xs rounded-lg shadow-brand-sm" />
          </div>
          <Button variant="outline" className="h-9 text-[11px] font-black border-border hover:bg-secondary rounded-lg">
            <Mail className="w-3.5 h-3.5 mr-2" /> Toplu Davet Gönder
          </Button>
        </div>
        
        <table className="w-full">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Kullanıcı</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">E-posta</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Rol</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Durum</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Son Giriş</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {technicians.map(t => (
              <tr key={t.id} className="hover:bg-muted/20 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-brand-ink font-black text-xs ring-1 ring-border shadow-brand-sm ${t.role === "Admin" ? "bg-brand-yellow" : "bg-muted"}`}>
                      {t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-[13.5px] font-black text-foreground">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground font-bold mt-0.5 tracking-tight">@{t.email.split("@")[0]}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-[13px] font-bold text-muted-foreground">{t.email}</td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black ${
                    t.role === "Admin" ? "bg-brand-yellow/20 text-brand-yellow ring-1 ring-brand-yellow/30" : "bg-muted text-muted-foreground ring-1 ring-border"
                  }`}>
                    {t.role === "Admin" && <Shield className="w-3 h-3" />}
                    {t.role === "Admin" ? "Yönetici" : "Teknisyen"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-[11px] font-black rounded-full ring-1 ring-emerald-500/20 w-fit">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-brand-pulse" />
                    {t.status}
                  </div>
                </td>
                <td className="px-6 py-4 text-[13px] font-medium text-muted-foreground">{t.lastLogin}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-brand-ink/5 text-slate-400 hover:text-brand-ink">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                      onClick={() => deleteTechnician(t.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
