/*
  Map view: an Asia-centred world map with one dot per country (or bloc) named in
  the tracker. Dot size = number of entries. Hover = name. Click = zoom in and
  open a side panel listing that party's agreements. The map always reflects the
  shared filters (search, status chips, type, month).
*/
const MAP = {
  W: 960, H: 520,
  ready: false,
  pendingRows: null,
  selected: null,   // GEO key of the selected dot, or null
  nodes: [],
  rows: [],
};

function initMap() {
  const svg = d3.select("#map-svg");
  MAP.svg = svg;
  MAP.projection = d3.geoNaturalEarth1().rotate([-100, 0]).fitExtent([[6, 6], [MAP.W - 6, MAP.H - 6]], { type: "Sphere" });
  MAP.path = d3.geoPath(MAP.projection);

  MAP.g = svg.append("g");
  MAP.gLand = MAP.g.append("g");
  MAP.gArcs = MAP.g.append("g").attr("class", "map-arcs");
  MAP.gDots = MAP.g.append("g");

  MAP.zoom = d3.zoom()
    .scaleExtent([1, 14])
    .translateExtent([[0, 0], [MAP.W, MAP.H]])
    .filter((e) => (e.type === "wheel" ? e.ctrlKey : !e.button))   // scroll the page normally; ctrl+wheel zooms
    .on("zoom", (e) => { MAP.k = e.transform.k; MAP.g.attr("transform", e.transform); sizeMapMarks(); });
  svg.call(MAP.zoom);
  MAP.k = 1;

  svg.on("click", (e) => { if (e.target === svg.node() || e.target.classList.contains("land")) selectNode(null); });

  document.getElementById("map-zoom-in").addEventListener("click", () => svg.transition().duration(350).call(MAP.zoom.scaleBy, 1.8));
  document.getElementById("map-zoom-out").addEventListener("click", () => svg.transition().duration(350).call(MAP.zoom.scaleBy, 1 / 1.8));
  document.getElementById("map-reset").addEventListener("click", () => selectNode(null));
  document.getElementById("map-panel").addEventListener("click", (e) => {
    const el = e.target.closest("[data-node]");
    if (el) selectNode(el.dataset.node);
    if (e.target.closest("#panel-back")) selectNode(null);
  });

  d3.json("data/world-110m.json").then((world) => {
    const countries = topojson.feature(world, world.objects.countries);
    MAP.gLand.append("path").datum({ type: "Sphere" }).attr("class", "sphere").attr("d", MAP.path);
    MAP.gLand.selectAll("path.land").data(countries.features).join("path")
      .attr("class", "land").attr("d", MAP.path);
    MAP.gLand.append("path").datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
      .attr("class", "borders").attr("d", MAP.path);
    MAP.ready = true;
    renderMap(MAP.pendingRows || MAP.rows);
  }).catch((err) => {
    document.getElementById("map-panel").innerHTML = `<p class="panel-hint">Could not load the map: ${esc(err.message)}</p>`;
  });
}

// Group the (already filtered) rows by the countries/blocs they name.
function buildNodes(rows) {
  const byKey = {};
  const unmapped = {};
  rows.forEach((row) => {
    const { keys, unmapped: miss } = resolveParties(row.Parties);
    miss.forEach((m) => { unmapped[m] = (unmapped[m] || 0) + 1; });
    row._keys = keys;
    keys.forEach((k) => { (byKey[k] = byKey[k] || []).push(row); });
  });
  if (Object.keys(unmapped).length) console.warn("Parties not on the map yet (add to geo.js):", unmapped);
  return Object.entries(byKey).map(([key, list]) => {
    const [lon, lat, name, kind] = GEO[key];
    const [x, y] = MAP.projection([lon, lat]);
    return { key, name, kind, x, y, rows: list, count: list.length };
  }).sort((a, b) => b.count - a.count);   // big dots first so small ones sit on top
}

function dotSize(d) { return (30 + 26 * d.count) * 0.9; }   // area, in px^2

function renderMap(rows) {
  MAP.rows = rows;
  if (!MAP.ready) { MAP.pendingRows = rows; return; }
  MAP.nodes = buildNodes(rows);

  const sym = (d) => d3.symbol().type(d.kind === "bloc" ? d3.symbolDiamond : d3.symbolCircle).size(dotSize(d) / Math.pow(MAP.k, 1.7))();
  MAP.gDots.selectAll("path.dot").data(MAP.nodes, (d) => d.key).join(
    (enter) => enter.append("path").attr("class", "dot")
      .on("mouseenter", (e, d) => showTip(e, d))
      .on("mousemove", moveTip)
      .on("mouseleave", hideTip)
      .on("click", (e, d) => { e.stopPropagation(); selectNode(d.key); })
  )
    .attr("class", (d) => `dot ${d.kind} ${MAP.selected === d.key ? "selected" : ""}`)
    .attr("transform", (d) => `translate(${d.x},${d.y})`)
    .attr("d", sym);

  drawArcs();
  renderPanel();
}

function sizeMapMarks() {
  const k = MAP.k;
  MAP.gDots.selectAll("path.dot").attr("d", (d) =>
    d3.symbol().type(d.kind === "bloc" ? d3.symbolDiamond : d3.symbolCircle).size(dotSize(d) / Math.pow(k, 1.7))());
  MAP.gDots.selectAll("path.dot").style("stroke-width", 1.5 / Math.pow(k, 0.8));
  MAP.gArcs.selectAll("path").style("stroke-width", 1.6 / Math.pow(k, 0.8));
  MAP.gLand.select(".borders").style("stroke-width", 0.5 / Math.sqrt(k));
}

function drawArcs() {
  const sel = MAP.nodes.find((n) => n.key === MAP.selected);
  MAP.gArcs.selectAll("path").remove();
  if (!sel) return;
  const partners = {};
  sel.rows.forEach((r) => r._keys.forEach((k) => { if (k !== sel.key) partners[k] = (partners[k] || 0) + 1; }));
  // Hubs like Korea or India have 40+ partners; lines would be a hairball, so only draw for smaller sets.
  if (Object.keys(partners).length > 14) return;
  Object.keys(partners).forEach((k) => {
    MAP.gArcs.append("path")
      .attr("d", MAP.path({ type: "LineString", coordinates: [[GEO[sel.key][0], GEO[sel.key][1]], [GEO[k][0], GEO[k][1]]] }))
      .style("stroke-width", 1.6 / Math.pow(MAP.k, 0.8));
  });
}

function selectNode(key) {
  MAP.selected = key;
  const svg = MAP.svg;
  MAP.gDots.selectAll("path.dot").attr("class", (d) => `dot ${d.kind} ${key === d.key ? "selected" : ""}`);
  if (key) {
    const [x, y] = MAP.projection([GEO[key][0], GEO[key][1]]);
    const k = GEO[key][3] === "bloc" ? 3 : 4.5;
    const t = d3.zoomIdentity.translate(MAP.W / 2, MAP.H / 2).scale(k).translate(-x, -y);
    svg.transition().duration(750).call(MAP.zoom.transform, t);
  } else {
    svg.transition().duration(750).call(MAP.zoom.transform, d3.zoomIdentity);
  }
  drawArcs();
  renderPanel();
}

// ----- Tooltip -----
function showTip(e, d) {
  const tip = document.getElementById("map-tooltip");
  tip.innerHTML = `<strong>${esc(d.name)}</strong><span>${d.count} ${d.count === 1 ? "entry" : "entries"}${d.kind === "bloc" ? " · bloc" : ""}</span>`;
  tip.style.display = "block";
  moveTip(e);
}
function moveTip(e) {
  const stage = document.getElementById("map-stage").getBoundingClientRect();
  const tip = document.getElementById("map-tooltip");
  tip.style.left = `${e.clientX - stage.left + 14}px`;
  tip.style.top = `${e.clientY - stage.top + 14}px`;
}
function hideTip() { document.getElementById("map-tooltip").style.display = "none"; }

// ----- Side panel -----
function renderPanel() {
  const panel = document.getElementById("map-panel");
  const sel = MAP.nodes.find((n) => n.key === MAP.selected);

  if (!MAP.selected) {
    const top = MAP.nodes.slice(0, 8);
    panel.innerHTML = `
      <h2>Explore by country</h2>
      <p class="panel-hint">Click a dot on the map to zoom in and see that country's agreements. Dot size shows how many entries involve it; diamonds are blocs such as ASEAN or the EU. The filters above apply here too.</p>
      <h3>Most active</h3>
      <ul class="rank-list">
        ${top.map((n) => `<li><button type="button" data-node="${esc(n.key)}"><span>${esc(n.name)}</span><span class="rank-count">${n.count}</span></button></li>`).join("")}
      </ul>`;
    return;
  }

  if (!sel) {   // selected dot has no entries under the current filters
    panel.innerHTML = `<button id="panel-back" class="panel-back" type="button">← All countries</button>
      <h2>${esc(GEO[MAP.selected][2])}</h2>
      <p class="panel-hint">No entries match the current filters. Clear a filter above to see more.</p>`;
    return;
  }

  const partners = {};
  sel.rows.forEach((r) => r._keys.forEach((k) => { if (k !== sel.key) partners[k] = (partners[k] || 0) + 1; }));
  const partnerChips = Object.entries(partners).sort((a, b) => b[1] - a[1])
    .map(([k, c]) => `<button type="button" class="partner-chip" data-node="${esc(k)}">${esc(GEO[k][2])} <span>${c}</span></button>`).join("");

  panel.innerHTML = `
    <button id="panel-back" class="panel-back" type="button">← All countries</button>
    <h2>${esc(sel.name)}</h2>
    <p class="panel-count">${sel.count} ${sel.count === 1 ? "entry" : "entries"}${sel.kind === "bloc" ? " (bloc)" : ""}</p>
    ${partnerChips ? `<h3>Partners (click to jump)</h3><div class="partner-chips">${partnerChips}</div>` : ""}
    <h3>Agreements, newest first</h3>
    <ol class="panel-entries">
      ${sel.rows.map((r) => `
        <li>
          <div class="pe-top"><span class="pe-date">${esc(r.Date)}</span>
            <span class="status-badge ${statusClass(r.Status_Category)}">${esc(r.Status)}</span></div>
          <div class="pe-parties">${esc(r.Parties)}</div>
          <div class="pe-type">${esc(r.Agreement_Type)}</div>
          <p>${esc(r.Summary)} <span class="source">(${esc(r.Source)})</span></p>
        </li>`).join("")}
    </ol>`;
  panel.scrollTop = 0;
}

initMap();
