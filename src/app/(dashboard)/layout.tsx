import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";

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
          {children}
        </main>
      </div>
    </div>
  );
}
