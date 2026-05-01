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
  password?: string; // Şifre alanı eklendi
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

  serverConfig: {
    host: string;
    apiPort: string;
    token: string;
  };
  setServerConfig: (config: { host: string; apiPort: string; token: string }) => void;
  fetchDevices: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (email) => set({
        isAuthenticated: true,
        user: { name: email.split("@")[0], email: email, role: "Admin" },
      }),
      logout: () => set({ isAuthenticated: false, user: null }),

      devices: [], // Canlı veri için boşaltıldı
      setDevices: (devices) => set({ devices }),
      addDevice: (device) => set((state) => ({ devices: [device, ...state.devices] })),
      deleteDevice: (id) => set((state) => ({ devices: state.devices.filter(d => d.id !== id) })),

      technicians: [], // Canlı veri için boşaltıldı
      addTechnician: (tech) => set((state) => ({ technicians: [...state.technicians, tech] })),
      deleteTechnician: (id) => set((state) => ({ technicians: state.technicians.filter(t => t.id !== id) })),

      serverConfig: {
        host: "192.168.0.184",
        apiPort: "3000",
        token: "",
      },
      setServerConfig: (config) => set({ serverConfig: config }),
      fetchDevices: async () => {
        try {
          const res = await fetch("/api/rustdesk/devices");
          const data = await res.json();
          if (data && Array.isArray(data)) {
            set({ devices: data });
          }
        } catch (error) {
          console.error("Cihazlar çekilemedi:", error);
        }
      },
    }),
    { name: 'rustdesk-store' }
  )
);
