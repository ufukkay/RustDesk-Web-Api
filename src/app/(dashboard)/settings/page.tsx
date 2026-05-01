export default function SettingsPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ayarlar</h1>
        <p className="text-slate-500 font-medium">Sistem, bağlantı ve API ayarlarını yapılandırın.</p>
      </div>

      <div className="flex-1 flex items-center justify-center border border-slate-200 border-dashed rounded-xl bg-white shadow-sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Sistem Ayarları Yakında</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">RustDesk API anahtarlarını, SMTP e-posta ayarlarını ve log konfigürasyonlarını buradan yönetebileceksiniz.</p>
        </div>
      </div>
    </div>
  );
}
