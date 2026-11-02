# ☄️ Orbital & Hazard Analysis of Near-Earth Objects (NASA NEOWISE)

[![Dataset: NASA CNEOS](https://img.shields.io/badge/Dataset-NASA%20CNEOS-0B3D91?style=for-the-badge&logo=nasa&logoColor=white)](https://cneos.jpl.nasa.gov/)
[![Python 3.8+](https://img.shields.io/badge/Python-3.8%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Pandas](https://img.shields.io/badge/Data%20Analysis-Pandas%20%7C%20NumPy%20%7C%20SciPy-150458?style=for-the-badge&logo=pandas&logoColor=white)](https://pandas.pydata.org/)
[![Visualization](https://img.shields.io/badge/Visuals-Matplotlib%20%7C%20Seaborn%20%7C%20Chart.js-FF6F61?style=for-the-badge)](https://matplotlib.org/)
[![Interactive Dashboard](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20Canvas%20%7C%20JS-E34F26?style=for-the-badge&logo=html5&logoColor=white)](index.html)
[![Academic Project](https://img.shields.io/badge/Course-Software%20Lab%20Mini--Project-4CAF50?style=for-the-badge)](NASA_NEOWISE_Mini_Project_Report_Group_15.docx)

An end-to-end astronomical data engineering, statistical modeling, planetary defense screening, and interactive web dashboard study of **451 Near-Earth Objects (NEOs)** and comets cataloged by the **NASA WISE / NEOWISE** space telescope mission.

Developed as a Software Lab Mini-Project by **Group 15 (Section A5)**.

---

## 📌 Table of Contents

- [Executive Summary](#executive-summary)
- [Team Members & Module Allocation](#team-members--module-allocation)
- [Project Architecture & Modular Pipeline](#project-architecture--modular-pipeline)
  - [Module 1: Ingestion, Schema Audit & Sentinel Sanitization](#module-1-ingestion-schema-audit--sentinel-sanitization)
  - [Module 2: Descriptive Statistics & Keplerian Feature Engineering](#module-2-descriptive-statistics--keplerian-feature-engineering)
  - [Module 3: Planetary Defense, Close Approaches & Correlation Testing](#module-3-planetary-defense-close-approaches--correlation-testing)
  - [Module 4: Visual Analytics & Mission Discovery Trends](#module-4-visual-analytics--mission-discovery-trends)
- [Interactive Web Application & Simulation Suite](#interactive-web-application--simulation-suite)
- [Dataset Specification & Dictionary](#dataset-specification--dictionary)
- [Key Scientific & Analytical Findings](#key-scientific--analytical-findings)
- [Repository Structure](#repository-structure)
- [Installation & Quickstart Guide](#installation--quickstart-guide)
  - [Option A: Running the Python / Jupyter Notebook Pipeline](#option-a-running-the-python--jupyter-notebook-pipeline)
  - [Option B: Launching the Interactive Web Dashboard](#option-b-launching-the-interactive-web-dashboard)
- [Analytical Figures & Visualizations](#analytical-figures--visualizations)
- [References & Acknowledgements](#references--acknowledgements)

---

## 🛰️ Executive Summary

The **Wide-field Infrared Survey Explorer (WISE)** and its extended mission **NEOWISE** (operated by NASA JPL / Caltech) surveyed the sky in thermal infrared wavelengths, discovering hundreds of thousands of celestial objects and characterizing over 3,000 Near-Earth Asteroids and comets.

This project delivers a multi-stage astronomical data science study of **451 space bodies** from the NASA Center for Near-Earth Object Studies (CNEOS) discovery catalog. The pipeline bridges data engineering, rigorous statistical testing, planetary defense screening, and an interactive, client-side web application.

```
       RAW TELEMETRY                       CLEANED PIPELINE                   ANALYTICAL PLATFORM
┌─────────────────────────┐           ┌────────────────────────┐           ┌─────────────────────────┐
│ NASA CNEOS Catalog      │           │ • Sentinel Purging     │           │ • Interactive Dashboard │
│ • 451 Records           │ ────────> │ • Keplerian Derivations│ ────────> │ • Kepler Orbit Visualizer│
│ • Corrupted 99.99 H mag │           │ • Hypothesis Testing   │           │ • PHA Dual-Filter Sim   │
│ • Sentinel Missing Tags │           │ • Statistical Imputation│           │ • 451-Object Explorer   │
└─────────────────────────┘           └────────────────────────┘           └─────────────────────────┘
```

---

## 👥 Team Members & Module Allocation

**Group 15 | Section A5**

| Section / Module | Assigned Investigator | Roll Number | Batch | Core Responsibilities |
| :--- | :--- | :---: | :---: | :--- |
| **Module 1** | **Radhika Dhingra** | **27** | B2 | Data ingestion, schema inspection, sentinel value filtering (`99.99` mag comae correction), missing token normalization, type coercion. |
| **Module 2** | **Kalpak Kamble** | **13** | B1 | Univariate statistics, dispersion analysis (IQR, variance, skewness), Keplerian orbital feature engineering ($e$ and $\Delta r$). |
| **Module 3** | **Chaitanya Selote** | **14** | B1 | Orbit class profiling, dual-criterion PHA planetary defense screening, top 10 close approaches, Pearson hypothesis testing, statistical imputation. |
| **Module 4** | **Ved Rai** | **33** | B2 | Visual analytics, Matplotlib/Seaborn multi-panel figures, magnitude distributions, PHA cross-tabulations, temporal discovery timelines. |

---

## 🔬 Project Architecture & Modular Pipeline

### Module 1: Ingestion, Schema Audit & Sentinel Sanitization
*Lead: Radhika Dhingra*

Raw astronomical catalogs often encode non-detections or observational limitations as numerical sentinel flags rather than standard missing tokens. In comets with diffuse gas-dust comae, lacking sharp optical disc boundaries, catalogs inject an arbitrary brightness sentinel of **`99.99 mag`**.

```python
# Purge string tokens and astronomical placeholder artifacts
df = df.replace(["??", "##", "n/a", "N/A", "NA"], np.nan)
df["H (mag)"] = pd.to_numeric(df["H (mag)"], errors="coerce")
df["H (mag)"] = df["H (mag)"].replace(99.99, np.nan)

# Enforce strict 64-bit float precision across astronomical parameters
numeric_cols = ["H (mag)", "MOID (au)", "q (au)", "Q (au)", "period (yr)", "i (deg)"]
for col in numeric_cols:
    df[col] = pd.to_numeric(df[col], errors="coerce")

# Parse ISO-8601 discovery timestamps
df["Discovery Date (YYYY-MM-DD)"] = pd.to_datetime(df["Discovery Date (YYYY-MM-DD)"])
```

**Impact of Sentinel Removal:**
- **Raw Mean $H$:** $27.004\text{ mag}$ ($\sigma = 21.829$)
- **Cleaned Mean $H$:** $20.525\text{ mag}$ ($\sigma = 1.636$)
- **Max $H$:** Reduced from an unphysical $99.99$ to a realistic $26.78\text{ mag}$ ($~15\text{ m}$ sub-kilometer body).
- **Integrity Audit:** 0 duplicate rows across 451 unique NASA designations.

---

### Module 2: Descriptive Statistics & Keplerian Feature Engineering
*Lead: Kalpak Kamble*

Using orbital apsides—perihelion distance $q$ (closest approach to Sun) and aphelion distance $Q$ (farthest distance from Sun)—two physical Keplerian features were engineered:

1. **Orbital Eccentricity ($e$):**
   $$\text{Eccentricity } (e) = \frac{Q - q}{Q + q}$$
   Measures orbital deviation from circularity ($0 = \text{circular}$, $0 < e < 1 = \text{elliptical}$, $e \ge 1 = \text{parabolic/hyperbolic}$).
   - *Catalog Range:* $0.0054$ to $0.999994$ (Mean: $0.526$).

2. **Orbital Span / Radial Extent ($\Delta r$):**
   $$\Delta r = Q - q = 2ae$$
   Linear radial breadth swept by the object across its orbit.
   - *Catalog Range:* $0.03\text{ AU}$ (tight Aten orbits) to $338,830.42\text{ AU}$ (extreme Oort-cloud comets).

#### Univariate Statistical Summary

| Astronomical Parameter | Unit | Count | Mean | Median | Std Dev | Skewness | IQR (25% - 75%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Absolute Magnitude ($H$)** | mag | 383 | 20.525 | 20.380 | 1.636 | +0.437 | 19.47 – 21.47 |
| **Earth MOID** | AU | 425 | 0.340 | 0.162 | 0.580 | +4.906 | 0.05 – 0.34 |
| **Perihelion ($q$)** | AU | 451 | 1.050 | 1.000 | 0.530 | +1.579 | 0.77 – 1.20 |
| **Aphelion ($Q$)** | AU | 430 | 794.673 | 2.970 | 16,339.73 | +20.736 | 2.15 – 3.79 |
| **Orbital Period** | yr | 430 | 118,527.18 | 3.015 | 2,456,863.3 | +20.736 | 1.74 – 4.09 |
| **Inclination ($i$)** | deg | 451 | 20.760 | 14.800 | 19.980 | +2.235 | 7.90 – 26.90 |

> **Note on Extreme Skewness:** Parameters $Q$, period, and $\Delta r$ exhibit massive right-skew ($+20.7$) because long-period comets have nearly parabolic orbits reaching tens of thousands of AU into interstellar space, while NEAs remain confined within 1 to 5 AU.

---

### Module 3: Planetary Defense, Close Approaches & Correlation Testing
*Lead: Chaitanya Selote*

#### NASA Dual-Criterion Potentially Hazardous Asteroid (PHA) Definition
NASA classifies an asteroid as a PHA **if and only if both conditions are satisfied**:
1. **Minimum Orbit Intersection Distance:** $\text{MOID} \le 0.05\text{ AU}$ (~19.5 Lunar Distances / $\approx 7.48 \times 10^6\text{ km}$).
2. **Absolute Magnitude Threshold:** $H \le 22.0\text{ mag}$ (corresponding to estimated diameter $\ge 140\text{ meters}$ at an assumed albedo of 0.14).

```
                      NASA PHA CLASSIFICATION MATRIX
                   ┌──────────────────────┬──────────────────────┐
                   │    H ≤ 22.0 mag      │     H > 22.0 mag     │
                   │ (Diameter ≥ 140 m)   │ (Diameter < 140 m)   │
┌──────────────────┼──────────────────────┼──────────────────────┤
│ MOID ≤ 0.05 AU   │      PHA = YES       │       PHA = NO       │
│ (Close Approach) │ (Hazardous Threat)   │ (Too Small to Harm)  │
├──────────────────┼──────────────────────┼──────────────────────┤
│ MOID > 0.05 AU   │       PHA = NO       │       PHA = NO       │
│ (Distant Orbit)  │ (No Close Approach)  │ (Distant & Small)    │
└──────────────────┴──────────────────────┴──────────────────────┘
```

*Scientific Proof Case:* Object **(2010 LV108)** approaches Earth at $\text{MOID} = 0.002\text{ AU}$ ($~300,000\text{ km}$, inside lunar orbit), but has $H = 22.36\text{ mag}$ ($<140\text{ m}$). It is designated **Non-Hazardous (N)** because atmospheric ablation would prevent regional catastrophe.

#### Top 10 Closest Earth Approaches in NEOWISE Catalog

| Rank | Designation | Discovery Date | MOID (au) | MOID (km) | $H$ (mag) | $q$ (au) | $Q$ (au) | PHA Status | Orbit Class |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **#1** | **(2010 MU112)** | 2010-06-25 | **0.0003** | ~44,880 | 18.37 | 0.81 | 2.70 | **PHA = Y** | Apollo |
| **#2** | **(2010 LV108)** | 2010-06-08 | **0.0020** | ~299,200 | 22.36 | 0.69 | 1.70 | PHA = N | Apollo |
| **#3** | **(2010 AG79)** | 2010-01-13 | **0.0028** | ~418,870 | 19.82 | 0.77 | 3.32 | **PHA = Y** | Apollo |
| **#4** | **(2010 DJ)** | 2010-02-17 | **0.0034** | ~508,630 | 21.05 | 0.78 | 1.83 | **PHA = Y** | Apollo |
| **#5** | **(2010 NY65)** | 2010-07-10 | **0.0038** | ~568,470 | 21.51 | 0.63 | 1.38 | **PHA = Y** | Aten |
| **#6** | **(2010 KR)** | 2010-05-16 | **0.0041** | ~613,350 | 20.35 | 0.87 | 1.48 | **PHA = Y** | Apollo |
| **#7** | **(2010 LK)** | 2010-06-02 | **0.0045** | ~673,190 | 18.52 | 0.90 | 2.45 | **PHA = Y** | Apollo |
| **#8** | **(2010 CH18)** | 2010-02-09 | **0.0048** | ~718,070 | 18.96 | 0.80 | 2.62 | **PHA = Y** | Apollo |
| **#9** | **(2010 LE43)** | 2010-06-07 | **0.0050** | ~747,990 | 19.43 | 0.86 | 3.03 | **PHA = Y** | Apollo |
| **#10**| **(2010 KG43)** | 2010-05-18 | **0.0052** | ~777,910 | 21.78 | 0.75 | 1.74 | **PHA = Y** | Apollo |

> **Key Orbital Finding:** 100% of the top 10 closest approaches belong to **Apollo (90%)** and **Aten (10%)** classes. Zero Amor, comets, or outer asteroids penetrate this close-approach envelope.

#### Pearson Correlation & Hypothesis Testing: Perihelion ($q$) vs Aphelion ($Q$)
- **Hypothesis $H_0$:** There is no linear correlation between perihelion distance ($q$) and aphelion distance ($Q$) ($\rho = 0$).
- **Hypothesis $H_1$:** There is a significant linear correlation between $q$ and $Q$ ($\rho \ne 0$).
- **Observed Pearson $r$:** $+0.0268$
- **Two-Tailed $p$-value:** $0.5713$ ($\alpha = 0.05$)
- **Verdict:** **Fail to Reject $H_0$ ($p > 0.05$)**. Perihelion distance and aphelion distance are statistically independent across NEOWISE objects.

#### Non-Destructive Statistical Imputation
To satisfy downstream machine-learning models requiring non-null feature tensors without altering raw scientific baselines:
- **MOID Imputation:** Continuous, right-skewed metric imputed using distribution mean ($\mu = 0.3399\text{ AU}$).
- **Absolute Magnitude ($H$) Imputation:** Centered observational metric imputed using mode ($\text{Mode} = 19.14\text{ mag}$).
- **Result:** Complete feature matrix with zero missing entries.

---

### Module 4: Visual Analytics & Mission Discovery Trends
*Lead: Ved Rai*

Module 4 delivers extensive visual explorations across multiple astronomical dimensions:
1. **PHA Status Breakdown:** Out of 411 evaluated asteroids, **64 are confirmed PHAs (15.6%)**, 347 are Non-Hazardous (84.4%), and 40 comets/unclassified bodies remain unflagged.
2. **Absolute Magnitude Distribution:** Bell-shaped distribution centered around $H \approx 20.5\text{ mag}$, reflecting NEOWISE's observational sensitivity threshold in thermal infrared.
3. **Mission Timeline Analytics:** Strong peaks during the cryogenic discovery period (2010), followed by steady NEO characterization following the NEOWISE reactivation.
4. **Hazard Stratification by Orbit Class:** Among the 64 PHAs:
   - **Apollo asteroids:** 52 objects (~81.3%)
   - **Aten asteroids:** 9 objects (~14.1%)
   - **Amor asteroids:** 3 objects (~4.7%)
   - Main-belt and cometary bodies: 0 PHAs.

---

## 💻 Interactive Web Application & Simulation Suite

The project includes a client-side web application built with **pure HTML5, CSS3, JavaScript, HTML5 Canvas, and Chart.js**.

```
index.html                  app.js                     data.js                styles.css
┌──────────────────┐       ┌──────────────────┐       ┌──────────────┐       ┌──────────────────┐
│ Semantic Layout  │ <===> │ Canvas Engine &  │ <===> │ 451 Catalog  │ <===> │ Responsive Theme │
│ Top Navigation   │       │ Chart.js Init    │       │ Precomputed  │       │ Dark Slate /     │
│ Modal Overlay    │       │ Sim & Filtering  │       │ Statistics   │       │ Space Palette    │
└──────────────────┘       └──────────────────┘       └──────────────┘       └──────────────────┘
```

### Core Features

1. **Planetary Defense Dual-Filter Simulator:**
   - Real-time dynamic range sliders for **MOID Threshold** ($0.001 - 0.50\text{ AU}$) and **$H$ Magnitude** ($15.0 - 27.0\text{ mag}$).
   - Instant count of candidate objects and confirmed PHAs meeting user-defined criteria.
   - Live interactive candidate table with direct 1-click orbital visualizer targeting.

2. **2D Keplerian Solar System Orbit Visualizer (HTML5 Canvas):**
   - Renders the central Sun, Earth's reference circular orbit ($r = 1.0\text{ AU}$), and the target asteroid's elliptical Keplerian trajectory.
   - Calculates semi-major axis $a = (q + Q)/2$, semi-minor axis $b = a\sqrt{1 - e^2}$, and focal offset $c = ae$.
   - Animated orbital motion with pause/resume controls and dynamic auto-zoom scaling.
   - Live **Orbital Telemetry HUD** displaying $q$, $Q$, $a$, $e$, orbital inclination $i$, and Earth MOID.

3. **Complete 451-NEO Catalog Explorer:**
   - Real-time text search across all NASA designations.
   - Dual dropdown filters for **14 Orbit Classes** and **PHA Status** (`Y`, `N`, `Unclassified`).
   - Paginated display (20 items/page) with full astronomical telemetry and interactive "Plot Orbit" hooks.

4. **Authentic Notebook Analytical Plot Viewer:**
   - In-app modal previewing the original high-resolution Matplotlib/Seaborn figures generated during notebook runs.

---

## 📊 Dataset Specification & Dictionary

- **Source:** NASA Jet Propulsion Laboratory (JPL) / Center for Near-Earth Object Studies (CNEOS)
- **Mission:** WISE (Wide-field Infrared Survey Explorer) & NEOWISE
- **Records:** 451 objects
- **Attributes:** 10 columns

| Column Name | Data Type | Units | Description & Scientific Significance |
| :--- | :---: | :---: | :--- |
| **`Designation`** | `string` | — | Official NASA / MPC catalogue designation (e.g., `(2010 MU112)`). |
| **`Discovery Date (YYYY-MM-DD)`** | `datetime64[ns]` | Date | Timestamp of discovery by the NEOWISE space telescope. |
| **`H (mag)`** | `float64` | Magnitude | Absolute visual magnitude; proxy for object size (lower $H$ = larger object). |
| **`MOID (au)`** | `float64` | AU | Minimum Orbit Intersection Distance to Earth (~$1\text{ AU} \approx 1.496 \times 10^8\text{ km}$). |
| **`q (au)`** | `float64` | AU | Perihelion distance: closest approach to the Sun. |
| **`Q (au)`** | `float64` | AU | Aphelion distance: farthest orbital distance from the Sun. |
| **`period (yr)`** | `float64` | Years | Sidereal orbital period around the Sun. |
| **`i (deg)`** | `float64` | Degrees | Orbital inclination relative to the ecliptic plane. |
| **`PHA`** | `category` | `Y`/`N`/`NaN` | Potentially Hazardous Asteroid classification flag. |
| **`Orbit Class`** | `category` | — | Orbital family (`Apollo`, `Amor`, `Aten`, `Comet`, `MBA`, etc.). |

---

## 📈 Key Scientific & Analytical Findings

1. **Crucial Role of Astronomical Sentinel Purging:**
   Cometary placeholder magnitude $99.99$ inflated raw sample mean $H$ by $+6.48\text{ mag}$ and distorted variance by a factor of 178 ($476.5$ vs $2.68$). Purging sentinels restored genuine physical parameters.
2. **Trajectory Family Breakdown:**
   - Apollo asteroids represent **47.5%** of the NEOWISE catalog ($q \le 1.017\text{ AU}, a \ge 1.0\text{ AU}$).
   - Amor asteroids comprise **27.3%** ($1.017 < q \le 1.3\text{ AU}$).
   - Aten asteroids comprise **7.3%** ($a < 1.0\text{ AU}, Q \ge 0.983\text{ AU}$).
   - Outer asteroids and cometary trajectories constitute the remaining 17.9%.
3. **Planetary Hazard Concentration:**
   Of the 64 PHAs identified, **81.3% are Apollo asteroids** and **14.1% are Aten asteroids**. Their Earth-crossing geometries make them primary candidates for planetary defense monitoring.
4. **Closest Earth Approach:**
   Apollo asteroid **(2010 MU112)** holds the lowest MOID in the dataset at **$0.0003\text{ AU}$ (~$44,880\text{ km}$)**, which is just above geostationary satellite orbit ($~35,786\text{ km}$).

---

## 📂 Repository Structure

```
SL_MiniProject/
├── README.md                                      # Comprehensive project documentation
├── NASA_NEOWISE-MiniProject.ipynb                # End-to-end Python data pipeline & analysis
├── NASA_NEOWISE_Mini_Project_Report_Group_15.docx # Formal academic technical report
├── neowise.csv                                    # Raw NASA CNEOS discovery dataset (451 records)
│
├── index.html                                     # Web application entry point & dashboard layout
├── styles.css                                     # Modular styles, responsive CSS grid & dark theme
├── app.js                                         # Web app logic, Canvas visualizer & interactive sim
├── data.js                                        # JSON-formatted catalog & precomputed statistics
│
└── assets/
    └── charts/                                    # Exported high-res analytical figures
        ├── boxplots_numerical.png                 # Feature distribution boxplots (Cell 27)
        ├── correlation_heatmap.png                # Parameter Pearson correlation matrix (Cell 28)
        ├── discoveries_by_orbit.png               # Trajectory classes discovered per year (Cell 22)
        ├── discoveries_by_year.png                # Total mission discoveries timeline (Cell 21)
        ├── magnitude_hist.png                     # Absolute magnitude H distribution (Cell 20)
        ├── moid_by_year.png                       # Annual mean MOID trend (Cell 23)
        ├── moid_vs_magnitude.png                  # MOID vs H scatter with PHA boundary (Cell 24)
        ├── pairplot.png                           # Multi-feature Seaborn pairplot (Cell 29)
        ├── pha_distribution.png                   # Overall PHA proportion pie chart (Cell 19)
        ├── pha_orbit_bar.png                      # PHA counts grouped by orbit class (Cell 26)
        └── pha_orbit_pie.png                      # Trajectory distribution of PHAs (Cell 25)
```

---

## 🚀 Installation & Quickstart Guide

### Option A: Running the Python / Jupyter Notebook Pipeline

#### Prerequisites
- Python 3.8 or higher
- Jupyter Notebook / JupyterLab or VS Code with Jupyter Extension

#### 1. Clone or Navigate to Repository
```bash
cd SL_MiniProject
```

#### 2. Create and Activate a Virtual Environment
**On Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**On macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 3. Install Dependencies
```bash
pip install pandas numpy scipy matplotlib seaborn jupyter
```

#### 4. Launch Jupyter Notebook
```bash
jupyter notebook NASA_NEOWISE-MiniProject.ipynb
```
Select **Kernel > Restart & Run All** to reproduce all calculations, tables, hypothesis tests, and figure exports.

---

### Option B: Launching the Interactive Web Dashboard

The web dashboard is self-contained and runs in any modern browser without complex build steps or Node.js dependencies.

#### Method 1: Instant Browser Launch
Double-click `index.html` or open it directly in Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari.

#### Method 2: Python HTTP Server (Recommended)
Running through a local web server ensures seamless asset loading:
```bash
# In the project root directory:
python -m http.server 8000
```
Then open your web browser and navigate to:
```
http://localhost:8000
```

---

## 🖼️ Analytical Figures & Visualizations

All figures generated by `NASA_NEOWISE-MiniProject.ipynb` are archived in [`assets/charts/`](assets/charts/):

| Figure | Description | Notebook Source |
| :--- | :--- | :---: |
| [`pha_distribution.png`](assets/charts/pha_distribution.png) | Overall proportion of Potentially Hazardous Asteroids (PHAs). | Cell 19 |
| [`magnitude_hist.png`](assets/charts/magnitude_hist.png) | Distribution of absolute magnitude ($H$) showing optical sensitivity limit. | Cell 20 |
| [`discoveries_by_year.png`](assets/charts/discoveries_by_year.png) | Discovery count timeline illustrating primary cryogenic mission phases. | Cell 21 |
| [`discoveries_by_orbit.png`](assets/charts/discoveries_by_orbit.png) | Breakdown of orbit classes discovered per mission year. | Cell 22 |
| [`moid_by_year.png`](assets/charts/moid_by_year.png) | Mean Earth MOID evolution across discovery years. | Cell 23 |
| [`moid_vs_magnitude.png`](assets/charts/moid_vs_magnitude.png) | Scatter of MOID vs $H$ with PHA dual-criterion boundary demarcations. | Cell 24 |
| [`pha_orbit_pie.png`](assets/charts/pha_orbit_pie.png) | Proportional distribution of orbital families among confirmed PHAs. | Cell 25 |
| [`pha_orbit_bar.png`](assets/charts/pha_orbit_bar.png) | Cross-tabulation bar chart of PHA vs Non-PHA across orbit classes. | Cell 26 |
| [`boxplots_numerical.png`](assets/charts/boxplots_numerical.png) | Univariate distribution boxplots displaying outliers across features. | Cell 27 |
| [`correlation_heatmap.png`](assets/charts/correlation_heatmap.png) | Pearson correlation coefficient matrix across all orbital features. | Cell 28 |
| [`pairplot.png`](assets/charts/pairplot.png) | Multi-feature Seaborn pairplot stratified by PHA status. | Cell 29 |

---

## 📚 References & Acknowledgements

1. **NASA Jet Propulsion Laboratory (JPL):** Center for Near-Earth Object Studies (CNEOS) – [cneos.jpl.nasa.gov](https://cneos.jpl.nasa.gov/)
2. **WISE / NEOWISE Mission:** Mainzer, A., et al. (2011). *Initial Results from the NEOWISE Space Telescope Mission*. The Astrophysical Journal.
3. **NASA Planetary Defense Coordination Office (PDCO):** Near-Earth Object Hazard Mitigation Criteria.
4. **Chart.js Community:** Open-source HTML5 canvas data visualization library.
5. **Course Staff & Mentors:** Software Lab Course Instructors, Section A5.

---

<p align="center">
  <strong>Software Lab Mini-Project • Group 15 • Section A5</strong><br>
  Astronomical Data Engineering & Planetary Defense Study
</p>
