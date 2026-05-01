"use client";

import { useState } from "react";
import { Laptop, Play, Info, MoreHorizontal, ShieldAlert, MonitorCheck, Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function DevicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { devices, addDevice } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({ id: "", name: "", os: "Windows 11", ip: "" });

  const filteredDevices = devices.filter(device => 
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    device.id.includes(searchTerm)
  );

  const handleConnect = (id: string) => {
    window.location.href = `rustdesk://${id}`;
  };

  const handleAdd = () => {
    if(!newDevice.id || !newDevice.name) return;
    addDevice({
      id: newDevice.id,
      name: newDevice.name,
      os: newDevice.os,
      ip: newDevice.ip || "Bilinmiyor",
      user: "Atanmamış",
      status: "offline",
      lastSeen: "Hiç bağlanmadı"
    });
    setIsOpen(false);
    setNewDevice({ id: "", name: "", os: "Windows 11", ip: "" });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cihaz Yönetimi</h1>
          <p className="text-slate-500 font-medium mt-1">Sistemdeki tüm cihazları görüntüleyin ve bağlanın.</p>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between bg-slate-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cihaz ID veya Adı Ara..." 
              className="pl-9 bg-white border-slate-200 text-slate-900 focus-visible:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold">
              <Filter className="w-4 h-4 mr-2" /> Filtrele
            </Button>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-sm">
                  Yeni Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Yeni Cihaz Kaydı</DialogTitle>
                  <DialogDescription>RustDesk ID bilgisini girerek sistemi manuel kaydedin.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>RustDesk ID</Label>
                    <Input value={newDevice.id} onChange={e => setNewDevice({...newDevice, id: e.target.value})} placeholder="Örn: 123456789" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cihaz Adı</Label>
                    <Input value={newDevice.name} onChange={e => setNewDevice({...newDevice, name: e.target.value})} placeholder="Örn: MUHASEBE-LAPTOP" />
                  </div>
                  <div className="space-y-2">
                    <Label>İşletim Sistemi</Label>
                    <Input value={newDevice.os} onChange={e => setNewDevice({...newDevice, os: e.target.value})} placeholder="Örn: Windows 11" />
                  </div>
                  <div className="space-y-2">
                    <Label>IP Adresi (Opsiyonel)</Label>
                    <Input value={newDevice.ip} onChange={e => setNewDevice({...newDevice, ip: e.target.value})} placeholder="Örn: 192.168.1.100" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>İptal</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAdd}>Cihazı Ekle</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-slate-500 font-bold uppercase text-xs tracking-wider">Durum</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-xs tracking-wider">Cihaz</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-xs tracking-wider hidden md:table-cell">Kullanıcı</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-xs tracking-wider hidden lg:table-cell">IP Adresi</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-xs tracking-wider hidden sm:table-cell">Son Görülme</TableHead>
                <TableHead className="text-right text-slate-500 font-bold uppercase text-xs tracking-wider">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device) => (
                <TableRow key={device.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <TableCell>
                    {device.status === "online" ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center w-max gap-1.5 px-2.5 py-0.5">
                        <MonitorCheck className="w-3.5 h-3.5" />
                        Online
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 flex items-center w-max gap-1.5 px-2.5 py-0.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Offline
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shadow-sm ${device.status === 'online' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
                        <Laptop className={`w-4.5 h-4.5 ${device.status === 'online' ? 'text-blue-600' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{device.name}</div>
                        <div className="text-xs font-semibold text-slate-500">{device.id} <span className="mx-1">•</span> {device.os}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 font-medium hidden md:table-cell">{device.user}</TableCell>
                  <TableCell className="text-slate-500 hidden lg:table-cell font-mono text-sm">{device.ip}</TableCell>
                  <TableCell className="text-slate-500 hidden sm:table-cell font-medium">{device.lastSeen}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant={device.status === "online" ? "default" : "secondary"}
                        className={`font-semibold shadow-sm ${device.status === "online" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        onClick={() => handleConnect(device.id)}
                      >
                        <Play className="w-4 h-4 mr-1.5" />
                        Bağlan
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-slate-200 text-slate-700 shadow-lg">
                          <DropdownMenuItem className="focus:bg-slate-50 focus:text-slate-900 cursor-pointer font-medium">
                            <Info className="w-4 h-4 mr-2" />
                            Detayları Gör
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-slate-50 focus:text-slate-900 cursor-pointer font-medium">
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-red-50 focus:text-red-600 text-red-600 cursor-pointer font-medium">
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredDevices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500 font-medium">
                    Cihaz bulunamadı.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
