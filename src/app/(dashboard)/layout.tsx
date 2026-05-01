import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex z-10 shadow-sm border-r border-slate-200">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 scroll-smooth">
          <div className="mx-auto max-w-7xl h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
