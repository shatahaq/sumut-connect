# Laporan pengujian rilis Tahap 1

18 November 2026 · QGIS 3.44.15 · React/Leaflet · Express/PostGIS

## Data dan API

| Pemeriksaan | Bukti |
| --- | --- |
| QGIS portabel | SUMUT_CONNECT.qgz membuka tujuh layer dengan jalur GeoPackage relatif. QGIS memuat proyek melalui MCP. Uji yang sama diulang pada salinan paket. |
| Integritas | Tiga GeoPackage lulus PRAGMA integrity_check dan foreign_key_check. Geometri 33 wilayah dan 6.849 segmen jalan valid. |
| Spatial join | 1.662 ID unik. Setiap titik beririsan dengan poligon wilayahnya. Jumlah kategori per wilayah dan koordinat publik cocok dengan keluaran GeoPackage. |
| Radius QGIS | Pusat [98,6722° BT; 3,5952° LU], WGS84, 5.000 m. 619 titik dan jarak per titik diverifikasi ulang. |
| Unit dan integrasi | Enam uji lulus. Cakupan meliputi Haversine, antimeridian, luas, cincin, agregat pada engine PostGIS, filter, pagination, radius, nearest, dan perbandingan. |
| Build dan dokumen API | Pemeriksaan TypeScript dan build produksi lulus. OpenAPI 3.1 mencakup 13 path. |
| Dependensi runtime | npm audit --omit=dev mengembalikan nol temuan saat pemeriksaan. |

## Browser

Alur utama diuji pada Chrome, Microsoft Edge, dan Firefox desktop. Tampilan ponsel 375 px diuji dengan emulasi viewport. Uji pemulihan memakai permintaan jaringan yang sengaja diblokir untuk memeriksa pesan dan tindakan pemulihan.

1. Peta, basemap, legenda, filter wilayah dan kategori, pencarian, marker, popup, pengukuran, penambahan titik, penghapusan titik, pengaturan ulang, dan geolokasi.
2. Akses via klik peta dan koordinat, radius valid dan di luar rentang, koroplet, tabel perbandingan, metadata, dan fokus keyboard.
3. Muat ulang setelah kegagalan data, batas vektor saat peta dasar gagal, radius tanpa hasil, dan pengukuran overflow pada lebar 320, 375, 820, 1024, serta 1440 px.

Tangkapan layar [desktop](screenshots/01-peta-desktop.png), [ponsel](screenshots/02-peta-ponsel.png), [radius](screenshots/03-akses.png), [perbandingan](screenshots/04-bandingkan.png), [layout QGIS](screenshots/Peta-Tematik-QGIS.pdf), dan [koroplet](screenshots/06-koroplet.png) merekam hasil aktual. Demo publik diakses melalui GitHub Pages. [Demo](https://shatahaq.github.io/sumut-connect/) · [Riwayat build dan publikasi](https://github.com/shatahaq/sumut-connect/actions).

## Batas verifikasi

Pengujian responsif menggunakan viewport desktop, tablet, dan ponsel yang diemulasi. Target LCP/INP persentil ke-75, latensi API p95 dan pengujian perangkat fisik belum diukur. Demo publik menjalankan analisis statis. Integrasi API diuji secara lokal dengan PostgreSQL/PostGIS melalui PGlite. Pemasangan pada server PostgreSQL mandiri tersedia melalui DATABASE_URL. Makna indikator dan keterbatasan snapshot dijelaskan pada katalog serta catatan QGIS.
