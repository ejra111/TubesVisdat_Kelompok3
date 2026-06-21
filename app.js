let netflixData = [];
let typeChart, countryChart, yearChart;

// 1. Mengambil Dataset JSON (Asinkron)
async function loadDataset() {
    try {
        const response = await fetch('netflix_dataset_cleaned.json');
        netflixData = await response.json(); 
        
        populateYearDropdown();
        renderDashboard("All"); 
    } catch (error) {
        console.error("Gagal memuat dataset:", error);
        alert("Gagal memuat data. Pastikan file netflix_data.json ada dan dibuka lewat Live Server.");
    }
}

// 2. Mengisi Filter Dropdown Otomatis
function populateYearDropdown() {
    const yearFilter = document.getElementById("yearFilter");
    const uniqueYears = [...new Set(netflixData.map(item => item.release_year))]
                        .filter(year => year != null)
                        .sort((a, b) => b - a); 
    
    uniqueYears.forEach(year => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = `Tahun ${year}`;
        yearFilter.appendChild(option);
    });
}

// 3. Fungsi Animasi Count-Up untuk KPI (Syarat Animasi Tugas Akhir)
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString('id-ID');
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// 4. Fungsi Utama Memperbarui Dashboard
function renderDashboard(filterValue) {
    // A. Logika Subset Filter Data
    let filteredData = netflixData;
    if (filterValue !== "All") {
        filteredData = netflixData.filter(d => d.release_year === parseInt(filterValue));
    }

    // B. Olah Data untuk KPI dan Charts
    let movieCount = 0; 
    let tvCount = 0;
    const countryCount = {};

    filteredData.forEach(d => {
        // Hitung Tipe
        if (d.type === "Movie") movieCount++;
        else if (d.type === "TV Show") tvCount++;

        // Hitung Negara (Jika tidak kosong)
 if (d.country) {
            d.country.split(',').forEach(country => {
                country = country.trim();
                if (country !== '') {
                    countryCount[country] =
                        (countryCount[country] || 0) + 1;
                }
            });
        }
    });

    const totalContent = filteredData.length;
    const totalCountries = Object.keys(countryCount).length;

    // C. Jalankan Animasi KPI
    animateValue("kpiTotal", 0, totalContent, 1000);
    animateValue("kpiMovie", 0, movieCount, 1000);
    animateValue("kpiTv", 0, tvCount, 1000);
    animateValue("kpiCountry", 0, totalCountries, 1000);

    // Olah Data Top 5 Negara
    const sortedCountries = Object.entries(countryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const countryLabels = sortedCountries.map(item => item[0]);
    const countryData = sortedCountries.map(item => item[1]);

    console.log("Top 5 Negara:", sortedCountries);

    // Data Tren Tahun
    const yearCount = {};

    netflixData.forEach(d => {
        if (d.release_year) {
            yearCount[d.release_year] =
                (yearCount[d.release_year] || 0) + 1;
        }
    });

    const sortedYears = Object.keys(yearCount).sort((a, b) => a - b);
    const yearData = sortedYears.map(year => yearCount[year]);

    // D. Menggambar Grafik menggunakan Chart.js
    if(typeChart) typeChart.destroy();
    if(countryChart) countryChart.destroy();
    if(yearChart) yearChart.destroy();

    // Chart 1: Komposisi Tipe (Doughnut)
    const ctxType = document.getElementById('typeChart').getContext('2d');
    typeChart = new Chart(ctxType, {
        type: 'doughnut',
        data: {
            labels: ['Movie', 'TV Show'],
            datasets: [{
                data: [movieCount, tvCount],
                backgroundColor: ['#E50914', '#221F1F'], 
                borderWidth: 0 // Menghilangkan grid/border yang tidak perlu
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // Chart 2: Top 5 Negara (Horizontal Bar)
const ctxCountry = document.getElementById('countryChart').getContext('2d');

countryChart = new Chart(ctxCountry, {
    type: 'bar',
    data: {
        labels: countryLabels,
        datasets: [{
            label: 'Jumlah Konten',
            data: countryData,
            backgroundColor: '#E50914',
            borderRadius: 5
        }]
    },
    options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                beginAtZero: true
            }
        }
    }
});

    // Chart 3: Tren Rilis Tahun (Line Chart)
    const ctxYear = document.getElementById('yearChart').getContext('2d');
    yearChart = new Chart(ctxYear, {
        type: 'line',
        data: {
            labels: sortedYears,
            datasets: [{
                label: 'Rilis Konten Baru',
                data: yearData,
                borderColor: '#E50914',
                backgroundColor: 'rgba(229, 9, 20, 0.1)',
                borderWidth: 2,
                fill: true, 
                tension: 0.3,
                pointRadius: 2
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false } }, // Decluttering grid x
                y: { grid: { color: '#eaeaea' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// 5. Event Listeners
window.onload = loadDataset;

document.getElementById("yearFilter").addEventListener("change", function(e) {
    renderDashboard(e.target.value);
});