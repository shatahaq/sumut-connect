# SUMUT CONNECT
## Spesifikasi desain WebGIS Tahap 1

**Arah visual** · Atlas kerja Sumatera Utara. Peta regional, jalur, dan simbol fasilitas menjadi identitas visual. Energi 2/5, ritme 3/5, gerak 1/5.

### Susunan layar

- **Peta** adalah halaman awal. Judul menjawab apa dan di mana. Bilah navigasi pendek menautkan Peta, Ringkasan, Akses, Bandingkan, dan Data.
- **Peta desktop** memasangkan peta luas dengan panel pencarian, wilayah, lapisan, dan daftar fasilitas. Basemap dan alat ukur berada pada kepala peta. Legenda dan atribusi tetap terlihat.
- **Akses** memakai peta yang sama, dengan pusat dari klik peta, input koordinat, atau lokasi perangkat. Hasil menampilkan metode, jumlah, waktu, dan jarak.
- **Ringkasan** menampilkan total, distribusi per kategori, dan peralihan ke koroplet. **Bandingkan** menampilkan grafik batang dan tabel dua wilayah. **Data** menyimpan asal, versi, lisensi, cakupan, serta metode.
- **Ponsel** menyusun peta dan panel dalam satu kolom. Kontrol dekat peta tetap bisa disentuh, tabel dapat dibaca pada lebar 375 px, dan fokus keyboard terlihat.

### Warna dan tipografi

Kertas peta memakai latar #f7f5ee dan teks #202d27. Hijau #215548 menandai navigasi aktif dan tindakan utama. Merah bata, biru laut, dan oker membedakan kategori kesehatan, pendidikan, serta ekonomi, dengan bentuk lingkaran, persegi, dan belah ketupat. Koroplet memakai skala hijau berurutan, disertai rentang angka dan unit. Georgia memisahkan judul atlas dari label operasional berhuruf sans-serif sistem, tanpa permintaan font eksternal.

### Perilaku

Gunakan status muat, data kosong, data gagal, dan lokasi ditolak yang menyebut langkah berikutnya. Daftar hasil dan koordinat manual mendampingi peta bagi pengguna keyboard. Atribusi penyedia tetap tercantum ketika basemap diganti. Gunakan area sentuh setidaknya 44 px untuk kontrol utama serta hormati preferensi reduced motion. Nama kosong, cakupan pemetaan, dan versi sumber harus tampak dalam detail yang relevan.

Publikasi awal mengikuti P0 pada PRD. Routing, isochrone, indeks, moderasi, dan administrasi masuk tahap berikutnya.
