import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rd2-shell min-h-screen bg-bg">
      <Sidebar />
      <div className="rd2-main min-h-screen overflow-hidden">
        <Topbar />
        <main className="rd2-content overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
