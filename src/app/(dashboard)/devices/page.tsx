"use client";

import { useState } from "react";
import { Laptop, Play, Info, MoreHorizontal, ShieldAlert, MonitorCheck } from "lucide-react";
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

// Mock Data
const MOCK_DEVICES = [
  { id: "983214556", name: "MUHASEBE-PC", os: "Windows 11", user: "Ayşe Yılmaz", status: "online", lastSeen: "Şimdi", ip: "192.168.1.45" },
  { id: "445123998", name: "YAZILIM-MAC", os: "macOS Sonoma", user: "Ufuk Kaya", status: "online", lastSeen: "Şimdi", ip: "192.168.1.12" },
  { id: "112998334", name: "DEPO-TERMINAL", os: "Windows 10", user: "Depo Görevlisi", status: "offline", lastSeen: "2 saat önce", ip: "192.168.2.100" },
  { id: "776543221", name: "SVR-DB-01", os: "Ubuntu 22.04", user: "Sistem", status: "online", lastSeen: "Şimdi", ip: "10.0.0.5" },
  { id: "332111445", name: "IK-LAPTOP", os: "Windows 11", user: "Fatma Demir", status: "offline", lastSeen: "1 gün önce", ip: "192.168.1.88" },
];

export default function DevicesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDevices = MOCK_DEVICES.filter(device => 
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    device.id.includes(searchTerm)
  );

  // RustDesk protokolü ile cihaza bağlanma tetikleyicisi
  const handleConnect = (id: string) => {
    // rustdesk:// id protokolü masaüstü uygulamasını tetikler.
    window.location.href = `rustdesk://${id}`;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Cihaz Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Sistemdeki tüm cihazları görüntüleyin ve bağlanın.</p>
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Cihaz ID veya Adı Ara..." 
            className="w-full sm:w-64 bg-black/40 border-white/10 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button className="bg-primary text-white hover:bg-primary/90">
            Yeni Ekle
          </Button>
        </div>
      </div>

      <Card className="bg-black/40 border-white/10 backdrop-blur-md flex-1">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5 hover:bg-white/5 border-b border-white/10">
              <TableRow>
                <TableHead className="text-gray-400 font-medium">Durum</TableHead>
                <TableHead className="text-gray-400 font-medium">Cihaz</TableHead>
                <TableHead className="text-gray-400 font-medium hidden md:table-cell">Kullanıcı</TableHead>
                <TableHead className="text-gray-400 font-medium hidden lg:table-cell">IP Adresi</TableHead>
                <TableHead className="text-gray-400 font-medium hidden sm:table-cell">Son Görülme</TableHead>
                <TableHead className="text-right text-gray-400 font-medium">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device) => (
                <TableRow key={device.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <TableCell>
                    {device.status === "online" ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center w-max gap-1">
                        <MonitorCheck className="w-3 h-3" />
                        Online
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20 flex items-center w-max gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        Offline
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center border border-white/10">
                        <Laptop className="w-4 h-4 text-gray-300" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-200">{device.name}</div>
                        <div className="text-xs text-gray-500">{device.id} • {device.os}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400 hidden md:table-cell">{device.user}</TableCell>
                  <TableCell className="text-gray-400 hidden lg:table-cell font-mono text-sm">{device.ip}</TableCell>
                  <TableCell className="text-gray-400 hidden sm:table-cell">{device.lastSeen}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant={device.status === "online" ? "default" : "secondary"}
                        className={device.status === "online" ? "bg-primary text-white hover:bg-primary/90" : "bg-white/10 text-gray-400 hover:bg-white/20"}
                        onClick={() => handleConnect(device.id)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Bağlan
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-gray-200">
                          <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
                            <Info className="w-4 h-4 mr-2" />
                            Detayları Gör
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-red-500/20 focus:text-red-400 text-red-400 cursor-pointer">
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
                  <TableCell colSpan={6} className="h-32 text-center text-gray-500">
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
