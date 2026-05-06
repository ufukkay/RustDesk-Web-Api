import fs from "fs";
import path from "path";
import crypto from "crypto";

const INVITES_FILE = path.join(process.cwd(), "scripts", "invites.json");

export interface Invite {
  email: string;
  token: string;
  role: "Admin" | "Teknisyen";
  createdAt: string;
  expiresAt: string;
}

export function getInvites(): Invite[] {
  try {
    if (fs.existsSync(INVITES_FILE)) {
      return JSON.parse(fs.readFileSync(INVITES_FILE, "utf-8"));
    }
  } catch (error) {
    console.error("Invites read error:", error);
  }
  return [];
}

export function saveInvites(invites: Invite[]) {
  try {
    const dir = path.dirname(INVITES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(INVITES_FILE, JSON.stringify(invites, null, 2));
    return true;
  } catch (error) {
    console.error("Invites save error:", error);
    return false;
  }
}

export function createInvite(email: string, role: "Admin" | "Teknisyen" = "Teknisyen"): Invite {
  const token = crypto.randomBytes(32).toString("hex");
  const invite: Invite = {
    email,
    token,
    role,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  };

  const invites = getInvites();
  // Remove any previous invite for this email
  const filtered = invites.filter(i => i.email !== email);
  saveInvites([...filtered, invite]);

  return invite;
}

export function verifyInvite(token: string): Invite | null {
  const invites = getInvites();
  const invite = invites.find(i => i.token === token);
  
  if (!invite) return null;
  
  const now = new Date();
  if (now > new Date(invite.expiresAt)) {
    // Expired, remove it
    saveInvites(invites.filter(i => i.token !== token));
    return null;
  }
  
  return invite;
}

export function removeInvite(token: string) {
  const invites = getInvites();
  saveInvites(invites.filter(i => i.token !== token));
}
