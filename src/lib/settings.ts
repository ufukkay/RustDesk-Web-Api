import { safeReadJson, safeWriteJson } from "@/lib/fileUtils";
import path from "path";
import crypto from "crypto";

const SETTINGS_FILE = path.join(process.cwd(), "scripts", "settings.json");

export interface SystemSettings {
  host: string;
  port: string;
  idServer?: string;
  relayServer?: string;
  apiServer?: string;
  serverKey?: string;
  defaultPassword?: string;
  deviceNamePrefix?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpEmail?: string;
  smtpPassword?: string;
  /** Agent'ların heartbeat/sysinfo isteklerinde göndermesi gereken paylaşımlı API anahtarı */
  agentApiKey?: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  host: "rmm.talay.com",
  port: "3000",
  defaultPassword: "",
  deviceNamePrefix: "SRP-",
  smtpHost: "",
  smtpPort: "587",
  smtpEmail: "",
  smtpPassword: "",
  agentApiKey: "",
};

export function getSettings(): SystemSettings {
  const stored = safeReadJson<SystemSettings>(SETTINGS_FILE, DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings: SystemSettings): boolean {
  try {
    safeWriteJson(SETTINGS_FILE, settings);
    return true;
  } catch (error) {
    console.error("[Settings] Kayıt hatası:", error);
    return false;
  }
}

/**
 * Mevcut agentApiKey'i döner. Eğer henüz yoksa otomatik üretir ve kaydeder.
 */
export function getOrCreateAgentApiKey(): string {
  const settings = getSettings();
  if (settings.agentApiKey) return settings.agentApiKey;

  const key = crypto.randomBytes(32).toString("hex");
  saveSettings({ ...settings, agentApiKey: key });
  return key;
}
