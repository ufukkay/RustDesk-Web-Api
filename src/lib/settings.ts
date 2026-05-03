import fs from "fs";
import path from "path";

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
}

export function getSettings(): SystemSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
    }
  } catch (error) {
    console.error("Settings read error:", error);
  }
  return {
    host: "192.168.0.184",
    port: "3000",
    defaultPassword: "",
    deviceNamePrefix: "SRP-"
  };
}

export function saveSettings(settings: SystemSettings) {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error("Settings save error:", error);
    return false;
  }
}
