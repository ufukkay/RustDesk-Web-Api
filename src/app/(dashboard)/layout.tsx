import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { SocketProvider } from "@/components/providers/SocketProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rd2-shell">
      <Sidebar />
      <div className="rd2-main">
        <Topbar />
        <main className="rd2-content">
          <SocketProvider>
            {children}
          </SocketProvider>
        </main>
      </div>
    </div>
  );
}
