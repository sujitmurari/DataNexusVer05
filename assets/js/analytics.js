// Analytics Lab engine for DataNexus
// Handles CSV/XLS(X) ingestion, profiling, stats, charts, and correlation heatmap.

(function () {
  const fileInput = document.getElementById("datasetInput");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const loadingEl = document.getElementById("labLoading");
  const metaEl = document.getElementById("datasetMeta");
  const insightsGrid = document.getElementById("insightsGrid");
  const datasetProfileEl = document.getElementById("datasetProfile");
  const chartGrid = document.getElementById("chartGrid");

  if (!fileInput || !analyzeBtn || !insightsGrid || !datasetProfileEl || !chartGrid) {
    // Not on lab page
    return;
  }

  const MAX_ROWS = 10000;

  let currentData = [];
  let numericColumns = [];
  let chartConfigs = [];
  let charts = {};
  let observer = null;

  function showLoading(show) {
    if (!loadingEl) return;
    loadingEl.style.display = show ? "flex" : "none";
  }

  function setMeta(text) {
    if (metaEl) metaEl.textContent = text;
  }

  function isNumeric(value) {
    if (value === null || value === undefined || value === "") return false;
    if (typeof value === "number") return Number.isFinite(value);
    const n = Number(value);
    return Number.isFinite(n);
  }

  function coerceNumber(value) {
    if (typeof value === "number") return value;
    const n = Number(value);
    return Number.isFinite(n) ? n : NaN;
  }

  function summarizeColumns(rows) {
    if (!rows.length) return { numericColumns: [], columns: [] };

    const cols = Object.keys(rows[0] || {});
    const numericCols = [];

    for (const col of cols) {
      let numericCount = 0;
      let nonNullCount = 0;
      const sampleSize = Math.min(rows.length, 200);

      for (let i = 0; i < sampleSize; i++) {
        const v = rows[i][col];
        if (v === null || v === undefined || v === "") continue;
        nonNullCount++;
        if (isNumeric(v)) numericCount++;
      }

      if (nonNullCount > 0 && numericCount / nonNullCount >= 0.7) {
        numericCols.push(col);
      }
    }

    return { numericColumns: numericCols, columns: cols };
  }

  function computeStats(values) {
    const clean = values
      .map(coerceNumber)
      .filter((n) => Number.isFinite(n));

    const n = clean.length;
    if (!n) {
      return {
        count: 0,
        mean: NaN,
        median: NaN,
        min: NaN,
        max: NaN,
        std: NaN,
      };
    }

    const count = n;
    const sorted = [...clean].sort((a, b) => a - b);
    const sum = clean.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;
    const mid = Math.floor(n / 2);
    const median =
      n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const variance =
      clean.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / n;
    const std = Math.sqrt(variance);

    return { count, mean, median, min, max, std };
  }

  function pearson(xVals, yVals) {
    const x = [];
    const y = [];
    for (let i = 0; i < xVals.length; i++) {
      const xv = coerceNumber(xVals[i]);
      const yv = coerceNumber(yVals[i]);
      if (Number.isFinite(xv) && Number.isFinite(yv)) {
        x.push(xv);
        y.push(yv);
      }
    }

    const n = x.length;
    if (n < 2) return NaN;

    const meanX = x.reduce((a, v) => a + v, 0) / n;
    const meanY = y.reduce((a, v) => a + v, 0) / n;

    let num = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    if (denomX === 0 || denomY === 0) return NaN;
    return num / Math.sqrt(denomX * denomY);
  }

  function updateInsightsPanel(rows, numericCols) {
    insightsGrid.innerHTML = "";

    if (!rows.length || !numericCols.length) {
      const div = document.createElement("div");
      div.className = "lab-empty-state";
      div.textContent =
        "No numeric fields detected. Ensure your dataset contains numeric columns.";
      insightsGrid.appendChild(div);
      return;
    }

    const recordCount = rows.length;
    const firstCol = numericCols[0];
    const vals = rows.map((r) => r[firstCol]);
    const stats = computeStats(vals);

    const metrics = [
      {
        label: "Records",
        value: recordCount.toLocaleString(),
        caption: "Total rows ingested",
      },
      {
        label: `Mean (${firstCol})`,
        value: Number.isFinite(stats.mean)
          ? stats.mean.toFixed(2)
          : "N/A",
        caption: "Arithmetic average",
      },
      {
        label: `Median (${firstCol})`,
        value: Number.isFinite(stats.median)
          ? stats.median.toFixed(2)
          : "N/A",
        caption: "Middle value",
      },
      {
        label: `Std Dev (${firstCol})`,
        value: Number.isFinite(stats.std)
          ? stats.std.toFixed(2)
          : "N/A",
        caption: "Distribution spread",
      },
      {
        label: `Min (${firstCol})`,
        value: Number.isFinite(stats.min)
          ? stats.min.toFixed(2)
          : "N/A",
        caption: "Lower bound",
      },
      {
        label: `Max (${firstCol})`,
        value: Number.isFinite(stats.max)
          ? stats.max.toFixed(2)
          : "N/A",
        caption: "Upper bound",
      },
    ];

    for (const m of metrics) {
      const card = document.createElement("div");
      card.className = "lab-metric";

      const label = document.createElement("div");
      label.className = "lab-metric-label";
      label.textContent = m.label;

      const value = document.createElement("div");
      value.className = "lab-metric-value";
      value.textContent = m.value;

      const caption = document.createElement("div");
      caption.className = "lab-metric-caption";
      caption.textContent = m.caption;

      card.appendChild(label);
      card.appendChild(value);
      card.appendChild(caption);
      insightsGrid.appendChild(card);
    }
  }

  function updateDatasetProfile(rows, numericCols, allCols) {
    if (!rows.length) {
      datasetProfileEl.textContent = "Waiting for dataset…";
      return;
    }

    const totalRows = rows.length;
    const totalCols = allCols.length;
    const numericCount = numericCols.length;

    const nonNumeric = allCols.filter((c) => !numericCols.includes(c));
    const sampleRow = rows[0] || {};

    const html = `
      <div style="font-size:0.8rem; line-height:1.6;">
        <div><strong>Rows:</strong> ${totalRows.toLocaleString()}</div>
        <div><strong>Columns:</strong> ${totalCols}</div>
        <div><strong>Numeric columns:</strong> ${
          numericCount ? numericCols.join(", ") : "None detected"
        }</div>
        <div><strong>Non-numeric columns:</strong> ${
          nonNumeric.length ? nonNumeric.join(", ") : "None"
        }</div>
        <div style="margin-top:0.4rem; opacity:0.7;">
          <strong>Sample row:</strong>
        </div>
        <pre style="margin-top:0.2rem; font-family:'Share Tech Mono',monospace; font-size:0.72rem; white-space:pre-wrap;">${JSON.stringify(
          sampleRow,
          null,
          2
        )}</pre>
      </div>
    `;

    datasetProfileEl.innerHTML = html;
  }

  function clearCharts() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    for (const key of Object.keys(charts)) {
      try {
        charts[key].destroy();
      } catch (e) {}
    }
    charts = {};
    chartConfigs = [];
    chartGrid.innerHTML = "";
  }

  function createChartShell(id, title, meta) {
    const card = document.createElement("div");
    card.className = "glow-card lab-chart-card";
    card.dataset.chartId = id;

    const header = document.createElement("div");
    header.className = "lab-chart-title";

    const titleSpan = document.createElement("span");
    titleSpan.textContent = title;

    const metaSpan = document.createElement("span");
    metaSpan.className = "lab-chart-meta";
    metaSpan.textContent = meta || "";

    header.appendChild(titleSpan);
    header.appendChild(metaSpan);

    const canvas = document.createElement("canvas");
    canvas.id = id;

    card.appendChild(header);
    card.appendChild(canvas);
    chartGrid.appendChild(card);

    return { card, canvas };
  }

  function buildCharts(rows, numericCols) {
    clearCharts();

    if (!rows.length || !numericCols.length) {
      const empty = document.createElement("div");
      empty.className = "lab-empty-state";
      empty.textContent =
        "No charts available. Ensure your dataset contains at least one numeric column.";
      chartGrid.appendChild(empty);
      return;
    }

    const indexLabel = rows.map((_, i) => i + 1);
    const firstCol = numericCols[0];
    const secondCol = numericCols[1] || numericCols[0];

    const values1 = rows.map((r) => coerceNumber(r[firstCol]));
    const values2 = rows.map((r) => coerceNumber(r[secondCol]));

    // Histogram
    (function () {
      const id = "chart-histogram";
      const { canvas } = createChartShell(
        id,
        "Histogram",
        firstCol
      );

      const clean = values1.filter((v) => Number.isFinite(v));
      if (!clean.length) return;

      const bins = 20;
      const min = Math.min(...clean);
      const max = Math.max(...clean);
      const width = (max - min || 1) / bins;
      const counts = new Array(bins).fill(0);
      const labels = [];

      for (let i = 0; i < bins; i++) {
        const start = min + i * width;
        const end = start + width;
        labels.push(start.toFixed(2) + "–" + end.toFixed(2));
      }
      for (const v of clean) {
        let idx = Math.floor((v - min) / width);
        if (idx < 0) idx = 0;
        if (idx >= bins) idx = bins - 1;
        counts[idx]++;
      }

      chartConfigs.push({
        id,
        canvas,
        config: {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: firstCol,
                data: counts,
                backgroundColor: "rgba(53, 224, 255, 0.5)",
                borderColor: "rgba(53, 224, 255, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { maxTicksLimit: 8 } },
            },
            plugins: { legend: { display: false } },
          },
        },
      });
      canvas.style.height = "220px";
    })();

    // Scatter
    (function () {
      const id = "chart-scatter";
      const { canvas } = createChartShell(
        id,
        "Scatter Plot",
        firstCol + (secondCol && secondCol !== firstCol ? " vs " + secondCol : "")
      );

      const points = [];
      for (let i = 0; i < rows.length; i++) {
        const x = coerceNumber(rows[i][firstCol]);
        const y = coerceNumber(rows[i][secondCol]);
        if (Number.isFinite(x) && Number.isFinite(y)) {
          points.push({ x, y });
        }
      }
      if (!points.length) return;

      chartConfigs.push({
        id,
        canvas,
        config: {
          type: "scatter",
          data: {
            datasets: [
              {
                label: firstCol + " vs " + secondCol,
                data: points,
                backgroundColor: "rgba(53, 224, 255, 0.6)",
                pointRadius: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                type: "linear",
                title: { display: true, text: firstCol },
              },
              y: {
                title: { display: true, text: secondCol },
              },
            },
          },
        },
      });
      canvas.style.height = "220px";
    })();

    // Line
    (function () {
      const id = "chart-line";
      const { canvas } = createChartShell(
        id,
        "Line Chart",
        firstCol + " over record index"
      );

      chartConfigs.push({
        id,
        canvas,
        config: {
          type: "line",
          data: {
            labels: indexLabel,
            datasets: [
              {
                label: firstCol,
                data: values1,
                borderColor: "rgba(53, 224, 255, 1)",
                backgroundColor: "rgba(53, 224, 255, 0.2)",
                borderWidth: 1,
                pointRadius: 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { display: true, ticks: { maxTicksLimit: 8 } },
              y: { display: true },
            },
          },
        },
      });
      canvas.style.height = "220px";
    })();

    // Bar (top 25)
    (function () {
      const id = "chart-bar";
      const { canvas } = createChartShell(
        id,
        "Bar Chart",
        "Top 25 values of " + firstCol
      );

      const entries = values1
        .map((v, i) => ({ v: coerceNumber(v), idx: i + 1 }))
        .filter((e) => Number.isFinite(e.v))
        .sort((a, b) => b.v - a.v)
        .slice(0, 25);

      if (!entries.length) return;

      chartConfigs.push({
        id,
        canvas,
        config: {
          type: "bar",
          data: {
            labels: entries.map((e) => "Row " + e.idx),
            datasets: [
              {
                label: firstCol,
                data: entries.map((e) => e.v),
                backgroundColor: "rgba(53, 224, 255, 0.4)",
                borderColor: "rgba(53, 224, 255, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { maxTicksLimit: 8 } },
            },
          },
        },
      });
      canvas.style.height = "220px";
    })();

    // Box plot (first up to 4 numeric columns)
    (function () {
      if (!numericCols.length) return;
      const id = "chart-box";
      const { canvas } = createChartShell(
        id,
        "Box Plot",
        "Distribution across numeric columns"
      );

      const labels = [];
      const data = [];

      const maxSeries = Math.min(4, numericCols.length);
      for (let i = 0; i < maxSeries; i++) {
        const col = numericCols[i];
        const vals = rows
          .map((r) => coerceNumber(r[col]))
          .filter((n) => Number.isFinite(n));
        if (!vals.length) continue;
        labels.push(col);
        data.push(vals);
      }

      if (!data.length) return;

      chartConfigs.push({
        id,
        canvas,
        config: {
          type: "boxplot",
          data: {
            labels,
            datasets: [
              {
                label: "Distribution",
                data,
                backgroundColor: "rgba(53, 224, 255, 0.25)",
                borderColor: "rgba(53, 224, 255, 1)",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
          },
        },
      });
      canvas.style.height = "220px";
    })();

    // Correlation heatmap
    (function () {
      if (numericCols.length < 2) return;

      const id = "chart-corr";
      const { canvas } = createChartShell(
        id,
        "Correlation Heatmap",
        "Pearson r between numeric columns"
      );

      const cols = numericCols;
      const matrix = [];

      for (let i = 0; i < cols.length; i++) {
        const row = [];
        for (let j = 0; j < cols.length; j++) {
          if (i === j) {
            row.push(1);
          } else {
            const r = pearson(
              rows.map((r) => r[cols[i]]),
              rows.map((r) => r[cols[j]])
            );
            row.push(r);
          }
        }
        matrix.push(row);
      }

      const data = [];
      for (let i = 0; i < cols.length; i++) {
        for (let j = 0; j < cols.length; j++) {
          data.push({ x: j, y: i, v: matrix[i][j] });
        }
      }

      function colorFor(v) {
        if (!Number.isFinite(v)) return "rgba(40,40,60,0.9)";
        const t = (v + 1) / 2;
        const r = Math.round(30 + 210 * t);
        const g = Math.round(60 + 40 * (1 - Math.abs(v)));
        const b = Math.round(230 - 210 * t);
        return `rgba(${r},${g},${b},0.9)`;
      }

      chartConfigs.push({
        id,
        canvas,
        config: {
          type: "matrix",
          data: {
            datasets: [
              {
                label: "Correlation",
                data,
                width: () => 20,
                height: () => 20,
                backgroundColor: (ctx) => {
                  const v = ctx.raw && ctx.raw.v;
                  return colorFor(v);
                },
                borderWidth: 1,
                borderColor: "rgba(10,10,25,0.9)",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                type: "linear",
                position: "top",
                ticks: {
                  callback: (v) => cols[v] || "",
                  maxTicksLimit: cols.length,
                },
              },
              y: {
                type: "linear",
                reverse: true,
                ticks: {
                  callback: (v) => cols[v] || "",
                  maxTicksLimit: cols.length,
                },
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  title: (items) => {
                    const raw = items[0].raw;
                    if (!raw) return "";
                    const xIdx = raw.x;
                    const yIdx = raw.y;
                    return `${cols[yIdx]} ↔ ${cols[xIdx]}`;
                  },
                  label: (item) => {
                    const v = item.raw && item.raw.v;
                    if (!Number.isFinite(v)) return "r: N/A";
                    return "r: " + v.toFixed(3);
                  },
                },
              },
            },
          },
        },
      });
      canvas.style.height = "260px";
    })();

    setupLazyRendering();
  }

  function setupLazyRendering() {
    if (!("IntersectionObserver" in window)) {
      chartConfigs.forEach((cfg) => createChart(cfg));
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const card = entry.target;
          const id = card.dataset.chartId;
          const cfg = chartConfigs.find((c) => c.id === id);
          if (cfg && !charts[id]) {
            createChart(cfg);
          }
        });
      },
      { threshold: 0.2 }
    );

    chartConfigs.forEach((cfg) => {
      const card = chartGrid.querySelector(
        `[data-chart-id="${cfg.id}"]`
      );
      if (card) observer.observe(card);
    });
  }

  function createChart(cfg) {
    const ctx = cfg.canvas.getContext("2d");
    charts[cfg.id] = new Chart(ctx, cfg.config);
  }

  function handleFile(file) {
    if (!file) {
      setMeta("No file selected. Supported: CSV, XLSX, XLS.");
      return;
    }

    const name = file.name || "";
    const lower = name.toLowerCase();
    const isCSV = lower.endsWith(".csv");
    const isExcel =
      lower.endsWith(".xlsx") || lower.endsWith(".xls");

    if (!isCSV && !isExcel) {
      setMeta("Unsupported format. Use CSV, XLSX, or XLS.");
      return;
    }

    showLoading(true);
    setMeta(`Loading ${name}…`);

    if (isCSV) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
        worker: true,
        complete: (results) => {
          const rows = Array.isArray(results.data) ? results.data : [];
          finalizeDataset(rows, name);
        },
        error: (err) => {
          showLoading(false);
          setMeta("Failed to parse CSV: " + err.message);
        },
      });
    } else if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, {
            defval: null,
          });
          finalizeDataset(rows, name);
        } catch (err) {
          showLoading(false);
          setMeta("Failed to parse Excel file.");
        }
      };
      reader.onerror = () => {
        showLoading(false);
        setMeta("Error reading Excel file.");
      };
      reader.readAsArrayBuffer(file);
    }
  }

  function finalizeDataset(rows, fileName) {
    const total = rows.length;
    if (total > MAX_ROWS) {
      rows = rows.slice(0, MAX_ROWS);
    }

    currentData = rows;
    const { numericColumns: numCols, columns: allCols } =
      summarizeColumns(rows);
    numericColumns = numCols;

    setMeta(
      `Loaded ${fileName} · ${rows.length.toLocaleString()} records` +
        (total > MAX_ROWS
          ? ` (capped from ${total.toLocaleString()})`
          : "")
    );

    updateInsightsPanel(rows, numericColumns);
    updateDatasetProfile(rows, numericColumns, allCols);
    buildCharts(rows, numericColumns);
    showLoading(false);
  }

  analyzeBtn.addEventListener("click", () => {
    const file = fileInput && fileInput.files && fileInput.files[0];
    handleFile(file);
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) {
      handleFile(file);
    }
  });
})();
