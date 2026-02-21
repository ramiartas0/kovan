# Kovan

Kovan, Laragon benzeri bir yerel geliştirme ortamını Electron + React ile sunan, çapraz platform masaüstü uygulamasıdır.

## Özellikler

- Servis yönetimi: Apache, Nginx, MySQL, PostgreSQL, Redis gibi servisleri başlatma/durdurma ve durum izleme
- Proje yönetimi: Yerel projeleri ekleme, framework tespiti, şablondan proje oluşturma
- Eklenti yönetimi: Eklenti listeleme, yükleme/kaldırma, etkinleştirme/devre dışı bırakma
- Sistem bilgisi: CPU, RAM, disk ve çalışma süresi takibi
- Ayarlar: Tema, vurgu rengi, başlangıç davranışı ve geliştirme ayarları
- SQLite tabanlı kalıcı ayar/veri yönetimi

## Teknoloji Yığını

- Electron 28
- React 18 + React Router
- TypeScript
- Vite 5
- better-sqlite3

## Gereksinimler

- Node.js `>=18.0.0 <=20.0.0`
- npm `>=8.0.0`

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
npm run dev
```

Bu komut:
- Main process için TypeScript derler ve Electron'u başlatır
- Renderer tarafında Vite dev server'ı `http://localhost:3001` üzerinde çalıştırır

## Build ve Paketleme

```bash
npm run build
```

Platform paketleri:

```bash
npm run dist:win
npm run dist:mac
npm run dist:linux
```

## Yararlı Komutlar

```bash
npm run lint
npm run lint:fix
npm run type-check
npm run test
npm run clean
```

## Proje Yapısı

```text
src/
  main/              # Electron main process
    services/        # ServiceManager, ProjectManager, PluginManager, DatabaseManager
  renderer/          # React arayüzü (pages, components, hooks)
  services/          # Paylaşılan/alternatif service dosyaları
  types/             # Tip tanımları
vite.config.ts       # Renderer build/dev ayarları
```

## Veri ve Konfigürasyon

Uygulama kullanıcı verilerini işletim sistemi kullanıcı dizini altında `.kovan` klasöründe saklar (servis, proje, eklenti ve ayar dosyaları).

## Lisans

MIT
