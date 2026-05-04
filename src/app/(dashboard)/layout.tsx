import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F7F7F5] rd2-shell">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#F7F7F5] rd2-main">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto rd2-content">
          {children}
        </main>
      </div>
    </div>
  );
}
