"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAppStore } from "@/lib/store";

/**
 * Dashboard genelinde tek bir Socket.IO bağlantısı tutar.
 * - device_status   → store'daki cihaz online/offline durumunu anlık günceller
 * - telemetry_update → store'daki cihaz donanım verisini anlık günceller
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { updateDeviceStatus, updateDeviceTelemetry } = useAppStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io({
      query: { type: "dashboard" },
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => {
      console.log("[Socket] Dashboard bağlandı:", socket.id);
    });

    socket.on("device_status", (data: { deviceId: string; status: "online" | "offline" }) => {
      if (data?.deviceId) updateDeviceStatus(data.deviceId, data.status);
    });

    socket.on("telemetry_update", (data: { deviceId: string; data: Record<string, unknown> }) => {
      if (data?.deviceId && data?.data) {
        updateDeviceTelemetry(data.deviceId, data.data as any);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Bağlantı kesildi:", reason);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [updateDeviceStatus, updateDeviceTelemetry]);

  return <>{children}</>;
}
