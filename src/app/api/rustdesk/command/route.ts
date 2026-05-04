import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const QUEUE_FILE = path.join(process.cwd(), "scripts", "command_queue.json");
const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { deviceId, action, command } = body;
        
        if (!deviceId) {
            return NextResponse.json({ success: false, message: "ID Required" });
        }

        let finalCommand = "";
        if (action === "restart") finalCommand = "shutdown /r /t 5 /f";
        else if (action === "shutdown") finalCommand = "shutdown /s /t 5 /f";
        else if (action === "lock") finalCommand = "lock";
        else if (action === "refresh") finalCommand = "refresh_info";
        else if (action === "terminal") finalCommand = command || "";

        if (!finalCommand) {
            return NextResponse.json({ success: false, message: "No Command" });
        }

        let hostname = String(deviceId);
        if (fs.existsSync(INFO_FILE)) {
            try {
                const info = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8"));
                if (info[deviceId] && info[deviceId].hostname) {
                    hostname = info[deviceId].hostname.toUpperCase();
                }
            } catch (e) { }
        }

        let queue: Record<string, string[]> = {};
        if (fs.existsSync(QUEUE_FILE)) {
            try {
                queue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
            } catch (e) { }
        }

        if (!queue[hostname]) queue[hostname] = [];
        queue[hostname].push(finalCommand);

        fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));

        return NextResponse.json({ success: true, message: "Queued" });

    } catch (error) {
        return NextResponse.json({ success: false, message: "Error" });
    }
}
