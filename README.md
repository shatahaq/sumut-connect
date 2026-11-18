# SUMUT CONNECT

Atlas WebGIS Tahap 1 untuk menelusuri fasilitas kesehatan, pendidikan, dan ekonomi di 33 kabupaten/kota Sumatera Utara. QGIS menyiapkan data, React dan Leaflet menyajikan peta, dan Express serta PostGIS menyediakan layanan spasial.

- [Demo GitHub Pages](https://shatahaq.github.io/sumut-connect/)
- [Panduan pengguna](docs/panduan.md)
- [Proses QGIS dan keterbatasan](gis/processing_log.md)
- [Kontrak API OpenAPI 3.1](docs/openapi.yaml)

## Menjalankan proyek

Gunakan Node.js 24 LTS. Jalankan `npm ci` lalu `npm run dev` dan buka alamat yang ditampilkan. Basemap daring memerlukan internet. Versi GitHub Pages memakai GeoJSON publikasi dari origin yang sama dan analisis radius Haversine di browser. Pilih batas wilayah lokal jika penyedia ubin gagal.

## Menjalankan WebGIS dan PostGIS lokal

```powershell
$env:VITE_API_BASE = '/api/v1'
npm run build
npm run api
```

Buka http://127.0.0.1:4174. Periksa PostGIS di http://127.0.0.1:4174/api/v1/health. Pada macOS/Linux jalankan `VITE_API_BASE=/api/v1 npm run build`. Jika menggunakan Vite tanpa API, hapus variabel VITE_API_BASE sebelum membangun ulang. Secara baku PGlite memuat ekstensi PostGIS dan mengimpor snapshot ke basis data dalam memori saat server mulai.

Untuk PostgreSQL mandiri, sediakan basis data khusus aplikasi dengan ekstensi PostGIS dan setel DATABASE_URL sebelum menjalankan API. Inisialisasi mengisi ulang tabel atlas secara transaksional. Untuk origin terpisah, setel VITE_API_BASE pada waktu build dan WEB_ORIGIN pada server. Atur HOST dan PORT bila diperlukan, dan gunakan HTTPS melalui reverse proxy untuk layanan daring. Konfigurasi rilis GitHub Pages tersedia di .github/workflows/pages.yml.

## Verifikasi

```sh
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Uji peramban memakai build statis. Microsoft Edge lokal dapat dipilih melalui BROWSER_CHANNEL=msedge. Uji integrasi memakai PostGIS melalui PGlite. Lihat [laporan pengujian](docs/pengujian.md).

## Berkas utama

| Lokasi | Isi |
| --- | --- |
| src/ | Peta, filter, statistik, radius, perbandingan, katalog |
| server/ | Express, migrasi PostGIS, impor GeoJSON, kueri spasial |
| public/data/ | GeoJSON EPSG:4326 siap publikasi dan metadata |
| gis/ | Proyek QGIS, GeoPackage, skrip, kamus dan manifest |
| docs/ | PRD, desain, panduan, API, serta bukti pengujian |
| tests/ | Uji unit, integrasi, dan alur peramban |

Batas disediakan geoBoundaries dengan atribusi BPS/WFP/OCHA ROAP dan lisensi CC BY 3.0 IGO. Titik dan jaringan berasal dari © OpenStreetMap contributors, ekstrak Geofabrik, ODbL 1.0. Periksa [manifest](gis/source_manifest.csv) dan [atribusi OpenStreetMap](https://www.openstreetmap.org/copyright).
