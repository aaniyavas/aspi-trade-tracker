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
      rows.forEach((r) => {
        // Google Sheets can turn "2026-10-07" into a real date and publish it
        // as "10/7/2026". Normalize either form to YYYY-MM-DD.
        r.Date = normalizeDate(r.Date);
        // Work out the month from the date, so nobody has to type it.
        r.Month = monthLabel(r.Date);
        // If a category is blank, file the row under "Uncategorized" so it
        // still shows up (and is easy to spot).
        r.Status_Category = r.Status_Category || "Uncategorized";
        r.Type_Category = r.Type_Category || "Uncategorized";
      });
      // Newest first, regardless of where a row sits in the sheet.
      // (YYYY-MM-DD text sorts correctly as plain text.)
      rows.sort((a, b) => (a.Date < b.Date ? 1 : a.Date > b.Date ? -1 : 0));
      state.allRows = rows;
      populateFilterOptions();
      render();
    },
    error: onFail,
  });
}

function normalizeDate(value) {
  const v = (value || "").trim();
  const us = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // M/D/YYYY
  if (us) return `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
  return v.slice(0, 10); // already YYYY-MM-DD (drops any time part)
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function monthLabel(isoDate) {
  const m = parseInt(isoDate.slice(5, 7), 10);
  return m >= 1 && m <= 12 ? `${MONTH_NAMES[m - 1]} ${isoDate.slice(0, 4)}` : "Unknown date";
}

// Build the dropdown options dynamically from whatever values actually
// appear in the data, so the filters never go stale as rows are added.
function populateFilterOptions() {
  // We filter on the *_Category columns (a small, controlled set) rather than
  // the raw Status/Agreement_Type text, which has too many one-off variations
  // to make a usable dropdown. See normalize.py for how those are derived.
  const types = uniqueSorted(state.allRows.map((r) => r.Type_Category));
  const months = uniqueValuesInDataOrder(state.allRows.map((r) => r.Month));

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

  // One listener on the chip row handles clicks on any chip (the chips are
  // redrawn on every render, so we listen on the container, not each chip).
  document.getElementById("status-chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.statusFilter = chip.dataset.status;
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

// ignoreStatus lets the chips show how many rows each status WOULD have
// under the current search/type/month filters.
function getFilteredRows(ignoreStatus = false) {
  return state.allRows.filter((row) => {
    const matchesSearch =
      !state.searchTerm ||
      row.Parties.toLowerCase().includes(state.searchTerm) ||
      row.Summary.toLowerCase().includes(state.searchTerm);

    const matchesStatus =
      ignoreStatus || !state.statusFilter || row.Status_Category === state.statusFilter;
    const matchesType = !state.typeFilter || row.Type_Category === state.typeFilter;
    const matchesMonth = !state.monthFilter || row.Month === state.monthFilter;

    return matchesSearch && matchesStatus && matchesType && matchesMonth;
  });
}

// ---------- 4. RENDER ----------

// Lifecycle order for the status chips, and the color each one uses
// (the colors themselves live in style.css as .s-planned, .s-signed, ...).
const STATUS_ORDER = [
  "Negotiations Launched/Planned",
  "Negotiations Ongoing",
  "Negotiations Concluded",
  "Signed",
  "In Force",
  "Talks Stalled/Slowed",
  "Cooperation/Dialogue",
  "Other",
  "Uncategorized",
];

const STATUS_CLASS = {
  "Negotiations Launched/Planned": "s-planned",
  "Negotiations Ongoing": "s-ongoing",
  "Negotiations Concluded": "s-concluded",
  "Signed": "s-signed",
  "In Force": "s-inforce",
  "Talks Stalled/Slowed": "s-stalled",
  "Cooperation/Dialogue": "s-coop",
};

function statusClass(category) {
  return STATUS_CLASS[category] || "s-other";
}

// Text from the sheet is data, not HTML. Escape it before putting it in the
// page so a stray "<" or "&" can't break the layout (or inject anything).
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function render() {
  const filtered = getFilteredRows();
  document.getElementById("result-count").textContent = `${filtered.length} of ${state.allRows.length} entries`;

  renderStatusChips();
  renderTable(filtered);
  renderTimeline(filtered);
}

function renderStatusChips() {
  // Counts reflect the other active filters, so the chips always tell you
  // what you'd get if you clicked them.
  const base = getFilteredRows(true);
  const counts = {};
  base.forEach((r) => { counts[r.Status_Category] = (counts[r.Status_Category] || 0) + 1; });

  // Show categories in lifecycle order; any category not in the list goes last.
  const present = [...new Set(state.allRows.map((r) => r.Status_Category))];
  const known = STATUS_ORDER.filter((c) => present.includes(c));
  const extra = present.filter((c) => !STATUS_ORDER.includes(c)).sort();
  const categories = [...known, ...extra];

  const chip = (value, label, count, cls, dot) => `
    <button type="button" class="chip ${cls} ${state.statusFilter === value ? "active" : ""} ${count === 0 ? "empty" : ""}"
            data-status="${esc(value)}" aria-pressed="${state.statusFilter === value}">
      ${dot ? '<span class="dot"></span>' : ""}${esc(label)} <span class="count">${count}</span>
    </button>`;

  document.getElementById("status-chips").innerHTML =
    chip("", "All", base.length, "", false) +
    categories.map((c) => chip(c, c, counts[c] || 0, statusClass(c), true)).join("");
}

function renderTable(rows) {
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = rows
    .map(
      (row) => `
    <tr>
      <td class="nowrap">${esc(row.Date)}</td>
      <td>${esc(row.Parties)}</td>
      <td>${esc(row.Agreement_Type)}</td>
      <td><span class="status-badge ${statusClass(row.Status_Category)}">${esc(row.Status)}</span></td>
      <td>${esc(row.Summary)} <span class="source">(${esc(row.Source)})</span></td>
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
      <h3>${esc(month)}</h3>
      ${monthRows
        .map(
          (row) => `
        <div class="timeline-entry">
          <div class="timeline-date">${esc(row.Date)}</div>
          <div class="timeline-content">
            <strong>${esc(row.Parties)}</strong> &middot; ${esc(row.Agreement_Type)} &middot;
            <span class="status-badge ${statusClass(row.Status_Category)}">${esc(row.Status)}</span>
            <p>${esc(row.Summary)} <span class="source">(${esc(row.Source)})</span></p>
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
