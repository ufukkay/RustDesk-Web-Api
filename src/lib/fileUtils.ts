import fs from "fs";
import path from "path";

/**
 * JSON dosyayı güvenli okur. Parse hatası veya dosya yoksa defaultValue döner.
 */
export function safeReadJson<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * JSON dosyayı atomic yazar: önce .tmp dosyasına yazar, sonra rename eder.
 * Bu sayede yarım yazılan dosya corruption'ına karşı koruma sağlar.
 */
export function safeWriteJson(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmpPath, filePath);
}
