import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STAGES = [
  { key: "start",   label: "Güncelleme hazırlanıyor",       icon: "⚙️",  step: 1 },
  { key: "fetch",   label: "Git'ten kod çekiliyor",         icon: "📥",  step: 2 },
  { key: "install", label: "Bağımlılıklar yükleniyor",      icon: "📦",  step: 3 },
  { key: "build",   label: "Proje derleniyor",              icon: "🔨",  step: 4 },
  { key: "restart", label: "Servis yeniden başlatılıyor",   icon: "🔄",  step: 5 },
  { key: "done",    label: "Güncelleme tamamlandı",         icon: "✅",  step: 6 },
];

export async function GET() {
  try {
    const logFile = path.join(process.cwd(), "update.log");

    if (!fs.existsSync(logFile)) {
      return NextResponse.json({ status: "idle" });
    }

    const content = fs.readFileSync(logFile, "utf-8");
    const lines = content.split("\n").filter(Boolean);

    if (content.includes("DEPLOY_COMPLETE")) {
      return NextResponse.json({
        status: "done",
        stage: STAGES[5],
        progress: 100,
        logs: lines.slice(-10),
      });
    }

    const errorLine = lines.find((l) => l.includes("[HATA]"));
    if (errorLine) {
      return NextResponse.json({
        status: "error",
        message: errorLine,
        logs: lines.slice(-10),
      });
    }

    let currentStage = STAGES[0];
    for (const stage of STAGES) {
      if (content.includes(`[STAGE:${stage.key}]`)) {
        currentStage = stage;
      }
    }

    const progress = Math.round((currentStage.step / STAGES.length) * 100);

    return NextResponse.json({
      status: "running",
      stage: currentStage,
      progress,
      logs: lines.slice(-10),
    });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
