import { Topbar } from "@/components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50">
      <Topbar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
