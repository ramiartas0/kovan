# 🐝 Kovan - Laragon'dan Daha İyi Lokal Geliştirme Deneyimi!

**Kovan**, modern web geliştirme için tasarlanmış, Laragon'dan daha gelişmiş bir lokal geliştirme ortamıdır. Cross-platform desteği, modern UI, gelişmiş servis yönetimi ve plugin sistemi ile geliştiricilere üstün bir deneyim sunar.

## ✨ Tamamlanan Özellikler

### 🎨 Modern Kullanıcı Arayüzü

- **Dark/Light Theme**: Modern ve göz yormayan tema sistemi
- **Responsive Design**: Tüm ekran boyutlarında mükemmel görünüm
- **Intuitive Navigation**: Kolay kullanılabilir sidebar menü
- **Real-time Updates**: Canlı sistem bilgileri ve servis durumları

### 📊 Dashboard

- **System Monitoring**: CPU, RAM, Disk kullanımı ve uptime
- **Quick Stats**: Toplam proje, çalışan servis ve aktif plugin sayısı
- **Health Indicators**: Sistem sağlığı göstergeleri
- **Quick Actions**: Hızlı erişim butonları

### 📁 Proje Yönetimi

- **Smart Detection**: Otomatik framework ve proje tipi tespiti
- **File System Integration**: Gerçek dosya sistemi entegrasyonu
- **Project Templates**: Hazır proje şablonları
- **Quick Access**: Proje klasörlerini tek tıkla açma

### ⚙️ Servis Yönetimi

- **Multiple Services**: Apache, Nginx, MySQL, PostgreSQL, Redis, Memcached
- **Real-time Status**: Canlı servis durumu takibi
- **Process Management**: Gerçek process yönetimi
- **Port Monitoring**: Port kullanım kontrolü

### 🔌 Plugin Sistemi

- **Extensible Architecture**: Genişletilebilir plugin mimarisi
- **Built-in Plugins**: Database Manager, Code Editor, System Monitor
- **Easy Management**: Kolay kurulum ve yönetim
- **Category Support**: Kategorilere göre düzenleme

### ⚙️ Ayarlar Yönetimi

- **Comprehensive Settings**: Kapsamlı ayar seçenekleri
- **Persistent Storage**: Ayarların kalıcı saklanması
- **Category Organization**: Kategorilere göre düzenleme
- **Real-time Updates**: Anlık ayar değişiklikleri

### 🔧 Teknik Altyapı

- **Electron + React**: Modern desktop uygulama teknolojileri
- **TypeScript**: Tip güvenliği ve geliştirici deneyimi
- **IPC Communication**: Güvenli main-renderer iletişimi
- **File System API**: Gerçek dosya sistemi entegrasyonu
- **Process Management**: Gerçek servis process yönetimi
- **Cross-platform**: Windows, macOS, Linux desteği

## 🚀 Gelecek Özellikler

### 🔄 Otomatik Güncelleme Sistemi

- Servis versiyonlarının otomatik güncellenmesi
- Uygulama güncellemeleri
- Güvenlik yamaları

### 🐳 Docker Entegrasyonu

- Container tabanlı geliştirme ortamları
- Docker Compose desteği
- Kubernetes entegrasyonu

### ☁️ Bulut Yedekleme

- Proje ve veritabanı yedekleme
- Cloud storage entegrasyonu
- Otomatik yedekleme zamanlaması

### 🔐 SSL Yönetimi

- Let's Encrypt entegrasyonu
- Self-signed sertifika oluşturma
- Otomatik SSL yenileme

### 📈 Gelişmiş İzleme

- Detaylı performans metrikleri
- Log analizi
- Hata raporlama

## 🛠️ Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn
- Git

### Adımlar

1. **Projeyi klonlayın:**

```bash
git clone https://github.com/ramiartas0/kovan.git
cd kovan
```

2. **Bağımlılıkları yükleyin:**

```bash
npm install
```

3. **Geliştirme modunda çalıştırın:**

```bash
# Renderer'ı build edin
npm run build:renderer

# Main process'i çalıştırın
npm run dev:main
```

4. **Production build:**

```bash
npm run build
npm run dist
```

## 📖 Kullanım

### Dashboard

Ana sayfa sistem genel durumunu gösterir:

- CPU, RAM, Disk kullanımı
- Çalışan servis sayısı
- Aktif plugin sayısı
- Hızlı erişim butonları

### Projeler

- **Proje Ekleme**: "Proje Ekle" butonu ile klasör seçin
- **Otomatik Tespit**: Framework ve proje tipi otomatik tespit edilir
- **Proje Açma**: Proje kartına tıklayarak klasörü açın
- **Proje Silme**: Çöp kutusu ikonuna tıklayarak projeyi kaldırın

### Servisler

- **Servis Başlatma**: Yeşil "Başlat" butonuna tıklayın
- **Servis Durdurma**: Kırmızı "Durdur" butonuna tıklayın
- **Durum Takibi**: Canlı servis durumu göstergeleri
- **Port Kontrolü**: Port çakışması uyarıları

### Eklentiler

- **Eklenti Kurma**: "Yeni Eklenti Kur" ile eklenti ekleyin
- **Eklenti Yönetimi**: Etkinleştirme/devre dışı bırakma
- **Kategori Filtreleme**: Kategorilere göre filtreleme
- **Arama**: Eklenti arama özelliği

### Ayarlar

- **Genel Ayarlar**: Uygulama davranışı
- **Servis Ayarları**: Port ve otomatik başlatma
- **Görünüm Ayarları**: Tema ve renk seçenekleri
- **Geliştirme Ayarları**: Proje yolu ve framework ayarları

## 🏗️ Proje Yapısı

```
kovan/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── main.ts          # Ana uygulama dosyası
│   │   ├── preload.ts       # Preload script
│   │   └── services/        # Servis yöneticileri
│   │       ├── ServiceManager.ts
│   │       ├── ProjectManager.ts
│   │       └── PluginManager.ts
│   └── renderer/            # React renderer process
│       ├── src/
│       │   ├── components/  # React bileşenleri
│       │   ├── pages/       # Sayfa bileşenleri
│       │   └── App.tsx      # Ana uygulama bileşeni
│       └── index.html       # HTML template
├── dist/                    # Build çıktıları
├── assets/                  # Statik dosyalar
└── package.json            # Proje konfigürasyonu
```

## 🔧 Geliştirme

### Scripts

- `npm run dev:main`: Main process'i geliştirme modunda çalıştır
- `npm run dev:renderer`: Renderer'ı geliştirme modunda çalıştır
- `npm run build:renderer`: Renderer'ı production için build et
- `npm run build`: Tüm projeyi build et
- `npm run dist`: Electron uygulamasını paketle

### API Entegrasyonu

Uygulama `window.kovanAPI` üzerinden main process'e erişir:

- `kovanAPI.services.*`: Servis yönetimi
- `kovanAPI.projects.*`: Proje yönetimi
- `kovanAPI.plugins.*`: Plugin yöneti mi
- `kovanAPI.system.*`: Sistem bilgileri
- `kovanAPI.settings.*`: Ayarlar yönetimi
- `kovanAPI.file.*`: Dosya işlemleri

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🙏 Teşekkürler

- [Electron](https://electronjs.org/) - Cross-platform desktop uygulama framework'ü
- [React](https://reactjs.org/) - UI kütüphanesi
- [Vite](https://vitejs.dev/) - Build tool
- [TypeScript](https://www.typescriptlang.org/) - Tip güvenliği

---

**Kovan** ile geliştirme deneyiminizi bir üst seviyeye taşıyın! 🚀
