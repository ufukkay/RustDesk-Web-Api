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
  smtpHost?: string;
  smtpPort?: string;
  smtpEmail?: string;
  smtpPassword?: string;
}

export function getSettings(): SystemSettings {
  console.log("Reading settings from:", SETTINGS_FILE);
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
      console.log("Settings file found, content length:", data.length);
      return JSON.parse(data);
    }
    console.log("Settings file not found, returning defaults");
  } catch (error) {
    console.error("Settings read error:", error);
  }
  return {
    host: "rmm.talay.com",
    port: "3000",
    defaultPassword: "",
    deviceNamePrefix: "SRP-",
    smtpHost: "smtp.rustdesk.local",
    smtpPort: "587",
    smtpEmail: "no-reply@rustdesk.local",
    smtpPassword: "apppassword"
  };
}

export function saveSettings(settings: SystemSettings) {
  console.log("Saving settings to:", SETTINGS_FILE);
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      console.log("Creating directory:", dir);
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    console.log("Settings saved successfully");
    return true;
  } catch (error) {
    console.error("Settings save error:", error);
    return false;
  }
}
