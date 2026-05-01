import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Device {
  id: string;
  name: string;
  os: string;
  user: string;
  status: "online" | "offline";
  lastSeen: string;
  ip: string;
  group?: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Teknisyen";
  status: "Aktif" | "Pasif";
  lastLogin: string;
}

interface AppState {
  isAuthenticated: boolean;
  user: { name: string; email: string; role: string } | null;
  login: (username: string, password?: string) => void;
  logout: () => void;

  devices: Device[];
  updateDeviceStatus: (id: string, status: "online" | "offline") => void;
  updateDeviceStatuses: () => void;
  setDevices: (devices: Device[]) => void;
  addDevice: (device: Device) => void;

  technicians: Technician[];
  addTechnician: (tech: Technician) => void;
  deleteTechnician: (id: string) => void;
}

const INITIAL_DEVICES: Device[] = [
  { id: "983214556", name: "MUHASEBE-PC",    os: "Windows 11",   user: "Ayşe Yılmaz",    status: "online",  lastSeen: "Şimdi",       ip: "192.168.1.45", group: "Finans" },
  { id: "445123998", name: "YAZILIM-MAC",    os: "macOS Sonoma", user: "Ufuk Kaya",       status: "online",  lastSeen: "Şimdi",       ip: "192.168.1.12", group: "IT" },
  { id: "112998334", name: "DEPO-TERMINAL",  os: "Windows 10",   user: "Depo Görevlisi",  status: "offline", lastSeen: "2 saat önce", ip: "192.168.2.100", group: "Lojistik" },
  { id: "776543221", name: "SVR-DB-01",      os: "Ubuntu 22.04", user: "Sistem",          status: "online",  lastSeen: "Şimdi",       ip: "10.0.0.5",     group: "Sunucu" },
];

const INITIAL_TECHNICIANS: Technician[] = [
  { id: "1", name: "Ufuk Kaya",    email: "ufuk@firma.com",  role: "Admin",     status: "Aktif", lastLogin: "Şimdi" },
  { id: "2", name: "Ahmet Yılmaz", email: "ahmet@firma.com", role: "Teknisyen", status: "Aktif", lastLogin: "2 saat önce" },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (username, _password) => set({
        isAuthenticated: true,
        user: { name: username, email: `${username.toLowerCase()}@firma.com`, role: "Admin" },
      }),
      logout: () => set({ isAuthenticated: false, user: null }),

      devices: INITIAL_DEVICES,
      updateDeviceStatus: (id, status) => set((state) => ({
        devices: state.devices.map(d =>
          d.id === id ? { ...d, status, lastSeen: status === "online" ? "Şimdi" : "Az önce" } : d
        ),
      })),
      updateDeviceStatuses: () => set((state) => ({
        devices: state.devices.map(d => ({
          ...d,
          status: Math.random() > 0.25 ? "online" : "offline",
          lastSeen: Math.random() > 0.25 ? "Şimdi" : "Az önce",
        })),
      })),
      setDevices: (devices) => set({ devices }),
      addDevice: (device) => set((state) => ({ devices: [device, ...state.devices] })),

      technicians: INITIAL_TECHNICIANS,
      addTechnician: (tech) => set((state) => ({ technicians: [...state.technicians, tech] })),
      deleteTechnician: (id) => set((state) => ({ technicians: state.technicians.filter(t => t.id !== id) })),
    }),
    { name: 'rustdesk-store' }
  )
);
