import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Cihaz veri yapısı
 */
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
  net_details?: any[]; // Detaylı ağ kartı bilgileri
}

/**
 * Teknisyen veri yapısı
 */
export interface Technician {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: "Admin" | "Teknisyen";
  status: "Aktif" | "Pasif" | "Çevrimiçi";
  lastLogin: string;
}

/**
 * Uygulama genel durum (state) yapısı
 */
interface AppState {
  // Kimlik doğrulama işlemleri
  isAuthenticated: boolean;
  user: { name: string; email: string; role: string } | null;
  login: (username: string) => void;
  logout: () => void;

  // Cihaz yönetimi
  devices: Device[];
  setDevices: (devices: Device[]) => void;
  addDevice: (device: Device) => void;
  deleteDevice: (id: string) => void;
  fetchDevices: () => Promise<void>;

  // Teknisyen yönetimi
  technicians: Technician[];
  setTechnicians: (techs: Technician[]) => void;
  addTechnician: (tech: Technician) => Promise<void>;
  deleteTechnician: (id: string) => Promise<void>;
  fetchTechnicians: () => Promise<void>;

  // Sunucu yapılandırması
  serverConfig: {
    host: string;
    apiPort: string;
    token: string;
  };
  setServerConfig: (config: { host: string; apiPort: string; token: string }) => void;
}

/**
 * Ana uygulama store'u - Verileri localStorage üzerinde 'rustdesk-store' adıyla saklar.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      
      // Kullanıcı girişi simülasyonu
      login: (email) => set({
        isAuthenticated: true,
        user: { name: email.split("@")[0], email: email, role: "Admin" },
      }),
      
      // Çıkış yap ve verileri sıfırla
      logout: () => set({ isAuthenticated: false, user: null }),

      // Cihaz listesi işlemleri
      devices: [], 
      setDevices: (devices) => set({ devices }),
      addDevice: (device) => set((state) => ({ devices: [device, ...state.devices] })),
      // Cihaz silme işlemi - Artık sunucudan da siliyor
      deleteDevice: async (id) => {
        try {
          await fetch("/api/rustdesk/devices", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
          });
          set((state) => ({ devices: state.devices.filter(d => d.id !== id) }));
        } catch (error) {
          console.error("Cihaz silinemedi:", error);
        }
      },

      // Teknisyen listesi ve API entegrasyonu
      technicians: [], 
      setTechnicians: (technicians) => set({ technicians }),
      
      // Yeni teknisyen ekle veya güncelle
      addTechnician: async (tech) => {
        await fetch("/api/technicians", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tech)
        });
        set((state) => ({ technicians: [...state.technicians.filter(t => t.id !== tech.id), tech] }));
      },
      
      // Teknisyen sil
      deleteTechnician: async (id) => {
        await fetch("/api/technicians", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });
        set((state) => ({ technicians: state.technicians.filter(t => t.id !== id) }));
      },
      
      // Tüm teknisyenleri sunucudan çek
      fetchTechnicians: async () => {
        try {
          const res = await fetch("/api/technicians");
          const data = await res.json();
          if (Array.isArray(data)) set({ technicians: data });
        } catch (e) {
          console.error("Teknisyenler çekilemedi:", e);
        }
      },

      // Sunucu bağlantı ayarları
      serverConfig: {
        host: "192.168.0.184",
        apiPort: "3000",
        token: "",
      },
      setServerConfig: (config) => set({ serverConfig: config }),
      
      // Canlı cihaz listesini sunucudan çek
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
