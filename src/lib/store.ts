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
  login: (username: string) => void;
  logout: () => void;

  devices: Device[];
  updateDeviceStatus: (id: string, status: "online" | "offline") => void;
  updateDeviceStatuses: () => void;
  setDevices: (devices: Device[]) => void;
  addDevice: (device: Device) => void;
  deleteDevice: (id: string) => void;

  technicians: Technician[];
  addTechnician: (tech: Technician) => void;
  deleteTechnician: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (username) => set({
        isAuthenticated: true,
        user: { name: username, email: `${username.toLowerCase()}@firma.com`, role: "Admin" },
      }),
      logout: () => set({ isAuthenticated: false, user: null }),

      devices: [], // Canlı veri için boşaltıldı
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
      deleteDevice: (id) => set((state) => ({ devices: state.devices.filter(d => d.id !== id) })),

      technicians: [], // Canlı veri için boşaltıldı
      addTechnician: (tech) => set((state) => ({ technicians: [...state.technicians, tech] })),
      deleteTechnician: (id) => set((state) => ({ technicians: state.technicians.filter(t => t.id !== id) })),
    }),
    { name: 'rustdesk-store' }
  )
);
