// NASA NEOWISE NEO Analysis - Application Logic
// Group 15 | Software Lab Mini-Project

document.addEventListener('DOMContentLoaded', () => {
  if (typeof NEOWISE_DATA === 'undefined') {
    console.error('NEOWISE_DATA not found. Please ensure data.js is loaded.');
    return;
  }

  // 1. Initialize Tables & Statistics
  initUnivariateTable();
  initTop10Table();
  initFilterOptions();

  // 2. Initialize Charts
  initCharts();

  // 3. Initialize Interactive Simulator
  initSimulator();

  // 4. Initialize Orbit Visualizer
  initOrbitVisualizer();

  // 5. Initialize 451-NEO Catalog
  initCatalog();
});

/* ===================================================================
   1. Tables & Static Statistics
   =================================================================== */

function initUnivariateTable() {
  const tbody = document.querySelector('#univariate-table tbody');
  if (!tbody) return;

  const paramLabels = {
    'H (mag)': 'Absolute Magnitude H (mag)',
    'MOID (au)': 'Earth MOID (au)',
    'q (au)': 'Perihelion Distance q (au)',
    'Q (au)': 'Aphelion Distance Q (au)',
    'period (yr)': 'Orbital Period (yr)',
    'i (deg)': 'Orbital Inclination i (deg)'
  };

  const rows = Object.keys(NEOWISE_DATA.univariate).map(key => {
    const s = NEOWISE_DATA.univariate[key];
    const meanDisplay = s.mean > 1000 ? s.mean.toLocaleString('en-US', { maximumFractionDigits: 1 }) : s.mean.toFixed(3);
    const varDisplay = s.var > 1e6 ? s.var.toExponential(2) : s.var.toFixed(3);
    const stdDisplay = s.std > 1000 ? s.std.toLocaleString('en-US', { maximumFractionDigits: 1 }) : s.std.toFixed(3);

    return `
      <tr>
        <td><strong>${paramLabels[key] || key}</strong></td>
        <td class="num">${meanDisplay}</td>
        <td class="num">${s.median.toFixed(3)}</td>
        <td class="num">${stdDisplay}</td>
        <td class="num">${varDisplay}</td>
        <td class="num">${s.skew.toFixed(3)}</td>
        <td class="num">${s.q25.toFixed(2)} - ${s.q75.toFixed(2)}</td>
      </tr>
    `;
  });

  tbody.innerHTML = rows.join('');
}

function initTop10Table() {
  const tbody = document.getElementById('top10-table-body');
  if (!tbody) return;

  const rows = NEOWISE_DATA.top10Closest.map((obj, idx) => {
    const phaBadge = obj.pha === 'Y' 
      ? '<span class="badge badge-hazard">PHA = Y</span>' 
      : '<span class="badge badge-safe">PHA = N</span>';

    return `
      <tr>
        <td class="num"><strong>#${idx + 1}</strong></td>
        <td>
          <a href="#orbit-view" style="color: var(--c-slate); font-weight: 700; text-decoration: underline;" 
             onclick="selectObjectForOrbit('${obj.designation}')">
            ${obj.designation}
          </a>
        </td>
        <td class="num">${obj.discoveryDate}</td>
        <td class="num"><strong>${obj.moid.toFixed(4)}</strong></td>
        <td class="num">${obj.hMag !== null ? obj.hMag.toFixed(2) : 'n/a'}</td>
        <td class="num">${obj.q.toFixed(2)}</td>
        <td class="num">${obj.Q.toFixed(2)}</td>
        <td class="num">${obj.eccentricity !== null ? obj.eccentricity.toFixed(3) : 'n/a'}</td>
        <td>${phaBadge}</td>
        <td><span class="badge badge-class">${obj.orbitClass}</span></td>
      </tr>
    `;
  });

  tbody.innerHTML = rows.join('');
}

function initFilterOptions() {
  const select = document.getElementById('filter-orbit-class');
  if (!select) return;

  const sortedClasses = Object.keys(NEOWISE_DATA.orbitCounts).sort();
  sortedClasses.forEach(cls => {
    const count = NEOWISE_DATA.orbitCounts[cls];
    const opt = document.createElement('option');
    opt.value = cls;
    opt.textContent = `${cls} (${count})`;
    select.appendChild(opt);
  });
}

/* ===================================================================
   2. Chart.js Data Visualizations
   =================================================================== */

let chartInstances = {};

function initCharts() {
  // Chart 1: PHA Status Donut
  const ctxPHA = document.getElementById('chartPHA');
  if (ctxPHA) {
    chartInstances.pha = new Chart(ctxPHA, {
      type: 'doughnut',
      data: {
        labels: ['Non-Hazardous (N)', 'Potentially Hazardous (Y)', 'Comets / Unclassified'],
        datasets: [{
          data: [
            NEOWISE_DATA.phaCounts.N,
            NEOWISE_DATA.phaCounts.Y,
            NEOWISE_DATA.phaCounts.Unknown
          ],
          backgroundColor: ['#DCCFEC', '#A997DF', '#4F517D'],
          borderColor: '#FFFFFF',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = NEOWISE_DATA.metadata.totalRecords;
                const val = ctx.raw;
                const pct = ((val / total) * 100).toFixed(1);
                return ` ${ctx.label}: ${val} objects (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  // Chart 2: Absolute Magnitude Histogram (15 bins)
  const ctxMag = document.getElementById('chartMagnitude');
  if (ctxMag) {
    const validH = NEOWISE_DATA.records.map(r => r.hMag).filter(v => v !== null);
    const minH = 15.0;
    const maxH = 27.0;
    const binCount = 15;
    const binWidth = (maxH - minH) / binCount;
    const binLabels = [];
    const binCounts = new Array(binCount).fill(0);

    for (let i = 0; i < binCount; i++) {
      const bStart = minH + i * binWidth;
      const bEnd = bStart + binWidth;
      binLabels.push(`${bStart.toFixed(1)}-${bEnd.toFixed(1)}`);
    }

    validH.forEach(val => {
      if (val >= minH && val <= maxH) {
        const bIdx = Math.min(Math.floor((val - minH) / binWidth), binCount - 1);
        binCounts[bIdx]++;
      }
    });

    chartInstances.mag = new Chart(ctxMag, {
      type: 'bar',
      data: {
        labels: binLabels,
        datasets: [{
          label: 'Number of NEOs',
          data: binCounts,
          backgroundColor: '#4F517D',
          hoverBackgroundColor: '#A997DF',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            title: { display: true, text: 'Absolute Magnitude H (mag)', font: { size: 11 } },
            ticks: { maxRotation: 45, minRotation: 45, font: { size: 9 } }
          },
          y: {
            title: { display: true, text: 'Frequency', font: { size: 11 } },
            beginAtZero: true
          }
        }
      }
    });
  }

  // Chart 3: Yearly Discovery Timeline
  const ctxYearly = document.getElementById('chartYearly');
  if (ctxYearly) {
    const years = NEOWISE_DATA.allYears;
    const counts = years.map(yr => NEOWISE_DATA.yearCounts[yr] || 0);

    chartInstances.yearly = new Chart(ctxYearly, {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: 'Total Discoveries',
          data: counts,
          borderColor: '#1A3A3A',
          backgroundColor: 'rgba(169, 151, 223, 0.25)',
          fill: true,
          tension: 0.25,
          pointBackgroundColor: '#A997DF',
          pointBorderColor: '#1A3A3A',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const yr = parseInt(ctx.label);
                if (yr === 2010) return '★ 2010 Cryogenic Mission Peak (225+ discoveries)';
                if (yr === 2012) return '💤 Spacecraft Hibernation Phase (near zero)';
                if (yr >= 2014) return '📡 NEOWISE Reactivation Survey';
                return '';
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Discovery Year' } },
          y: { title: { display: true, text: 'Objects Cataloged' }, beginAtZero: true }
        }
      }
    });
  }

  // Chart 4: Orbit Classes among PHAs
  const ctxPHAOrbits = document.getElementById('chartPHAOrbits');
  if (ctxPHAOrbits) {
    // Count orbit classes for PHA = Y
    const phaClasses = {};
    NEOWISE_DATA.records.forEach(r => {
      if (r.pha === 'Y') {
        phaClasses[r.orbitClass] = (phaClasses[r.orbitClass] || 0) + 1;
      }
    });

    const sortedPhaLabels = Object.keys(phaClasses).sort((a, b) => phaClasses[b] - phaClasses[a]);
    const phaData = sortedPhaLabels.map(k => phaClasses[k]);

    chartInstances.phaOrbits = new Chart(ctxPHAOrbits, {
      type: 'pie',
      data: {
        labels: sortedPhaLabels,
        datasets: [{
          data: phaData,
          backgroundColor: ['#A997DF', '#4F517D', '#DCCFEC', '#DDC4DD'],
          borderColor: '#FFFFFF',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}

/* ===================================================================
   3. Planetary Defense Dual-Filter Simulator
   =================================================================== */

function initSimulator() {
  const sliderMoid = document.getElementById('slider-moid');
  const sliderH = document.getElementById('slider-h');
  const valMoid = document.getElementById('val-moid');
  const valH = document.getElementById('val-h');
  const countDisplay = document.getElementById('sim-count-total');
  const badgeDisplay = document.getElementById('sim-badge-pha');
  const tbody = document.getElementById('sim-table-body');

  function updateSimulation() {
    const maxMoid = parseFloat(sliderMoid.value);
    const maxH = parseFloat(sliderH.value);

    valMoid.textContent = `${maxMoid.toFixed(3)} AU`;
    valH.textContent = `${maxH.toFixed(1)} mag`;

    // Filter dataset
    const matched = NEOWISE_DATA.records.filter(r => {
      if (r.moid === null || r.hMag === null) return false;
      return r.moid <= maxMoid && r.hMag <= maxH;
    });

    matched.sort((a, b) => a.moid - b.moid);

    const phaCount = matched.filter(r => r.pha === 'Y').length;
    countDisplay.textContent = `${matched.length} Objects`;
    badgeDisplay.textContent = `${phaCount} Confirmed PHAs Included`;

    if (phaCount > 0) {
      badgeDisplay.className = 'badge badge-hazard';
    } else {
      badgeDisplay.className = 'badge badge-safe';
    }

    // Render preview table (up to 20)
    const rows = matched.slice(0, 20).map(obj => {
      const phaBadge = obj.pha === 'Y' 
        ? '<span class="badge badge-hazard">Y</span>' 
        : '<span class="badge badge-safe">N</span>';

      return `
        <tr>
          <td><strong>${obj.designation}</strong></td>
          <td class="num">${obj.moid.toFixed(4)}</td>
          <td class="num">${obj.hMag.toFixed(2)}</td>
          <td>${phaBadge}</td>
          <td><span class="badge badge-class">${obj.orbitClass}</span></td>
          <td>
            <button class="btn-sm" onclick="selectObjectForOrbit('${obj.designation}')">
              Plot Orbit
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rows.length > 0 
      ? rows.join('') 
      : '<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No asteroids meet these strict screening criteria.</td></tr>';
  }

  sliderMoid.addEventListener('input', updateSimulation);
  sliderH.addEventListener('input', updateSimulation);

  updateSimulation();
}

/* ===================================================================
   4. 2D Keplerian Solar System Orbit Visualizer (Canvas)
   =================================================================== */

let activeOrbitObject = null;
let animFrameId = null;
let isAnimating = true;
let animAngle = 0;
let userScale = 1.0;

function initOrbitVisualizer() {
  const canvas = document.getElementById('orbitCanvas');
  if (!canvas) return;

  const btnToggle = document.getElementById('btn-toggle-anim');
  const btnReset = document.getElementById('btn-reset-zoom');

  btnToggle.addEventListener('click', () => {
    isAnimating = !isAnimating;
    btnToggle.textContent = isAnimating ? 'Pause Animation' : 'Resume Animation';
  });

  btnReset.addEventListener('click', () => {
    userScale = 1.0;
  });

  // Default to closest object: (2010 MU112)
  const defaultObj = NEOWISE_DATA.records.find(r => r.designation.includes('2010 MU112')) || NEOWISE_DATA.records[0];
  selectObjectForOrbit(defaultObj.designation, false);

  function renderLoop() {
    drawOrbitCanvas(canvas);
    if (isAnimating) {
      animAngle += 0.015;
      if (animAngle > Math.PI * 2) animAngle -= Math.PI * 2;
    }
    animFrameId = requestAnimationFrame(renderLoop);
  }

  renderLoop();
}

function selectObjectForOrbit(designation, scrollTo = true) {
  const obj = NEOWISE_DATA.records.find(r => r.designation === designation);
  if (!obj) return;

  activeOrbitObject = obj;

  // Update HUD
  const q = obj.q || 1.0;
  const Q = obj.Q || (q * 1.5);
  const a = (q + Q) / 2;
  const e = (Q - q) / (Q + q);

  document.getElementById('hud-name').textContent = obj.designation;
  const badge = document.getElementById('hud-badge');
  badge.textContent = `PHA = ${obj.pha || 'Unk'} (${obj.orbitClass})`;
  badge.className = obj.pha === 'Y' ? 'badge badge-hazard' : 'badge badge-safe';

  document.getElementById('hud-q').textContent = `${q.toFixed(2)} AU`;
  document.getElementById('hud-Q').textContent = `${Q.toFixed(2)} AU`;
  document.getElementById('hud-a').textContent = `${a.toFixed(2)} AU`;
  document.getElementById('hud-e').textContent = `${e.toFixed(3)}`;
  document.getElementById('hud-i').textContent = `${obj.i !== null ? obj.i.toFixed(1) : 'n/a'}°`;
  document.getElementById('hud-moid').textContent = `${obj.moid !== null ? obj.moid.toFixed(4) : 'n/a'} AU`;

  if (scrollTo) {
    const el = document.getElementById('orbit-view');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}

function drawOrbitCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;

  // Clear Canvas (Space Dark)
  ctx.fillStyle = '#0E1617';
  ctx.fillRect(0, 0, width, height);

  // Background Starfield Grid
  ctx.strokeStyle = 'rgba(169, 151, 223, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let r = 50; r <= 220; r += 50) {
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
  }
  ctx.stroke();

  // Central Sun
  ctx.save();
  const sunGrad = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, 18);
  sunGrad.addColorStop(0, '#FFF5C2');
  sunGrad.addColorStop(0.4, '#FBBF24');
  sunGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Scale: 1 AU = 80 pixels
  const pxPerAU = 70 * userScale;

  // 1. Earth Orbit (1.0 AU Circle)
  const earthRadiusPx = 1.0 * pxPerAU;
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthRadiusPx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Earth Position
  const earthX = centerX + Math.cos(animAngle) * earthRadiusPx;
  const earthY = centerY + Math.sin(animAngle) * earthRadiusPx;
  ctx.fillStyle = '#60A5FA';
  ctx.beginPath();
  ctx.arc(earthX, earthY, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Earth (1.0 AU)', earthX + 8, earthY + 3);

  // 2. Asteroid Keplerian Orbit
  if (activeOrbitObject) {
    const q = activeOrbitObject.q || 1.0;
    const rawQ = activeOrbitObject.Q || (q * 1.5);
    // Cap visual display Q for hyperbolic or 10,000+ AU comets so ellipse remains readable
    const Q = Math.min(rawQ, 6.0);
    const a = (q + Q) / 2;
    const e = Math.min((Q - q) / (Q + q), 0.95);
    const b = a * Math.sqrt(Math.max(0.01, 1 - e * e));

    const aPx = a * pxPerAU;
    const bPx = b * pxPerAU;
    const cPx = aPx * e; // Focus distance from ellipse center

    // The Sun is at focus (centerX, centerY). Center of ellipse is shifted left by cPx
    const ellipseCenterX = centerX - cPx;
    const ellipseCenterY = centerY;

    // Draw Asteroid Orbit Ellipse
    ctx.strokeStyle = activeOrbitObject.pha === 'Y' ? '#F87171' : '#A997DF';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(ellipseCenterX, ellipseCenterY, aPx, bPx, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Mark Perihelion (q) and Aphelion (Q)
    const perihelionX = ellipseCenterX + aPx; // Closest to sun
    const perihelionY = ellipseCenterY;
    const aphelionX = ellipseCenterX - aPx;   // Farthest from sun
    const aphelionY = ellipseCenterY;

    // Perihelion marker
    ctx.fillStyle = '#34D399';
    ctx.beginPath();
    ctx.arc(perihelionX, perihelionY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`q=${q.toFixed(2)} AU`, perihelionX + 6, perihelionY - 6);

    // Aphelion marker
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.arc(aphelionX, aphelionY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`Q=${Q.toFixed(2)} AU`, aphelionX - 55, aphelionY - 6);

    // Asteroid Moving Position
    // Speed varies roughly with Kepler's law: faster at perihelion
    const astAngle = animAngle * (1.0 / Math.max(0.4, Math.sqrt(a)));
    const astX = ellipseCenterX + Math.cos(astAngle) * aPx;
    const astY = ellipseCenterY + Math.sin(astAngle) * bPx;

    ctx.fillStyle = activeOrbitObject.pha === 'Y' ? '#EF4444' : '#C084FC';
    ctx.beginPath();
    ctx.arc(astX, astY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(activeOrbitObject.designation, astX + 9, astY + 4);
  }
}

/* ===================================================================
   5. Full 451-NEO Catalog Explorer
   =================================================================== */

let currentPage = 1;
const pageSize = 20;
let filteredRecords = [];

function initCatalog() {
  const searchInput = document.getElementById('catalog-search');
  const classSelect = document.getElementById('filter-orbit-class');
  const phaSelect = document.getElementById('filter-pha');
  const btnPrev = document.getElementById('btn-prev-page');
  const btnNext = document.getElementById('btn-next-page');

  filteredRecords = [...NEOWISE_DATA.records];

  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    const orbitClass = classSelect.value;
    const phaVal = phaSelect.value;

    filteredRecords = NEOWISE_DATA.records.filter(r => {
      // Search
      if (query && !r.designation.toLowerCase().includes(query)) {
        return false;
      }
      // Orbit Class
      if (orbitClass !== 'ALL' && r.orbitClass !== orbitClass) {
        return false;
      }
      // PHA
      if (phaVal === 'Y' && r.pha !== 'Y') return false;
      if (phaVal === 'N' && r.pha !== 'N') return false;
      if (phaVal === 'UNKNOWN' && r.pha !== null) return false;

      return true;
    });

    currentPage = 1;
    renderCatalogPage();
  }

  searchInput.addEventListener('input', applyFilters);
  classSelect.addEventListener('change', applyFilters);
  phaSelect.addEventListener('change', applyFilters);

  btnPrev.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderCatalogPage();
    }
  });

  btnNext.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredRecords.length / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      renderCatalogPage();
    }
  });

  renderCatalogPage();
}

function renderCatalogPage() {
  const tbody = document.getElementById('catalog-table-body');
  const info = document.getElementById('pagination-info');
  const btnPrev = document.getElementById('btn-prev-page');
  const btnNext = document.getElementById('btn-next-page');

  const total = filteredRecords.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const start = (currentPage - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageItems = filteredRecords.slice(start, end);

  info.textContent = total > 0 
    ? `Showing ${start + 1} to ${end} of ${total} objects` 
    : 'No matching asteroids found';

  btnPrev.disabled = currentPage <= 1;
  btnNext.disabled = currentPage >= totalPages;

  if (pageItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding:2rem; color:var(--text-muted);">No objects match the search criteria.</td></tr>';
    return;
  }

  const rows = pageItems.map(obj => {
    let phaBadge = '<span class="badge" style="background:#F1F5F9; color:#64748B;">Unknown</span>';
    if (obj.pha === 'Y') phaBadge = '<span class="badge badge-hazard">Y</span>';
    if (obj.pha === 'N') phaBadge = '<span class="badge badge-safe">N</span>';

    return `
      <tr>
        <td><strong>${obj.designation}</strong></td>
        <td class="num">${obj.discoveryDate || 'n/a'}</td>
        <td class="num">${obj.hMag !== null ? obj.hMag.toFixed(2) : 'n/a'}</td>
        <td class="num">${obj.moid !== null ? obj.moid.toFixed(4) : 'n/a'}</td>
        <td class="num">${obj.q !== null ? obj.q.toFixed(2) : 'n/a'}</td>
        <td class="num">${obj.Q !== null ? obj.Q.toFixed(2) : 'n/a'}</td>
        <td class="num">${obj.period !== null ? (obj.period > 1000 ? obj.period.toLocaleString() : obj.period.toFixed(2)) : 'n/a'}</td>
        <td class="num">${obj.i !== null ? obj.i.toFixed(1) : 'n/a'}°</td>
        <td>${phaBadge}</td>
        <td><span class="badge badge-class">${obj.orbitClass}</span></td>
        <td>
          <button class="btn-sm" onclick="selectObjectForOrbit('${obj.designation}')">
            Plot Orbit
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = rows.join('');
}

/* ===================================================================
   6. Authentic Notebook Plot Viewer Modal
   =================================================================== */

function openPlotModal(imageSrc, title) {
  const modal = document.getElementById('plotModal');
  const img = document.getElementById('modalImg');
  const titleEl = document.getElementById('modalTitle');

  img.src = imageSrc;
  titleEl.textContent = title;
  modal.classList.add('active');
}

function closePlotModal(event) {
  if (event && event.target.id !== 'plotModal' && !event.target.classList.contains('modal-close')) {
    return;
  }
  const modal = document.getElementById('plotModal');
  modal.classList.remove('active');
}
