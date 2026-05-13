import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const projectRoot = process.cwd();
    const logFile = path.join(projectRoot, "update.log");

    fs.writeFileSync(logFile, `[${new Date().toISOString()}] [STAGE:start] Güncelleme başlatıldı...\n`);

    // Önce build, sonra restart — 502 penceresini minimuma indir
    const steps = [
      `echo "[STAGE:fetch] [$(date)] Git kodu çekiliyor..."`,
      `git fetch --all`,
      `git reset --hard origin/main`,
      `echo "[STAGE:install] [$(date)] Bağımlılıklar yükleniyor..."`,
      `npm install --legacy-peer-deps`,
      `echo "[STAGE:build] [$(date)] Proje derleniyor (2-3 dakika)..."`,
      `npm run build`,
      `echo "[STAGE:restart] [$(date)] Servis yeniden başlatılıyor..."`,
      // touch ile nginx'e maintenance flag ver, pm2 restart bitince kaldır
      `touch /tmp/rmm_maintenance`,
      `(pm2 restart all || pm2 restart rustdesk-portal) && sleep 5 && rm -f /tmp/rmm_maintenance || rm -f /tmp/rmm_maintenance`,
      `echo "[STAGE:done] [$(date)] DEPLOY_COMPLETE"`,
    ].join(" && ");

    const fullCommand = `(${steps}) >> ${logFile} 2>&1 &`;

    exec(fullCommand, { shell: "/bin/bash" }, (error) => {
      if (error) {
        fs.appendFileSync(logFile, `[HATA] ${error.message}\n`);
      }
    });

    return NextResponse.json({
      success: true,
      message: "Güncelleme başlatıldı.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
