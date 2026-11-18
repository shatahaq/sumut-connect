# Pengolahan dan validasi QGIS

QGIS 3.44.15 · EPSG:4326 · 18 November 2026

| Lapisan | Versi | Hasil |
| --- | --- | --- |
| Kabupaten/kota | IDN-ADM2-22746128, observasi 2020 | 33 geometri valid |
| Kesehatan | OSM 17 November 2026, 21:24:30 UTC | 306 rumah sakit, klinik, dan praktik dokter |
| Pendidikan | Snapshot OSM yang sama | 951 sekolah dan perguruan tinggi |
| Ekonomi | Snapshot OSM yang sama | 405 pasar dan bank |
| Jaringan utama | Snapshot OSM yang sama | 6.849 segmen terklip |
| Radius Medan 5 km | Geodesik WGS84 | 619 titik · 135 kesehatan, 319 pendidikan, 165 ekonomi |

## Reproduksi

1. Unduh GeoJSON ADM2 dari metadata geoBoundaries dan PBF Sumatra dari Geofabrik. Simpan sebagai adm2.geojson dan sumatra.osm.pbf di direktori input. Pakai [batas rilis 9469f09](https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/IDN/ADM2/geoBoundaries-IDN-ADM2.geojson) dan [PBF 17 November 2026](https://download.geofabrik.de/asia/indonesia/sumatra-261117.osm.pbf) untuk mereproduksi snapshot. Tautan latest dapat menghasilkan data yang lebih baru.
2. Dengan Python QGIS dan paket osmium, jalankan `python gis/extract_osm.py INPUT/sumatra.osm.pbf INPUT`. Ambil node dan way dengan amenity terpilih dan kelas jalan utama serta link.
3. Jalankan `python gis/prepare.py INPUT` dengan Python QGIS. Untuk penggunaan tanpa GUI, setel QT_QPA_PLATFORM=offscreen. Pilih 33 ADM2, normalkan kode, validasi geometri, dan ubah tapak menjadi titik. Lakukan gabung spasial dengan indeks dan predikat intersects.
4. Dari 2.995 kandidat titik, 1.297 berada di luar referensi dan 36 duplikat nama/kategori/subtipe dalam 60 m dikeluarkan. Sebanyak 1.662 ID unik dipertahankan, termasuk 120 tanpa nama. Tapak menjadi titik interior dan way terbuka memakai titik tengah.
5. Klip 6.849 segmen jalan ke gabungan batas; panjang dihitung geodesik WGS84. Agregat jumlah per wilayah berasal dari spatial join. Batas penuh disimpan di GeoPackage, GeoJSON menggunakan penyederhanaan sekitar 0,00065° untuk tampilan.
6. Tarik 360 azimut dari pusat bujur 98,6722, lintang 3,5952 dan pilih titik dengan jarak WGS84 ≤ 5.000 m. Web memakai bola Haversine. Titik dekat ambang dapat berpindah klasifikasi karena metode bumi bulat dan elipsoidal berbeda.
7. Jalankan `python gis/layout.py` dengan Python QGIS untuk membangun layout proyek dan ekspor PDF/PNG. Pada Windows gunakan platform Qt bawaan agar font cetak tersedia. Jalankan `python gis/verify.py .` dari akar proyek untuk memeriksa hasil. Lihat validation.json untuk jumlah pengolahan.

Kelengkapan data OSM beragam. Fasilitas dari relasi OSM dan kelas amenity lain tidak termasuk. Duplikat tanpa nama atau salah label mungkin masih ada. Referensi batas dan fasilitas berbeda periode. Jaringan jalan terbatas pada jalur utama dan belum divalidasi untuk perutean. Kajian kebutuhan layanan memerlukan data penduduk, kapasitas, dan verifikasi.

- Batas · geoBoundaries, BPS, WFP, OCHA ROAP · [metadata ADM2](https://www.geoboundaries.org/api/current/gbOpen/IDN/ADM2/) · [CC BY 3.0 IGO](https://creativecommons.org/licenses/by/3.0/igo/).
- Titik, jaringan, analisis turunan · [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright), [ekstrak Geofabrik](https://download.geofabrik.de/asia/indonesia/sumatra.html) · ODbL 1.0.
