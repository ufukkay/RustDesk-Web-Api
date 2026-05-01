# RustDesk Teknisyen Portalı (Web API)

Bu proje, RustDesk altyapınız için modern, hızlı ve kullanıcı dostu bir yönetim arayüzüdür.

## Özellikler
- ✅ **Dashboard:** Anlık cihaz ve teknisyen durumu.
- ✅ **Cihaz Yönetimi:** Cihaz listeleme ve doğrudan bağlantı.
- ✅ **Teknisyen Yönetimi:** Rol bazlı kullanıcı kontrolü.
- ✅ **Sistem Ayarları:** SMTP yapılandırması ve Mail logları.
- ✅ **Güncelleme Modülü:** GitHub üzerinden otomatik sürüm kontrolü.

## 🚀 Ubuntu Sunucu Kurulumu

### 1. Node.js Kurulumu
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Projeyi Klonlayın
```bash
git clone https://github.com/ufukkay/RustDesk-Web-Api.git
cd RustDesk-Web-Api
```

### 3. Bağımlılıkları Kurun ve Derleyin
```bash
npm install
npm run build
```

### 4. PM2 ile Sürekli Çalıştırın
```bash
sudo npm install -g pm2
pm2 start npm --name "rustdesk-portal" -- start
pm2 save
pm2 startup
```

## Geliştirme
Yerel makinede çalıştırmak için:
```bash
npm install
npm run dev
```

---
© 2025 RustDesk Teknisyen Portalı
