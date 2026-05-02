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
  cpu?: string;
  ram?: string;
  disk?: string;
  version?: string;
  net_details?: any[]; // Detaylı ağ bilgileri
}

export interface Technician {
  id: string;
  name: string;
  username: string; // Kullanıcı adı alanı eklendi
  email: string;
  password?: string; // Şifre alanı eklendi
  role: "Admin" | "Teknisyen";
  status: "Aktif" | "Pasif" | "Çevrimiçi";
  lastLogin: string;
}

interface AppState {
  isAuthenticated: boolean;
  user: { name: string; email: string; role: string } | null;
  login: (username: string) => void;
  logout: () => void;

  devices: Device[];
  setDevices: (devices: Device[]) => void;
  addDevice: (device: Device) => void;
  deleteDevice: (id: string) => void;

  technicians: Technician[];
  setTechnicians: (techs: Technician[]) => void;
  addTechnician: (tech: Technician) => Promise<void>;
  deleteTechnician: (id: string) => Promise<void>;
  fetchTechnicians: () => Promise<void>;

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

      technicians: [], 
      setTechnicians: (technicians) => set({ technicians }),
      addTechnician: async (tech) => {
        await fetch("/api/technicians", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tech)
        });
        set((state) => ({ technicians: [...state.technicians.filter(t => t.id !== tech.id), tech] }));
      },
      deleteTechnician: async (id) => {
        await fetch("/api/technicians", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });
        set((state) => ({ technicians: state.technicians.filter(t => t.id !== id) }));
      },
      fetchTechnicians: async () => {
        try {
          const res = await fetch("/api/technicians");
          const data = await res.json();
          if (Array.isArray(data)) set({ technicians: data });
        } catch (e) {}
      },

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
