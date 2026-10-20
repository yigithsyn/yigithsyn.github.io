# Defter

Defter, `content/` klasöründeki HTML notlarını tarayıcıda görüntüleyen ve görselleri yerel diske yükleyip listeleyen küçük bir web uygulamasıdır. Arayüz statik HTML/CSS/JavaScript dosyalarından, API ise Express ve SQLite kullanan Node.js sunucusundan oluşur.

## Gereksinimler

- Node.js 22.5 veya üzeri (`node:sqlite` yerleşik modülü için)
- npm

## Kurulum ve çalıştırma

Sunucu bağımlılıklarını kurup API'yi başlatın:

```powershell
cd server
npm install
npm start
```

Sunucu varsayılan olarak `http://localhost:3000` adresinde çalışır. Başka bir port kullanmak için `PORT` ortam değişkenini ayarlayın.

Arayüzü proje kökündeki `index.html` dosyasını VS Code Live Server gibi bir statik dosya sunucusu üzerinden açarak kullanın. Arayüz, 3000 portunda sunulmuyorsa API isteklerini `http://localhost:3000` adresine gönderir. Express sunucusu arayüz dosyalarını değil, yüklenen görselleri sunar.

## Özellikler

- `content/` içindeki `.html` dosyalarını listeler ve seçilen sayfayı görüntüler.
- Sayfa listesinde başlık olarak ilk `<h4>` içeriğini kullanır; başlık bulunmazsa dosya adını gösterir.
- PNG, JPG/JPEG, GIF, WebP, BMP ve AVIF görsellerini en fazla 30 MB olacak şekilde yükler.
- Yükleme meta verilerini `server/defter.db` SQLite veritabanında saklar.
- Yüklenen görselleri `img/upload/` altında tutar ve arayüzden dosya yolunu kopyalamaya olanak verir.
- Görsel silme işlemi yalnızca veritabanı kaydını kaldırır; diskteki dosya korunur.
- İçerik arayüzünde yazdırma ve kenar menüsünü gizleme/gösterme kontrolleri bulunur.

## API

| Yöntem | Yol | Açıklama |
| --- | --- | --- |
| `GET` | `/api/content` | HTML içeriklerinin dosya adlarını ve başlıklarını listeler. |
| `GET` | `/api/content/:filename` | Belirtilen HTML dosyasının içeriğini döndürür. |
| `POST` | `/api/upload` | `multipart/form-data` içindeki `image` alanından tek görsel yükler. `lastModified` alanı isteğe bağlıdır. |
| `GET` | `/api/uploads` | Yükleme kayıtlarını en yeniden eskiye listeler. |
| `GET` | `/api/uploads/:id` | ID'ye ait tek yükleme kaydını döndürür. |
| `DELETE` | `/api/uploads/:id` | Yükleme kaydını siler, görsel dosyasını silmez. |
| `GET` | `/img/upload/:filename` | Yüklenen görsel dosyasını sunar. |

Görsel yükleme başarılı olduğunda `201` yanıtı ve dosyanın göreli URL'si döner. Geçersiz isteklerde açıklayıcı hata mesajları, bulunamayan içerik veya kayıtlar için `404` yanıtı verilir.

## Proje yapısı

```text
.
├── content/       # Tarayıcıda gösterilen HTML notları
├── css/           # Arayüz, görsel yükleme ve yazdırma stilleri
├── img/upload/    # Yüklenen görseller
├── js/            # Arayüz ve görsel yükleme kodu
├── server/
│   ├── index.js   # Express API sunucusu
│   └── defter.db  # İlk çalıştırmada oluşturulan SQLite veritabanı
└── index.html     # Uygulama arayüzü
```
