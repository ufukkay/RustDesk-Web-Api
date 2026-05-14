import { safeReadJson, safeWriteJson } from "@/lib/fileUtils";
import crypto from "crypto";
import path from "path";

const INVITES_FILE = path.join(process.cwd(), "scripts", "invites.json");

export interface Invite {
  email: string;
  token: string;
  role: "Admin" | "Teknisyen";
  createdAt: string;
  expiresAt: string;
}

export function getInvites(): Invite[] {
  return safeReadJson<Invite[]>(INVITES_FILE, []);
}

export function saveInvites(invites: Invite[]): void {
  safeWriteJson(INVITES_FILE, invites);
}

export function createInvite(email: string, role: "Admin" | "Teknisyen" = "Teknisyen"): Invite {
  const token = crypto.randomBytes(32).toString("hex");
  const invite: Invite = {
    email,
    token,
    role,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const existing = getInvites().filter((i) => i.email !== email);
  saveInvites([...existing, invite]);

  return invite;
}

export function verifyInvite(token: string): Invite | null {
  const invites = getInvites();
  const invite = invites.find((i) => i.token === token);
  if (!invite) return null;

  if (new Date() > new Date(invite.expiresAt)) {
    saveInvites(invites.filter((i) => i.token !== token));
    return null;
  }

  return invite;
}

export function removeInvite(token: string): void {
  saveInvites(getInvites().filter((i) => i.token !== token));
}
