export default function TechniciansPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Teknisyenler</h1>
        <p className="text-slate-500 font-medium">Sistemde yetkili olan teknisyenleri ve yöneticileri görüntüleyin.</p>
      </div>

      <div className="flex-1 flex items-center justify-center border border-slate-200 border-dashed rounded-xl bg-white shadow-sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Teknisyen Yönetimi Yakında</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">Bu modül üzerinden sisteme yeni teknisyenler ekleyebilecek ve yetkilendirmelerini yönetebileceksiniz.</p>
        </div>
      </div>
    </div>
  );
}
