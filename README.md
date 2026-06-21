# 📊 Netflix Content Dashboard Analysis

Dashboard ini memvisualisasikan analisis distribusi konten Netflix (Movie & TV Show), negara produksi, dan tren rilis tahunan berdasarkan dataset Netflix dari Kaggle yang telah dibersihkan ke format JSON.

🌐 Demo: https://nama-kelompok.vercel.app

---

## 📌 Isi Dashboard

- **Chart 1: Komposisi Konten (Doughnut Chart)** — menampilkan perbandingan Movie vs TV Show di Netflix  
- **Chart 2: Top 5 Negara Produksi (Horizontal Bar Chart)** — menampilkan negara dengan jumlah konten terbanyak  
- **Chart 3: Tren Rilis Konten per Tahun (Line Chart)** — menampilkan tren jumlah konten Netflix berdasarkan tahun rilis  

- **Fitur interaktif:**
  - Dropdown filter berdasarkan tahun rilis
  - Tooltip pada setiap chart

- **Animasi:**
  - Count-up animation pada KPI (total content, movie, TV show, country)
  - Animasi render Chart.js saat update/filter

---

## 📂 Sumber Data

- **Nama dataset:** Netflix Movies and TV Shows (Cleaned Dataset)  
- **URL sumber:** https://www.kaggle.com/datasets/shivamb/netflix-shows  

---

## ▶️ Cara Jalankan di Lokal

### Jalur A (Static)
Buka `index.html` langsung di browser  
atau gunakan **Live Server (VS Code)**

### Jalur B (Server)

```bash
npm install
npm start
# Buka http://localhost:3000
## Teknologi
- Chart.js (visualisasi)
- HTML + CSS + JavaScript
- Vercel (deployment)
## Anggota
- Naufal Thafhan (103012300284)
- Nama 2 (NIM)