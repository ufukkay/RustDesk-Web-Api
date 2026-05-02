import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const QUEUE_FILE = path.join(process.cwd(), "scripts", "command_queue.json");
  const RESULTS_FILE = path.join(process.cwd(), "scripts", "command_results.json");
  const INFO_FILE = path.join(process.cwd(), "scripts", "device_info.json");

  const data: any = {
    time: new Date().toLocaleString(),
    queue: {},
    results: {},
    devices: {}
  };

  if (fs.existsSync(QUEUE_FILE)) data.queue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
  if (fs.existsSync(RESULTS_FILE)) data.results = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf-8"));
  if (fs.existsSync(INFO_FILE)) data.devices = JSON.parse(fs.readFileSync(INFO_FILE, "utf-8"));

  return NextResponse.json(data);
}
