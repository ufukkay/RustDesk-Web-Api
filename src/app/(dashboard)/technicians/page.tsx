"use client";

import { useState } from "react";
import { useAppStore, Technician } from "@/lib/store";
import { UserPlus, MoreHorizontal, Shield, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TechniciansPage() {
  const { technicians, addTechnician, deleteTechnician } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newTech, setNewTech] = useState({ name: "", email: "", role: "Teknisyen" });

  const handleAdd = () => {
    if (!newTech.name || !newTech.email) return;
    addTechnician({
      id: Math.random().toString(36).substr(2, 9),
      name: newTech.name,
      email: newTech.email,
      role: newTech.role as "Admin" | "Teknisyen",
      status: "Aktif",
      lastLogin: "Hiç girmedi",
    });
    setIsOpen(false);
    setNewTech({ name: "", email: "", role: "Teknisyen" });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Teknisyen Yönetimi</h1>
          <p className="text-slate-500 font-medium">Sistemde yetkili olan kullanıcıları görüntüleyin ve yönetin.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              <UserPlus className="w-4 h-4 mr-2" /> Yeni Teknisyen Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni Teknisyen Ekle</DialogTitle>
              <DialogDescription>
                Sisteme erişebilecek yeni bir teknisyen profili oluşturun.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ad Soyad</Label>
                <Input id="name" value={newTech.name} onChange={e => setNewTech({...newTech, name: e.target.value})} placeholder="Örn: Ahmet Yılmaz" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <Input id="email" type="email" value={newTech.email} onChange={e => setNewTech({...newTech, email: e.target.value})} placeholder="ahmet@firma.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <select 
                  id="role" 
                  value={newTech.role} 
                  onChange={e => setNewTech({...newTech, role: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                >
                  <option value="Teknisyen">Teknisyen</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>İptal</Button>
              <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">Kaydet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-slate-500 font-bold uppercase text-xs tracking-wider">Kullanıcı</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-xs tracking-wider">E-posta</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-xs tracking-wider">Yetki Rolü</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-xs tracking-wider">Durum</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-xs tracking-wider">Son Giriş</TableHead>
                <TableHead className="text-right text-slate-500 font-bold uppercase text-xs tracking-wider">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicians.map((tech) => (
                <TableRow key={tech.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {tech.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900">{tech.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 font-medium">{tech.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={tech.role === 'Admin' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                      {tech.role === 'Admin' && <Shield className="w-3 h-3 mr-1" />}
                      {tech.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {tech.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500">{tech.lastLogin}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteTechnician(tech.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {technicians.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500 font-medium">Kayıtlı teknisyen bulunamadı.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
