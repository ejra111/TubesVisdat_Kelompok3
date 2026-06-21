let netflixData = [];
let typeChart, countryChart, yearChart;

// 0a. Sintesis efek suara intro (Web Audio API, bukan file/sample berhak cipta)
function playIntroSound() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        // Browser modern memblokir autoplay audio sebelum ada interaksi pengguna.
        // Jika context tersuspend, coba resume begitu pengguna pertama kali klik/keydown.
        if (ctx.state === 'suspended') {
            const resume = () => {
                ctx.resume();
                document.removeEventListener('click', resume);
                document.removeEventListener('keydown', resume);
            };
            document.addEventListener('click', resume, { once: true });
            document.addEventListener('keydown', resume, { once: true });
        }

        const now = ctx.currentTime;

        // Bagian 1: swell bass naik, mengiringi batang merah yang menyatu (~0 - 1.5s)
        const swellOsc = ctx.createOscillator();
        const swellGain = ctx.createGain();
        swellOsc.type = 'sine';
        swellOsc.frequency.setValueAtTime(70, now);
        swellOsc.frequency.exponentialRampToValueAtTime(210, now + 1.4);
        swellGain.gain.setValueAtTime(0.0001, now);
        swellGain.gain.exponentialRampToValueAtTime(0.22, now + 1.3);
        swellGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.55);
        swellOsc.connect(swellGain).connect(ctx.destination);
        swellOsc.start(now);
        swellOsc.stop(now + 1.6);

        // Bagian 2: hentakan rendah tepat saat flash menyala (~2.15s)
        const hitOsc = ctx.createOscillator();
        const hitGain = ctx.createGain();
        hitOsc.type = 'sine';
        hitOsc.frequency.setValueAtTime(160, now + 2.15);
        hitOsc.frequency.exponentialRampToValueAtTime(38, now + 2.45);
        hitGain.gain.setValueAtTime(0.0001, now + 2.15);
        hitGain.gain.exponentialRampToValueAtTime(0.55, now + 2.17);
        hitGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.65);
        hitOsc.connect(hitGain).connect(ctx.destination);
        hitOsc.start(now + 2.15);
        hitOsc.stop(now + 2.7);

        // Lapisan tekstur "impact" pakai white noise singkat, disaring lowpass
        const bufferSize = Math.floor(ctx.sampleRate * 0.3);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 1100;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.16, now + 2.15);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.45);
        noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
        noise.start(now + 2.15);
    } catch (error) {
        console.warn('Efek suara intro tidak dapat diputar:', error);
    }
}

// 0. Intro pembuka ala Netflix - jalan duluan, tidak menunggu dataset
function initIntro() {
    const intro = document.getElementById('netflixIntro');
    const skipBtn = document.getElementById('skipIntro');
    if (!intro) return;

    document.body.classList.add('intro-active');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const totalDuration = prefersReducedMotion ? 0 : 4200; // ms, beri waktu baca teks judul sebelum fade

    if (!prefersReducedMotion) {
        playIntroSound();
    }

    let finished = false;
    const endIntro = () => {
        if (finished) return;
        finished = true;
        intro.classList.add('intro-hidden');
        document.body.classList.remove('intro-active');
        setTimeout(() => intro.remove(), 650); // tunggu transisi fade selesai baru dibuang dari DOM
    };

    const timer = setTimeout(endIntro, totalDuration);

    skipBtn.addEventListener('click', () => {
        clearTimeout(timer);
        endIntro();
    });
}

document.addEventListener('DOMContentLoaded', initIntro);

// 1. Mengambil Dataset JSON (Asinkron)
async function loadDataset() {
    try {
        const response = await fetch('netflix_dataset_cleaned.json');
        netflixData = await response.json();

        populateYearDropdown();
        initCustomDropdown();
        renderDashboard("All");
    } catch (error) {
        console.error("Gagal memuat dataset:", error);
        alert("Gagal memuat data. Pastikan file netflix_data.json ada dan dibuka lewat Live Server.");
    }
}

// 2. Mengisi Filter Dropdown Otomatis (select asli sebagai sumber data)
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

// 2b. Bangun UI dropdown custom ala Netflix, disinkronkan dengan select asli
function initCustomDropdown() {
    const wrapper = document.getElementById("customSelect");
    const trigger = document.getElementById("selectTrigger");
    const optionsList = document.getElementById("selectOptions");
    const selectedLabel = document.getElementById("selectedLabel");
    const nativeSelect = document.getElementById("yearFilter");

    // Generate opsi custom dari opsi select asli
    optionsList.innerHTML = "";
    Array.from(nativeSelect.options).forEach(opt => {
        const li = document.createElement("li");
        li.textContent = opt.textContent;
        li.dataset.value = opt.value;
        li.setAttribute("role", "option");
        if (opt.value === nativeSelect.value) li.classList.add("selected");

        li.addEventListener("click", () => {
            nativeSelect.value = opt.value;
            selectedLabel.textContent = opt.textContent;

            optionsList.querySelectorAll("li").forEach(item => item.classList.remove("selected"));
            li.classList.add("selected");

            closeDropdown();

            // Trigger event 'change' supaya listener lama di bawah tetap jalan
            nativeSelect.dispatchEvent(new Event("change"));
        });

        optionsList.appendChild(li);
    });

    function openDropdown() {
        wrapper.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
    }

    function closeDropdown() {
        wrapper.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
    }

    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        wrapper.classList.contains("open") ? closeDropdown() : openDropdown();
    });

    // Tutup saat klik di luar dropdown
    document.addEventListener("click", (e) => {
        if (!wrapper.contains(e.target)) closeDropdown();
    });

    // Tutup dengan tombol Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeDropdown();
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

    // C.1 Persentase untuk legend donut
    const moviePct = totalContent > 0 ? ((movieCount / totalContent) * 100).toFixed(1) : "0.0";
    const tvPct = totalContent > 0 ? ((tvCount / totalContent) * 100).toFixed(1) : "0.0";
    document.getElementById("moviePct").textContent = `${moviePct}%`;
    document.getElementById("tvPct").textContent = `${tvPct}%`;

    // Olah Data Top 5 Negara
    const sortedCountries = Object.entries(countryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const countryLabels = sortedCountries.map(item => item[0]);
    const countryData = sortedCountries.map(item => item[1]);

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
    if (typeChart) typeChart.destroy();
    if (countryChart) countryChart.destroy();
    if (yearChart) yearChart.destroy();

    const gridColor = "rgba(255,255,255,0.07)";
    const tickColor = "#9a9a9a";

    // Chart 1: Komposisi Tipe (Doughnut)
    const ctxType = document.getElementById('typeChart').getContext('2d');
    typeChart = new Chart(ctxType, {
        type: 'doughnut',
        data: {
            labels: ['Movie', 'TV Show'],
            datasets: [{
                data: [movieCount, tvCount],
                backgroundColor: ['#E50914', '#3a3a3a'],
                borderColor: '#161616',
                borderWidth: 4,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: { display: false } // legend custom di HTML
            }
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
                borderRadius: 4,
                barThickness: 22
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1f1f1f',
                    titleColor: '#fff',
                    bodyColor: '#fff'
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { color: tickColor }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#e5e5e5', font: { weight: '500' } }
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
                backgroundColor: 'rgba(229, 9, 20, 0.18)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 2,
                pointBackgroundColor: '#E50914'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1f1f1f',
                    titleColor: '#fff',
                    bodyColor: '#fff'
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: tickColor, maxRotation: 0, autoSkip: true }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: tickColor }
                }
            }
        }
    });
}

// 5. Event Listeners
window.onload = loadDataset;

document.getElementById("yearFilter").addEventListener("change", function (e) {
    renderDashboard(e.target.value);
});