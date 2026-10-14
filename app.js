/*
  ASPI Trade Agreements Tracker
  -----------------------------
  This file has four jobs, in order:
  1. Load the data (from CSV)
  2. Keep track of the current filters (state)
  3. Filter the data based on that state
  4. Render (draw) the filtered data into the page

  Whenever a filter changes, we re-run steps 3 and 4. That's the whole app.
*/

// Live data: the published Google Sheet (CSV format). The intern edits the
// sheet; this page re-reads it every time it loads. Google caches published
// sheets for a few minutes, so edits can take ~5 minutes to appear.
const LIVE_DATA_SOURCE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJoTxYfRwWejCJVS9KhkNjx46IyxPFDhY5EkO3ytnOHSPHJmOAjVF7MHSiKZLTnooQ7e6IEVHpkbSY/pub?gid=1547077138&single=true&output=csv";

// Safety net: a snapshot of the data stored with the site. Used only if the
// live sheet can't be reached (sheet unpublished, Google outage, etc.).
const FALLBACK_DATA_SOURCE = "data/tracker.csv";

// "State" = the single source of truth for what the user has selected right now.
// Every filter control writes into this object; rendering always reads from it.
const state = {
  allRows: [],       // every row, loaded once from the CSV
  searchTerm: "",
  statusFilter: "",
  typeFilter: "",
  monthFilter: "",
  activeTab: "table",
};

// ---------- 1. LOAD DATA ----------

function loadData() {
  parseFrom(LIVE_DATA_SOURCE, () => {
    // Live sheet failed: quietly try the bundled snapshot instead.
    console.warn("Live sheet unavailable, using bundled snapshot.");
    parseFrom(FALLBACK_DATA_SOURCE, (err) => {
      document.getElementById("table-body").innerHTML =
        `<tr><td colspan="5">Could not load data: ${err.message}</td></tr>`;
    });
  });
}

function parseFrom(url, onFail) {
  Papa.parse(url, {
    download: true,        // tells PapaParse to fetch the URL itself
    header: true,           // use the first row as column names
    skipEmptyLines: true,
    complete: (results) => {
      // Guard against a "successful" fetch that isn't our data (e.g. an
      // error page): a real tracker row always has a Date and Parties.
      const rows = results.data.filter((r) => r.Date && r.Parties);
      if (rows.length === 0) {
        onFail(new Error("No tracker rows found"));
        return;
      }
      // If the intern leaves a category blank, file the row under
      // "Uncategorized" so it still shows up (and is easy to spot).
      rows.forEach((r) => {
        r.Status_Category = r.Status_Category || "Uncategorized";
        r.Type_Category = r.Type_Category || "Uncategorized";
      });
      state.allRows = rows;
      populateFilterOptions();
      render();
    },
    error: onFail,
  });
}

// Build the dropdown options dynamically from whatever values actually
// appear in the data, so the filters never go stale as rows are added.
function populateFilterOptions() {
  // We filter on the *_Category columns (a small, controlled set) rather than
  // the raw Status/Agreement_Type text, which has too many one-off variations
  // to make a usable dropdown. See normalize.py for how those are derived.
  const statuses = uniqueSorted(state.allRows.map((r) => r.Status_Category));
  const types = uniqueSorted(state.allRows.map((r) => r.Type_Category));
  const months = uniqueValuesInDataOrder(state.allRows.map((r) => r.Month));

  fillSelect("status-filter", statuses);
  fillSelect("type-filter", types);
  fillSelect("month-filter", months);
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

// Months should stay in chronological order (as they appear in the CSV,
// which is newest-first), not alphabetical order.
function uniqueValuesInDataOrder(values) {
  return [...new Set(values.filter(Boolean))];
}

function fillSelect(selectId, values) {
  const select = document.getElementById(selectId);
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

// ---------- 2. STATE: wire up the controls ----------

function setupControls() {
  document.getElementById("search-input").addEventListener("input", (e) => {
    state.searchTerm = e.target.value.toLowerCase();
    render();
  });

  document.getElementById("status-filter").addEventListener("change", (e) => {
    state.statusFilter = e.target.value;
    render();
  });

  document.getElementById("type-filter").addEventListener("change", (e) => {
    state.typeFilter = e.target.value;
    render();
  });

  document.getElementById("month-filter").addEventListener("change", (e) => {
    state.monthFilter = e.target.value;
    render();
  });

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      document.querySelectorAll(".tab-button").forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
      document.getElementById(`${state.activeTab}-view`).classList.add("active");
    });
  });
}

// ---------- 3. FILTER ----------

function getFilteredRows() {
  return state.allRows.filter((row) => {
    const matchesSearch =
      !state.searchTerm ||
      row.Parties.toLowerCase().includes(state.searchTerm) ||
      row.Summary.toLowerCase().includes(state.searchTerm);

    const matchesStatus = !state.statusFilter || row.Status_Category === state.statusFilter;
    const matchesType = !state.typeFilter || row.Type_Category === state.typeFilter;
    const matchesMonth = !state.monthFilter || row.Month === state.monthFilter;

    return matchesSearch && matchesStatus && matchesType && matchesMonth;
  });
}

// ---------- 4. RENDER ----------

function render() {
  const filtered = getFilteredRows();
  document.getElementById("result-count").textContent = `${filtered.length} of ${state.allRows.length} entries`;

  renderTable(filtered);
  renderTimeline(filtered);
}

function renderTable(rows) {
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = rows
    .map(
      (row) => `
    <tr>
      <td class="nowrap">${row.Date}</td>
      <td>${row.Parties}</td>
      <td>${row.Agreement_Type}</td>
      <td><span class="status-badge">${row.Status}</span></td>
      <td>${row.Summary} <span class="source">(${row.Source})</span></td>
    </tr>
  `
    )
    .join("");
}

function renderTimeline(rows) {
  const container = document.getElementById("timeline-container");

  // Group rows by Month, preserving the order months first appear in.
  const groups = {};
  rows.forEach((row) => {
    if (!groups[row.Month]) groups[row.Month] = [];
    groups[row.Month].push(row);
  });

  container.innerHTML = Object.entries(groups)
    .map(
      ([month, monthRows]) => `
    <div class="timeline-month">
      <h3>${month}</h3>
      ${monthRows
        .map(
          (row) => `
        <div class="timeline-entry">
          <div class="timeline-date">${row.Date}</div>
          <div class="timeline-content">
            <strong>${row.Parties}</strong> &middot; ${row.Agreement_Type} &middot;
            <span class="status-badge">${row.Status}</span>
            <p>${row.Summary} <span class="source">(${row.Source})</span></p>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `
    )
    .join("");
}

// ---------- START ----------

setupControls();
loadData();
