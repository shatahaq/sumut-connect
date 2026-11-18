# Panduan demonstrasi

Buka [SUMUT CONNECT](https://shatahaq.github.io/sumut-connect/).

1. Pada **Peta**, ganti **Peta dasar** antara OpenStreetMap dan CARTO Positron. Pilihan batas lokal tersedia ketika ubin gagal.
2. Pilih **Kota Medan**. Aktifkan **Kesehatan** dan matikan kategori lain. Cari nama fasilitas atau ketik “rumah sakit”. Klik hasil untuk memusatkan peta dan buka simbol untuk melihat popup.
3. Pada **Alat**, pilih **Ukur jarak** dan klik minimal dua titik. **Ukur luas** membutuhkan tiga titik atau lebih sesuai urutan batas. **Tambah titik** menandai lokasi sementara. **Urungkan titik** membatalkan simpul terakhir. **Atur ulang** mengembalikan cakupan awal.
4. **Lokasi saya** memakai izin perangkat lewat HTTPS atau localhost. Pada **Akses**, pilih pusat lewat klik atau isi lintang 3,5952 dan bujur 98,6722. Isi 5 km, pilih Kesehatan, dan jalankan analisis.
5. Buka **Ringkasan** untuk agregat lalu pilih **Lihat peta koroplet**. Ganti indikator dan pilih wilayah peta atau daftar.
6. **Bandingkan** menampilkan grafik, tabel dan selisih A − B. **Data** memuat penerbit, versi, lisensi, dan keterbatasan.

## Membuka QGIS

Buka gis/SUMUT_CONNECT.qgz di QGIS 3.44. Pertahankan GeoPackage pada folder yang sama. Panel lapisan memuat kabupaten/kota, tiga kategori, jalan utama, dan contoh radius. Aktifkan dua layer bernama Medan. Gunakan tabel atribut untuk mengurutkan distance_m. Layout **Atlas Sumatera Utara** tersedia di menu Project > Layouts.

Radius merupakan jarak garis lurus. Akses aktual dipengaruhi jaringan, perairan, moda, waktu tempuh, dan kapasitas. Wilayah dengan lebih banyak titik dapat mencerminkan pemetaan yang lebih aktif.
