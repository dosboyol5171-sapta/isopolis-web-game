# Rencana Implementasi: Pemulihan Resolusi Tajam & Pemangkasan Beban CPU (Anti Patah-Patah)

Berdasarkan hasil analisis rekaman video dan diagnostik langsung di mana **Beban CPU mencapai 99%** dengan **109 WebGL Draw Calls** (bukan masalah resolusi GPU):

---

## 1. Pemulihan Ketajaman Resolusi (Menghilangkan Tampilan Burik)
- Menghapus penurunan skala resolusi otomatis yang merusak visual.
- Mengembalikan resolusi tajam, jernih, dan bertekstur bersih (*native crisp pixel ratio* dengan *antialiasing* aktif).

---

## 2. Isolasi Total Sistem Luar Ruangan saat di Dalam Rumah (*Interior Culling*)
Saat pemain berada di dalam rumah (`house_interior`):
- **Mematikan Seluruh Ground Mesh Luar Ruangan**: Menyembunyikan 10 lapisan mesh kebun (*grass, path, stone, sand, water, flowers, perimeter forest, meadow*).
- **Mematikan Efek Cuaca & Partikel Luar**: Menonaktifkan *god rays*, kelopak bunga terbang, kunang-kunang, asap cerobong eksterior, dan lebah.
- Hanya me-render lantai ruangan, dinding, dan perabotan interior.

---

## 3. Penggabungan Perabotan Rumah (*Furniture Batching*) & Pemangkasan Draw Calls
- Menggabungkan elemen dekorasi dan perabotan interior rumah (tempat tidur, perapian, meja, karpet, lemari) agar tidak menjadi puluhan *draw call* terpisah.
- Menurunkan jumlah *draw calls* dari **109 calls** menjadi **< 20 calls**, sehingga beban CPU turun drastis dari **99%** menjadi **< 25%**.

---

## 4. Hasil yang Ditargetkan
- **Visual**: Tajam, jernih, tanpa buram atau artefak bergerigi.
- **Performa**: 60 FPS mulus dan stabil tanpa patah-patah baik saat menjelajah kebun maupun di dalam ruangan rumah.
