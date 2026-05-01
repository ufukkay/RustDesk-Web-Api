import { create } from 'zustand';

// Gerçek API bağlandığında bu tipler gelişecek
export interface Device {
  id: string;
  name: string;
  os: string;
  user: string;
  status: "online" | "offline";
  lastSeen: string;
  ip: string;
}

interface AppState {
  isAuthenticated: boolean;
  user: any | null;
  login: (username: string) => void;
  logout: () => void;
  
  devices: Device[];
  updateDeviceStatus: (id: string, status: "online" | "offline") => void;
  setDevices: (devices: Device[]) => void;
}

const INITIAL_DEVICES: Device[] = [
  { id: "983214556", name: "MUHASEBE-PC", os: "Windows 11", user: "Ayşe Yılmaz", status: "online", lastSeen: "Şimdi", ip: "192.168.1.45" },
  { id: "445123998", name: "YAZILIM-MAC", os: "macOS Sonoma", user: "Ufuk Kaya", status: "online", lastSeen: "Şimdi", ip: "192.168.1.12" },
  { id: "112998334", name: "DEPO-TERMINAL", os: "Windows 10", user: "Depo Görevlisi", status: "offline", lastSeen: "2 saat önce", ip: "192.168.2.100" },
  { id: "776543221", name: "SVR-DB-01", os: "Ubuntu 22.04", user: "Sistem", status: "online", lastSeen: "Şimdi", ip: "10.0.0.5" },
  { id: "332111445", name: "IK-LAPTOP", os: "Windows 11", user: "Fatma Demir", status: "offline", lastSeen: "1 gün önce", ip: "192.168.1.88" },
];

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false, // Varsayılan olarak çıkış yapmış durumda
  user: null,
  login: (username) => set({ isAuthenticated: true, user: { name: username, email: `${username}@rustdesk.local` } }),
  logout: () => set({ isAuthenticated: false, user: null }),
  
  devices: INITIAL_DEVICES,
  updateDeviceStatus: (id, status) => set((state) => ({
    devices: state.devices.map(d => d.id === id ? { ...d, status, lastSeen: status === "online" ? "Şimdi" : "Az önce" } : d)
  })),
  setDevices: (devices) => set({ devices }),
}));
