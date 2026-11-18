# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# SUMUT CONNECT
### Smart Infrastructure & Accessibility Mapping for North Sumatra

**Judul Akademik:** Pengembangan Sistem Informasi Geografis Berbasis Web untuk Analisis Kesenjangan Infrastruktur dan Aksesibilitas Pelayanan Publik di Provinsi Sumatera Utara

**Versi:** 2.0  
**Tanggal:** 18 November 2026  
**Status:** Baseline Perencanaan — Belum Diimplementasikan  
**Kategori:** WebGIS dan Spatial Decision Support System  
**Wilayah:** Provinsi Sumatera Utara  
**SDGs:** SDG 9 dan SDG 11  
**Metode:** QGIS-first Geospatial Development  
**Target:** Aplikasi web yang stabil, interaktif, responsif, terukur, dan dapat dipelihara

---

# 1. EXECUTIVE SUMMARY

SUMUT CONNECT merupakan platform Sistem Informasi Geografis berbasis web yang dirancang untuk menganalisis persebaran dan keterjangkauan infrastruktur serta fasilitas pelayanan publik di Provinsi Sumatera Utara.

Platform menggabungkan pengolahan data geospasial melalui QGIS, penyimpanan data spasial menggunakan PostgreSQL/PostGIS, dan visualisasi interaktif melalui React dan Leaflet.

SUMUT CONNECT bukan sekadar peta digital yang menampilkan marker, melainkan aplikasi analitik spasial yang memungkinkan pengguna:

1. Menjelajahi persebaran fasilitas publik.
2. Menganalisis jarak dan keterjangkauan fasilitas.
3. Membandingkan kondisi infrastruktur antarwilayah.
4. Mengidentifikasi wilayah yang berpotensi kurang terlayani.
5. Memvisualisasikan indikator melalui peta choropleth.
6. Menentukan rute menuju fasilitas.
7. Menampilkan statistik dan dashboard interaktif.
8. Mengunduh hasil analisis.
9. Melaporkan permasalahan infrastruktur.
10. Menelusuri sumber dan kualitas data yang digunakan.

Aplikasi ditujukan untuk kebutuhan akademik, penelitian, eksplorasi data, dan dukungan analisis awal perencanaan wilayah.

Hasil analisis bukan penetapan resmi kondisi infrastruktur atau prioritas pembangunan pemerintah.

# 2. PRODUCT VISION

**Visi**

Membangun platform WebGIS yang modern, profesional, dan informatif untuk mendukung pemahaman mengenai pemerataan infrastruktur dan akses pelayanan publik di Sumatera Utara.

**Misi**

- Mengintegrasikan data spasial dari berbagai sumber.
- Menyediakan pemetaan dan analisis yang dapat dipahami masyarakat.
- Menampilkan informasi geografis melalui visualisasi interaktif.
- Menyediakan metode analisis yang transparan dan dapat direproduksi.
- Mendukung pemahaman pencapaian SDG 9 dan SDG 11.
- Mengembangkan aplikasi yang dapat diperluas tanpa harus membangun ulang seluruh sistem.

# 3. IDENTIFIKASI PERMASALAHAN

Permasalahan yang mendasari pengembangan:

**P01 — Fragmentasi Data**

Data fasilitas dan infrastruktur tersebar pada berbagai portal dan format sehingga membutuhkan pengolahan sebelum dapat dianalisis bersama.

**P02 — Keterbatasan Informasi Aksesibilitas**

Mengetahui keberadaan fasilitas belum cukup untuk menggambarkan keterjangkauannya.

**P03 — Perbedaan Karakteristik Wilayah**

Kawasan perkotaan, pegunungan, pesisir, kepulauan, dan perdesaan memiliki kondisi konektivitas yang berbeda.

**P04 — Keterbatasan Analisis Terpadu**

Perbandingan antarwilayah memerlukan penggabungan indikator statistik dan data spasial yang konsisten.

**P05 — Keterbatasan Visualisasi**

Data berupa tabel sering kali sulit digunakan untuk memahami pola geografis.

# 4. TARGET PENGGUNA

## 4.1 Masyarakat Umum

Mengakses fasilitas, menemukan lokasi, melihat informasi layanan, dan mencari rute.

## 4.2 Mahasiswa dan Peneliti

Melakukan eksplorasi data spasial, analisis sederhana, perbandingan wilayah, dan pengunduhan data.

## 4.3 Pengamat dan Perencana Wilayah

Melihat indikator fasilitas, konektivitas, dan potensi kesenjangan akses berdasarkan data yang tersedia.

## 4.4 Administrator

Mengelola dataset, mengimpor pembaruan, memverifikasi laporan, dan menjaga kualitas informasi.

# 5. CAKUPAN GEOGRAFIS

Sistem mencakup seluruh 33 kabupaten/kota Provinsi Sumatera Utara.

**Tingkat geografis:**

- Provinsi: ringkasan keseluruhan.
- Kabupaten/kota: analisis dan perbandingan utama.
- Kecamatan: detail apabila data tersedia.
- Desa/kelurahan: analisis lanjutan apabila tersedia data terverifikasi.
- Titik lokasi: fasilitas publik dan objek infrastruktur.
- Jaringan: jalan dan konektivitas transportasi.

Batas administrasi dan kode wilayah harus mengikuti satu versi referensi yang ditentukan dalam metadata proyek.

Data pada unit geografis yang berbeda tidak boleh digabungkan tanpa prosedur agregasi atau transformasi yang sesuai.

# 6. RUANG LINGKUP PRODUK

## 6.1 Modul Utama

1. Dashboard Overview.
2. Interactive Map Explorer.
3. Infrastructure Data Explorer.
4. Accessibility Analysis.
5. Regional Comparison.
6. Infrastructure Insights.
7. Routing dan Spatial Measurement.
8. Data Catalog.
9. Community Reporting.
10. Administration Panel.

## 6.2 Prioritas Rilis

**P0 — Wajib pada Rilis Pertama**

- Dashboard ringkasan.
- Peta batas 33 kabupaten/kota.
- Multi-basemap.
- Minimal tiga kategori fasilitas.
- Marker dan popup.
- Layer control.
- Pencarian dan filter.
- Geolocation.
- Pengukuran jarak.
- Choropleth.
- Analisis radius.
- Perbandingan dua wilayah berdasarkan data tersedia.
- Metadata sumber data.
- Tampilan responsif.
- Dokumentasi dan deployment publik.

**P1 — Rilis Lanjutan**

- Routing.
- Statistik aksesibilitas berbasis jaringan.
- Indeks aksesibilitas eksploratif.
- Export CSV/PDF.
- Admin panel.
- Pengelolaan dataset.

**P2 — Rilis Pengembangan**

- Isochrone.
- Heatmap lanjutan.
- Multi-criteria gap analysis.
- Pelaporan masyarakat dan moderasi.
- Analisis historis.
- Rekomendasi prioritas wilayah berdasarkan indikator.

P0 tidak bergantung pada API routing eksternal. Dengan demikian, rilis pertama tetap dapat berfungsi ketika layanan rute tidak tersedia.

# 7. QGIS AS CORE GEOSPATIAL PLATFORM

QGIS merupakan perangkat utama untuk menyiapkan dan memvalidasi seluruh data spasial sebelum digunakan oleh website.

## 7.1 Kegiatan Pengolahan QGIS

**GIS-01 — Akuisisi Data**

Mengimpor data batas administrasi, jaringan jalan, fasilitas, dan statistik wilayah.

**GIS-02 — Coordinate Reference System**

Menyeragamkan data geografis untuk pertukaran dan tampilan web menggunakan EPSG:4326.

Untuk perhitungan panjang dan luas, digunakan CRS proyeksi sesuai wilayah kajian atau metode pengukuran geodesik yang tepat.

**GIS-03 — Geometry Validation**

Menjalankan Check Validity dan Fix Geometries jika diperlukan, serta mencatat perubahan hasil perbaikan.

**GIS-04 — Data Cleaning**

Menghapus duplikasi, memperbaiki atribut yang tidak valid, menstandarkan kategori, dan memeriksa lokasi yang mencurigakan.

**GIS-05 — Spatial Join**

Menghubungkan fasilitas dengan wilayah administrasi berdasarkan geometri dan memverifikasi hasil join.

**GIS-06 — Buffer Analysis**

Menghasilkan zona jangkauan fasilitas sesuai jarak yang ditentukan.

**GIS-07 — Point-in-Polygon Analysis**

Menghitung jumlah titik fasilitas di dalam wilayah administrasi.

**GIS-08 — Thematic Mapping**

Menghasilkan peta choropleth dan kategori fasilitas menggunakan simbologi QGIS.

**GIS-09 — Spatial Verification**

Memeriksa apakah fasilitas terletak pada wilayah yang sesuai, serta apakah geometri berada pada area kajian yang relevan.

**GIS-10 — Publication Preparation**

Mempersiapkan GeoPackage sebagai format kerja utama dan mengekspor GeoJSON untuk distribusi web.

## 7.2 Artefak Wajib QGIS

Proyek harus menghasilkan:

- `SUMUT_CONNECT.qgz` — file proyek QGIS.
- `sumut_master.gpkg` — GeoPackage hasil pengolahan.
- `sumut_regions.geojson` — batas administrasi.
- `facilities_health.geojson` — fasilitas kesehatan.
- `facilities_education.geojson` — fasilitas pendidikan.
- `facilities_economy.geojson` — fasilitas ekonomi.
- `road_network.gpkg` — jaringan jalan yang telah diperiksa.
- `analysis_outputs.gpkg` — hasil analisis spasial.
- `data_dictionary.csv` — definisi atribut.
- `source_manifest.csv` — sumber, lisensi, dan versi data.
- `processing_log.md` — catatan pengolahan dan validasi.

Nama file tersebut adalah kontrak struktur proyek; file dibentuk dari dataset yang berhasil diperoleh dan diverifikasi.

## 7.3 Prinsip Integrasi QGIS dan Web

QGIS bertugas menyiapkan geometri, atribut, analisis awal, dan kartografi.

Leaflet bertugas menampilkan peta interaktif.

PostGIS menjadi sumber data spasial untuk backend dan analisis dinamis.

QGIS tidak dijalankan di browser. File `.qgz` juga tidak langsung ditampilkan oleh Leaflet.

Simbologi QGIS yang diekspor ke GeoJSON tidak otomatis menghasilkan tampilan identik di Leaflet. Gaya web didefinisikan kembali melalui konfigurasi styling frontend.

# 8. FUNCTIONAL REQUIREMENTS

## MODULE A — DASHBOARD

**FR-001: Dashboard Summary**

Sistem menampilkan:
- Total wilayah.
- Total fasilitas terpetakan.
- Jumlah fasilitas menurut kategori.
- Jumlah dataset aktif.
- Tanggal pembaruan data.

**Acceptance Criteria:**
- Angka dihitung dari dataset aktif.
- Tidak menggunakan nilai statis palsu.
- Tersedia loading dan error state.
- Perubahan data tercermin setelah refresh atau invalidasi cache.

**FR-002: Data Visualization**

Dashboard menampilkan grafik interaktif mengenai distribusi fasilitas berdasarkan kategori dan wilayah.

**Acceptance Criteria:**
- Grafik sesuai hasil query.
- Tooltip menampilkan nilai dan satuan.
- Empty state tersedia ketika data kosong.
- Grafik dapat dibaca di perangkat mobile.

## MODULE B — INTERACTIVE WEBGIS

**FR-003: Basemap Control**

Pengguna dapat mengganti basemap yang dikonfigurasi.

**FR-004: Administrative Boundary**

Batas 33 kabupaten/kota ditampilkan sebagai polygon interaktif.

**FR-005: Facility Marker**

Fasilitas ditampilkan berdasarkan koordinat valid.

**FR-006: Marker Clustering**

Marker berdekatan dapat dikelompokkan agar peta tetap responsif.

**FR-007: Facility Popup**

Popup menampilkan nama, kategori, wilayah, dan informasi yang tersedia.

**FR-008: Layer Control**

Pengguna dapat menampilkan atau menyembunyikan kategori.

**FR-009: Map Search**

Pengguna dapat mencari nama fasilitas atau wilayah.

**FR-010: Map Filter**

Filter berdasarkan kategori dan kabupaten/kota.

**FR-011: Geolocation**

Peta dapat mengarahkan tampilan ke lokasi pengguna setelah izin browser diberikan.

**FR-012: Map Measurement**

Mengukur jarak beberapa titik menggunakan satuan yang jelas.

**Acceptance Criteria Modul B:**
- Peta tidak crash ketika layer kosong.
- Perubahan filter tidak mengharuskan reload seluruh halaman.
- Marker dapat diklik dan menampilkan data sesuai objek.
- Pengguna dapat mengembalikan peta ke tampilan awal.
- Atribusi penyedia data selalu tampil.
- Penolakan izin lokasi ditangani dengan pesan dan alternatif pemilihan lokasi manual.
- Kontrol dapat digunakan dengan mouse maupun touch.

## MODULE C — ACCESSIBILITY ANALYSIS

**FR-013: Radius Analysis**

Pengguna memilih titik pusat dan radius.

Sistem menampilkan fasilitas dalam radius tersebut.

Parameter awal:
- Titik pusat.
- Radius dalam kilometer.
- Kategori fasilitas.
- Batas jumlah hasil.

**FR-014: Nearest Facility**

Menampilkan fasilitas terdekat berdasarkan jarak geodesik atau jarak jaringan jalan apabila tersedia.

**FR-015: Buffer Visualization**

Menampilkan poligon hasil analisis jangkauan pada peta.

**FR-016: Analysis Result Panel**

Menampilkan:
- Jumlah fasilitas.
- Daftar fasilitas.
- Jarak tiap fasilitas.
- Metode analisis.
- Sumber data.
- Waktu analisis.

**Acceptance Criteria:**
- Hasil perhitungan spasial diuji menggunakan kasus dengan hasil yang diketahui.
- Radius menggunakan satuan meter atau kilometer secara konsisten.
- Radius garis lurus tidak disebut sebagai waktu tempuh.
- Input di luar rentang ditolak dengan pesan validasi.
- Hasil kosong ditampilkan sebagai hasil valid, bukan error.
- Data tanpa koordinat valid tidak disertakan tanpa penjelasan.

## MODULE D — REGIONAL COMPARISON

**FR-017: Region Selector**

Pengguna memilih dua wilayah.

**FR-018: Indicator Comparison**

Sistem membandingkan:
- Jumlah fasilitas menurut kategori.
- Jumlah fasilitas per penduduk jika data penduduk tersedia dan sesuai.
- Indikator konektivitas yang telah tervalidasi.
- Indeks aksesibilitas jika fitur tersebut telah dirilis.

**FR-019: Comparison Chart**

Menampilkan grafik dan tabel pembanding.

**Acceptance Criteria:**
- Wilayah yang dibandingkan jelas.
- Indikator memiliki definisi, satuan, dan periode.
- Nilai yang tidak tersedia ditampilkan sebagai N/A.
- Data agregat tidak disalahartikan sebagai jarak perjalanan.
- Pengguna dapat mengganti wilayah tanpa kehilangan konteks halaman.

## MODULE E — SPATIAL INSIGHTS

**FR-020: Choropleth Map**

Wilayah diberi warna berdasarkan indikator numerik.

**FR-021: Legend**

Legenda menampilkan rentang indikator dan satuan.

**FR-022: Region Details**

Klik wilayah menampilkan informasi rinci.

**FR-023: Data Completeness**

Sistem menampilkan status kelengkapan dataset.

**Acceptance Criteria:**
- Klasifikasi warna sesuai interval yang dihitung.
- Nilai null dibedakan dari nilai nol.
- Pengguna dapat melihat definisi indikator.
- Nilai peta sesuai tabel sumber.
- Legenda berubah ketika indikator diganti.

## MODULE F — ROUTING (P1)

**FR-024: Route Generation**

Sistem menghitung rute dari titik asal menuju fasilitas menggunakan layanan atau mesin routing yang dikonfigurasi.

**FR-025: Route Information**

Hasil menampilkan jarak jaringan, estimasi waktu, dan metode transportasi yang didukung.

**Acceptance Criteria:**
- Rute hanya ditampilkan jika layanan mengembalikan hasil valid.
- Tidak ada rute dikarang ketika layanan gagal.
- Endpoint mempunyai timeout, validasi, dan pembatasan permintaan.
- Pengguna diberi pilihan kembali menggunakan analisis jarak garis lurus dengan label yang tepat.

## MODULE G — DATA EXPORT (P1)

**FR-026: CSV Export**

Ekspor tabel hasil analisis dengan nama kolom dan satuan.

**FR-027: PDF Export**

Ekspor ringkasan analisis, metode, dan metadata sumber.

**Acceptance Criteria:**
- Hanya data yang diizinkan untuk dibagikan diekspor.
- Berkas memuat periode dan parameter analisis.
- Angka ekspor konsisten dengan tampilan aplikasi.

## MODULE H — ADMINISTRATION (P1)

**FR-028: Administrator Authentication**

Login dengan autentikasi aman.

**FR-029: Dataset Management**

Mengunggah dan memvalidasi dataset melalui alur staging sebelum publikasi.

**FR-030: Facility Management**

Tambah, edit, dan nonaktifkan fasilitas.

**FR-031: Audit Log**

Catat perubahan, pengguna, dan waktu perubahan.

**Acceptance Criteria:**
- Endpoint admin tidak dapat diakses pengguna tanpa otorisasi.
- Password disimpan menggunakan password hashing yang sesuai.
- Input dan file unggahan divalidasi.
- Perubahan dataset dapat diaudit.
- Dataset rusak tidak langsung menggantikan dataset aktif.

## MODULE I — COMMUNITY REPORTS (P2)

**FR-032: Public Reporting**

Pengguna dapat mengirim laporan mengenai infrastruktur dengan lokasi dan kategori.

**FR-033: Report Moderation**

Admin dapat memverifikasi laporan.

**FR-034: Report Visualization**

Laporan publik yang lolos moderasi dapat ditampilkan sebagai layer tersendiri.

**Acceptance Criteria:**
- Laporan belum diverifikasi tidak diperlakukan sebagai fakta.
- Tersedia pembatasan spam.
- Informasi pribadi tidak ditampilkan secara publik.
- Ada mekanisme penghapusan dan peninjauan laporan.

# 9. ACCESSIBILITY INDEX SPECIFICATION

Indeks aksesibilitas adalah fitur P1, bukan prasyarat berfungsinya MVP.

Rancangan awal menggunakan empat dimensi:

- Akses pelayanan kesehatan.
- Akses pelayanan pendidikan.
- Konektivitas jalan.
- Akses kegiatan ekonomi.

Setiap dimensi memerlukan:

1. Definisi indikator.
2. Satuan dan cakupan wilayah.
3. Sumber dan tahun.
4. Metode pengukuran.
5. Metode normalisasi.
6. Aturan data hilang.
7. Bobot.
8. Prosedur validasi.

Bobot awal yang diusulkan adalah 30%, 25%, 25%, dan 20%, tetapi harus dievaluasi sebelum digunakan.

Skor tidak dihitung apabila kelengkapan minimum yang ditentukan belum terpenuhi.

Aplikasi harus dapat menjelaskan mengapa suatu wilayah memperoleh skor tertentu.

# 10. DATA MANAGEMENT REQUIREMENTS

## 10.1 Sumber Data

Sumber yang direncanakan:

- Badan Informasi Geospasial: referensi data batas administrasi.
- Badan Pusat Statistik: indikator statistik dan fasilitas.
- OpenStreetMap: titik fasilitas dan jaringan jalan.
- Portal Satu Data: dataset sektoral.
- Sumber pemerintah terkait yang memiliki metadata dan izin penggunaan yang sesuai.

## 10.2 Metadata Wajib

Setiap dataset minimal memuat:

- Dataset ID.
- Judul.
- Penerbit.
- URL sumber.
- Lisensi.
- Tanggal akses.
- Tahun observasi.
- Tanggal pembaruan internal.
- CRS.
- Unit analisis.
- Jumlah record.
- Status validasi.
- Catatan keterbatasan.

## 10.3 Validasi

Validasi mencakup:

- Geometri valid.
- Koordinat berada dalam wilayah yang relevan.
- Kode wilayah konsisten.
- Identitas record unik.
- Kategori dinormalisasi.
- Nilai numerik memiliki unit yang jelas.
- Nilai hilang tercatat.
- Duplikasi diperiksa.
- Atribut wajib tidak kosong.

## 10.4 Kebijakan Data

Data yang tidak tersedia tidak boleh diganti dengan data buatan tanpa penanda simulasi.

Data demo harus diberi label **Sample/Demo Data** dan tidak digunakan untuk menyimpulkan kondisi riil wilayah.

Sumber data dapat memiliki periode yang berbeda; sistem harus menunjukkan perbedaan tersebut.

# 11. SYSTEM ARCHITECTURE

## 11.1 Arsitektur Umum

**Data Sources → QGIS Processing → GeoPackage/GeoJSON → PostgreSQL/PostGIS → Node.js API → React/Leaflet WebGIS**

Pengolahan awal berlangsung di QGIS.

Database berfungsi sebagai sumber data aplikasi.

Backend menyediakan endpoint untuk data, autentikasi, statistik, dan analisis.

Frontend menangani interaksi pengguna dan visualisasi.

## 11.2 Frontend

Teknologi:

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- shadcn/ui.
- React Leaflet.
- TanStack Query.
- Zustand bila diperlukan.
- Recharts.

Persyaratan:
- Modular.
- Type-safe.
- Responsive.
- Loading/error handling.
- Komponen reusable.
- Lazy loading untuk modul berat.
- Pemisahan state peta dan state data server.

## 11.3 Backend

Teknologi:

- Node.js versi LTS yang didukung.
- TypeScript.
- Express.js.
- Zod untuk validasi.
- PostgreSQL client atau query builder.
- PostGIS SQL untuk operasi spasial.
- Structured logging.

Persyaratan:
- REST API berversi.
- Validasi request.
- Pagination.
- Rate limiting.
- Authentication dan authorization.
- Error response konsisten.
- Health check.
- Audit log.
- Pembatasan ukuran permintaan.

## 11.4 Database

Teknologi:

- PostgreSQL.
- PostGIS.
- Spatial indexes.

Entitas inti:

- regions.
- facilities.
- facility_categories.
- roads.
- indicators.
- region_statistics.
- datasets.
- data_sources.
- spatial_analysis_runs.
- users.
- audit_logs.

Entitas tambahan pada P2:

- community_reports.
- report_attachments.
- report_moderation_history.

## 11.5 Hosting

Arsitektur deployment:

- Frontend: Vercel atau hosting statis kompatibel.
- Backend: hosting yang mendukung Node.js.
- Database: PostgreSQL dengan PostGIS.
- Database tidak dibuka langsung ke publik.
- Koneksi menggunakan TLS bila tersedia.
- Rahasia aplikasi disimpan sebagai environment variables.

Hosting backend dan database tidak harus berada di Vercel.

# 12. API CONTRACT

Prefix: `/api/v1`

**Public Data**

GET `/health`  
GET `/regions`  
GET `/regions/:code`  
GET `/facilities`  
GET `/facilities/:id`  
GET `/categories`  
GET `/statistics/summary`  
GET `/statistics/regions`  
GET `/indicators`  
GET `/datasets`

**Analysis**

POST `/analysis/radius`  
POST `/analysis/nearest`  
POST `/analysis/compare`  
POST `/analysis/accessibility` — P1  
POST `/analysis/routes` — P1  
POST `/analysis/isochrone` — P2

**Admin — P1**

POST `/auth/login`  
POST `/auth/logout`  
GET `/admin/datasets`  
POST `/admin/datasets/import`  
PATCH `/admin/facilities/:id`  
GET `/admin/audit-logs`

API wajib mempunyai kontrak request/response terdokumentasi menggunakan OpenAPI.

Format error standar:

- Status HTTP.
- Kode error.
- Pesan yang aman ditampilkan.
- Request ID.

Field geospasial mengikuti aturan urutan koordinat sesuai format yang digunakan, terutama GeoJSON `[longitude, latitude]`.

# 13. UI/UX REQUIREMENTS

## 13.1 Konsep

**Modern Geospatial Intelligence Platform**

Karakter desain:
- Profesional.
- Bersih.
- Modern.
- Data-oriented.
- Map-centric.
- Mudah dipahami.
- Konsisten.

## 13.2 Struktur Halaman

1. Overview Dashboard.
2. Map Explorer.
3. Accessibility Analysis.
4. Regional Comparison.
5. Infrastructure Insights.
6. Data Catalog.
7. About / Methodology.

Halaman tambahan untuk P1/P2:
- Admin Console.
- Community Reports.
- Advanced Routing.
- Gap Analysis.

## 13.3 Peta

Peta harus:
- Mendominasi area kerja Map Explorer.
- Menyediakan sidebar filter.
- Memiliki toolbar kontrol.
- Mendukung panel detail objek.
- Menampilkan legenda.
- Menampilkan sumber dan atribusi.
- Menyesuaikan viewport.
- Memberikan feedback jelas saat loading atau error.

## 13.4 Desain Responsif

Desktop:
- Sidebar navigasi.
- Peta utama.
- Panel detail kontekstual.

Tablet:
- Sidebar collapsible.
- Panel filter berupa drawer.

Mobile:
- Navigasi ringkas.
- Peta tetap mudah digunakan.
- Filter melalui bottom sheet.
- Tombol interaksi memiliki ukuran sentuh yang memadai.

## 13.5 Accessibility

Target mengacu pada WCAG 2.2 AA untuk komponen yang dapat dikendalikan aplikasi.

- Navigasi keyboard.
- Visible focus.
- Label input.
- Kontras teks.
- Informasi tidak hanya melalui warna.
- Pesan error dapat dipahami.
- Alternatif tabel untuk informasi pada peta.

# 14. NON-FUNCTIONAL REQUIREMENTS

## 14.1 Performance

Target pengujian produksi:

- LCP ≤ 2,5 detik pada persentil ke-75 dalam kondisi pengukuran yang ditentukan.
- INP ≤ 200 ms pada persentil ke-75.
- CLS ≤ 0,1.
- Respons API baca sederhana p95 ≤ 500 ms pada dataset dan beban uji yang ditentukan.
- Tidak ada long task yang menyebabkan UI peta tidak dapat digunakan secara berkelanjutan.

Target tidak dianggap tercapai sebelum ada hasil pengukuran.

Strategi:
- Marker clustering.
- Geometri disederhanakan untuk level zoom rendah.
- Pemanggilan data berdasarkan bounding box.
- Caching.
- Pagination.
- Query spatial index.
- Code splitting.

## 14.2 Reliability

- Tidak ada error JavaScript kritis pada alur utama.
- API mempunyai error handling dan request timeout.
- Gangguan layanan opsional tidak mematikan peta utama.
- Dataset valid sebelumnya tetap aktif jika proses pembaruan gagal.
- Pengecekan health backend dan koneksi database.

## 14.3 Security

- HTTPS.
- Validasi frontend dan backend.
- Query terparameterisasi.
- Tidak mengungkap kredensial.
- CORS hanya untuk origin yang disetujui.
- Otorisasi berbasis peran.
- Rate limiting.
- Pembatasan dan validasi upload.
- XSS protection.
- Session management yang aman.
- Dependency scanning.
- Logging tanpa informasi sensitif.

## 14.4 Maintainability

- Struktur proyek konsisten.
- Konfigurasi melalui environment.
- Database migration.
- Dokumentasi endpoint.
- Reusable components.
- Automated tests.
- Source control.
- Changelog.

# 15. QUALITY ASSURANCE & TESTING

## 15.1 Unit Tests

Uji:
- Normalisasi skor.
- Perhitungan indikator.
- Validasi filter.
- Format satuan.
- Transformasi data.
- Fungsi geometri dan jarak.

## 15.2 Integration Tests

Uji:
- API dengan database.
- Query spasial.
- Query filter dan pagination.
- Import dataset.
- Autentikasi admin.

## 15.3 End-to-End Tests

Skenario utama:

1. Pengguna membuka dashboard.
2. Pengguna mengakses Map Explorer.
3. Pengguna memilih sebuah kabupaten.
4. Pengguna mengaktifkan layer kesehatan.
5. Pengguna membuka popup fasilitas.
6. Pengguna mencari fasilitas.
7. Pengguna menjalankan radius analysis.
8. Pengguna melihat hasil.
9. Pengguna membandingkan dua wilayah.
10. Pengguna membaca metadata sumber.

## 15.4 GIS Validation Tests

- Jumlah wilayah sesuai dataset referensi.
- Geometri valid.
- Tidak ada fasilitas valid yang hilang akibat proses impor tanpa tercatat.
- Hasil spatial join dapat diverifikasi.
- Buffer menggunakan metode dan satuan yang tepat.
- Hasil agregasi sesuai query database.
- Choropleth sesuai nilai indikator.

## 15.5 Cross-Platform Testing

Minimal:
- Chrome desktop.
- Firefox desktop.
- Edge desktop.
- Chrome Android.
- Safari iOS jika perangkat tersedia.

Pengujian menggunakan viewport desktop, tablet, dan ponsel.

# 16. RELEASE ACCEPTANCE CRITERIA

Rilis pertama hanya dinyatakan siap ketika:

- Semua fitur P0 telah berfungsi.
- Dataset utama sudah divalidasi.
- Semua halaman inti dapat diakses.
- Peta dapat dimuat tanpa error kritis.
- Filter dan pencarian memberikan hasil yang benar.
- Radius analysis lulus pengujian geospasial.
- Dashboard konsisten dengan database.
- Tidak ada masalah keamanan kritis yang diketahui.
- UI responsif pada perangkat target.
- Sumber dan atribusi data tampil.
- README, petunjuk instalasi, dan dokumentasi tersedia.
- Deployment publik dapat diakses dan diuji.
- File proyek QGIS dan GeoPackage disertakan sebagai bukti pekerjaan GIS.

Kegagalan salah satu kriteria kritis harus ditangani sebelum rilis diberi status selesai.

# 17. DEVELOPMENT PLAN

## Phase 1 — GIS Foundation

- Pengumpulan sumber.
- Struktur dataset.
- Konfigurasi QGIS.
- Validasi batas wilayah.
- Pembersihan titik fasilitas.
- Pembuatan GeoPackage.
- Dokumentasi data.

**Deliverable:** Proyek QGIS dan dataset yang telah diperiksa.

## Phase 2 — Data Infrastructure

- Setup PostgreSQL/PostGIS.
- Desain skema.
- Database migrations.
- Import geometri.
- Spatial indexes.
- API dasar.
- Validation tests.

**Deliverable:** Database dan REST API fungsional.

## Phase 3 — WebGIS Foundation

- Setup React.
- Design system.
- Sidebar dan dashboard.
- Basemap.
- Batas wilayah.
- Marker dan popup.
- Filter dan pencarian.

**Deliverable:** Peta interaktif yang stabil.

## Phase 4 — Spatial Analytics

- Radius analysis.
- Nearest facilities.
- Choropleth.
- Regional comparison.
- Dashboard statistik.

**Deliverable:** Fitur analisis utama.

## Phase 5 — Quality & Deployment

- Automated tests.
- Performance optimization.
- Security review.
- Accessibility checks.
- Documentation.
- Deployment.
- User acceptance testing.

**Deliverable:** SUMUT CONNECT v1.0 siap demonstrasi.

## Phase 6 — Advanced Features

- Routing.
- Access index.
- Isochrone.
- Community reports.
- Admin.
- Advanced insights.

**Deliverable:** Rilis lanjutan sesuai kebutuhan dan kesiapan data.

# 18. PROJECT DELIVERABLES

Hasil akhir yang wajib tersedia:

1. Source code frontend.
2. Source code backend.
3. Database schema dan migrations.
4. File proyek QGIS `.qgz`.
5. Dataset kerja GeoPackage.
6. GeoJSON untuk publikasi.
7. Data dictionary dan source manifest.
8. API documentation.
9. Unit dan integration test.
10. README instalasi.
11. Dokumentasi pengolahan QGIS.
12. User manual.
13. Screenshot halaman utama.
14. Website demo.
15. Laporan pengujian.
16. Catatan keterbatasan dataset dan analisis.

# 19. OUT OF SCOPE

Rilis awal tidak mencakup:

- Prediksi kondisi infrastruktur menggunakan AI.
- Navigasi kendaraan real-time.
- Peringatan bencana darurat.
- Penilaian resmi kualitas fasilitas.
- Penetapan resmi prioritas anggaran pemerintah.
- Klaim bahwa semua fasilitas di Sumatera Utara telah terpetakan.
- Integrasi data yang belum diperiksa hak penggunaan dan kualitasnya.

# 20. DEFINITION OF DONE

Sebuah fitur dianggap selesai hanya apabila:

1. Sesuai kebutuhan fungsional.
2. Data berasal dari sumber yang terdokumentasi.
3. Hasil benar berdasarkan pengujian.
4. UI berfungsi pada perangkat target.
5. Error dan kondisi tanpa data ditangani.
6. Tidak ada masalah keamanan kritis.
7. Kode telah direview.
8. Dokumentasi diperbarui.
9. Pengujian otomatis dan pengujian manual yang relevan lulus.
10. Fitur berhasil berjalan pada lingkungan deployment target.

---

**Kesimpulan PRD**

SUMUT CONNECT akan dibangun sebagai aplikasi WebGIS yang memanfaatkan QGIS sebagai fondasi pengolahan data spasial, PostGIS sebagai penyimpanan dan pemrosesan spasial, serta React dan Leaflet sebagai antarmuka pemetaan interaktif.

Keberhasilan proyek tidak hanya ditentukan oleh banyaknya fitur, tetapi juga kualitas data, ketepatan analisis, stabilitas aplikasi, keamanan, kemudahan penggunaan, dan kemampuan sistem untuk dipelihara serta dikembangkan.