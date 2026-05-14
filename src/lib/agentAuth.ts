import { getSettings } from "@/lib/settings";

/**
 * Agent isteklerini doğrular.
 * settings.agentApiKey yapılandırılmışsa Authorization: Bearer <key> veya
 * X-Api-Key: <key> header'ı kontrol eder.
 * Anahtar yapılandırılmamışsa geçici olarak izin verir (geriye dönük uyumluluk).
 */
export function validateAgentKey(req: Request): boolean {
  const settings = getSettings();
  if (!settings.agentApiKey) return true;

  const authHeader = req.headers.get("authorization") || "";
  const key = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : (req.headers.get("x-api-key") || "");

  return key === settings.agentApiKey;
}
