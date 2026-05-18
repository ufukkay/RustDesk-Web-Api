import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getOrCreateAgentApiKey } from "@/lib/settings";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "scripts", "agent", "setup.ps1");
    if (!fs.existsSync(filePath)) {
      return new NextResponse("Agent script not found", { status: 404 });
    }

    const agentApiKey = getOrCreateAgentApiKey();
    const script = fs.readFileSync(filePath, "utf-8")
      .replace("AGENT_API_KEY_PLACEHOLDER", agentApiKey);

    return new NextResponse(script, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
