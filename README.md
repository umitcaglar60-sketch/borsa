# Sirius Piyasa Analizi — API Proxy (PHP / XAMPP)

Bu klasör, uygulamanın API anahtarlarını (RapidAPI, NosyAPI, Groq) tarayıcıya/telefona
hiç göndermeden kullanmasını sağlayan sunucu tarafı proxy'dir.

## Kurulum (cmd)

1. Bu klasörü olduğu gibi kopyala:
   ```
   xcopy /E /I piyasa-api C:\xampp\htdocs\piyasa-api
   ```
   (veya klasörü doğrudan `C:\xampp\htdocs\piyasa-api` içine sürükle-bırak.)

2. XAMPP Control Panel'den **Apache**'yi başlat.

3. Test et:
   ```
   start http://localhost/piyasa-api/health.php
   ```
   Tarayıcıda şuna benzer bir JSON görmelisin:
   ```json
   {"ok":true,"message":"Proxy çalışıyor","keys_loaded":{"rapidapi":true,"nosyapi":true,"groq":true,"metalsdev":false}}
   ```

## Uç noktalar (endpoints)

| Endpoint | Yöntem | Açıklama |
|---|---|---|
| `/health.php` | GET | Proxy ayakta mı, anahtarlar yüklendi mi kontrolü |
| `/bist100.php` | GET | Tüm BIST100 listesi (RapidAPI) |
| `/nosyapi.php?code=THYAO` | GET | Tek hisse fiyatı (NosyAPI) |
| `/financebird.php?code=THYAO` | GET | Yedek BIST kaynağı (RapidAPI) |
| `/metalsdev.php?metal=platinum` | GET | Platin/paladyum spot fiyatı (opsiyonel key gerekir) |
| `/groq.php` | POST | AI piyasa analizi (body'yi olduğu gibi Groq'a iletir) |

## React tarafında değişiklik

`piyasa-analiz-v2.jsx` içinde şu satırları değiştir:

```js
// ÖNCE:
fetch(`https://bist100-....p.rapidapi.com/bist100/prices`, { headers: {...rapidKey...} })

// SONRA:
fetch(`http://localhost/piyasa-api/bist100.php`)
```

Aynı mantık `nosyapi.php`, `groq.php` için de geçerli — `rapidKey`/`nosyKey`/`groqKey`
state'lerine ve giriş kutularına artık ihtiyacın kalmıyor, backend hallediyor.

## Telefonda test (aynı WiFi)

```
ipconfig
```
çıktısındaki IPv4 adresini (örn. `192.168.1.24`) kullanarak React kodundaki
`http://localhost/...` yerine `http://192.168.1.24/piyasa-api/...` yaz.

## Güvenlik notu

- `config.php` içindeki anahtarlar gerçek ve çalışır durumda — bu dosyayı asla
  GitHub'a, herkese açık bir yere veya paylaşılan bir klasöre koyma.
- `cors.php` içindeki `Access-Control-Allow-Origin: *` geliştirme için ayarlandı;
  gerçek kullanıcıların olacağı bir sürümde bunu kendi domain'ine daraltmalısın.
