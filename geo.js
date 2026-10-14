/*
  Where each party named in the tracker sits on the map: [longitude, latitude, display name, kind].
  kind "country" = a dot at the capital; "bloc" = a dot at a symbolic spot for a group.
  To add a new country or bloc, add a line here. The key is lowercase and must match
  the name as typed in the Sheet's Parties column (see ALIASES for spelling variants).
*/
const GEO = {
  // ----- Countries -----
  "south korea": [127.0, 37.55, "South Korea", "country"],
  "india": [77.2, 28.6, "India", "country"],
  "china": [116.4, 39.9, "China", "country"],
  "vietnam": [105.85, 21.0, "Vietnam", "country"],
  "canada": [-75.7, 45.4, "Canada", "country"],
  "japan": [139.7, 35.7, "Japan", "country"],
  "indonesia": [106.8, -6.2, "Indonesia", "country"],
  "uae": [54.4, 24.45, "UAE", "country"],
  "philippines": [121.0, 14.6, "Philippines", "country"],
  "uk": [-0.12, 51.5, "United Kingdom", "country"],
  "australia": [149.1, -35.3, "Australia", "country"],
  "thailand": [100.5, 13.75, "Thailand", "country"],
  "bangladesh": [90.4, 23.8, "Bangladesh", "country"],
  "russia": [37.6, 55.75, "Russia", "country"],
  "malaysia": [101.7, 3.14, "Malaysia", "country"],
  "pakistan": [73.05, 33.7, "Pakistan", "country"],
  "singapore": [103.85, 1.3, "Singapore", "country"],
  "cambodia": [104.9, 11.55, "Cambodia", "country"],
  "mexico": [-99.1, 19.4, "Mexico", "country"],
  "chile": [-70.65, -33.45, "Chile", "country"],
  "kazakhstan": [71.4, 51.15, "Kazakhstan", "country"],
  "new zealand": [174.8, -41.3, "New Zealand", "country"],
  "france": [2.35, 48.85, "France", "country"],
  "kenya": [36.8, -1.3, "Kenya", "country"],
  "turkiye": [32.85, 39.9, "Türkiye", "country"],
  "ecuador": [-78.5, -0.2, "Ecuador", "country"],
  "switzerland": [7.45, 46.95, "Switzerland", "country"],
  "mongolia": [106.9, 47.9, "Mongolia", "country"],
  "argentina": [-58.4, -34.6, "Argentina", "country"],
  "uzbekistan": [69.25, 41.3, "Uzbekistan", "country"],
  "brazil": [-47.9, -15.8, "Brazil", "country"],
  "turkmenistan": [58.4, 37.95, "Turkmenistan", "country"],
  "oman": [58.4, 23.6, "Oman", "country"],
  "qatar": [51.5, 25.3, "Qatar", "country"],
  "greece": [23.7, 37.98, "Greece", "country"],
  "italy": [12.5, 41.9, "Italy", "country"],
  "nigeria": [7.5, 9.05, "Nigeria", "country"],
  "belarus": [27.55, 53.9, "Belarus", "country"],
  "ukraine": [30.5, 50.45, "Ukraine", "country"],
  "hong kong": [114.17, 22.3, "Hong Kong", "country"],
  "netherlands": [4.9, 52.37, "Netherlands", "country"],
  "germany": [13.4, 52.5, "Germany", "country"],
  "kyrgyzstan": [74.6, 42.87, "Kyrgyzstan", "country"],
  "vanuatu": [168.3, -17.75, "Vanuatu", "country"],
  "kuwait": [47.98, 29.37, "Kuwait", "country"],
  "slovakia": [17.1, 48.15, "Slovakia", "country"],
  "saudi arabia": [46.7, 24.7, "Saudi Arabia", "country"],
  "serbia": [20.46, 44.8, "Serbia", "country"],
  "myanmar": [96.1, 19.75, "Myanmar", "country"],
  "morocco": [-6.85, 34.0, "Morocco", "country"],
  "bolivia": [-68.15, -16.5, "Bolivia", "country"],
  "azerbaijan": [49.9, 40.4, "Azerbaijan", "country"],
  "spain": [-3.7, 40.4, "Spain", "country"],
  "panama": [-79.5, 8.98, "Panama", "country"],
  "algeria": [3.06, 36.75, "Algeria", "country"],
  "mauritania": [-15.98, 18.08, "Mauritania", "country"],
  "united states": [-77.04, 38.9, "United States", "country"],
  "laos": [102.6, 17.97, "Laos", "country"],
  "cuba": [-82.4, 23.1, "Cuba", "country"],
  "sri lanka": [79.9, 6.9, "Sri Lanka", "country"],
  "portugal": [-9.14, 38.72, "Portugal", "country"],
  "israel": [35.2, 31.77, "Israel", "country"],
  "south africa": [28.2, -25.75, "South Africa", "country"],
  "costa rica": [-84.08, 9.93, "Costa Rica", "country"],
  "gabon": [9.45, 0.4, "Gabon", "country"],
  "drc": [15.3, -4.3, "DR Congo", "country"],
  "sierra leone": [-13.23, 8.48, "Sierra Leone", "country"],
  "egypt": [31.24, 30.04, "Egypt", "country"],
  "zambia": [28.3, -15.4, "Zambia", "country"],
  "nepal": [85.3, 27.7, "Nepal", "country"],
  "bahrain": [50.58, 26.2, "Bahrain", "country"],
  "ireland": [-6.26, 53.35, "Ireland", "country"],
  "bhutan": [89.64, 27.47, "Bhutan", "country"],

  // ----- Blocs and groupings (placed at a symbolic location) -----
  "eu": [4.35, 50.85, "European Union", "bloc"],
  "asean": [100.0, 5.0, "ASEAN", "bloc"],
  "rcep": [114.0, 3.0, "RCEP members", "bloc"],
  "cptpp": [178.0, -8.0, "CPTPP", "bloc"],
  "mercosur": [-57.0, -27.0, "Mercosur", "bloc"],
  "gcc": [50.2, 21.0, "GCC", "bloc"],
  "eaeu": [45.0, 57.5, "EAEU", "bloc"],
  "efta": [16.0, 66.5, "EFTA", "bloc"],
  "central asia": [66.0, 44.5, "Central Asia", "bloc"],
  "sacu": [22.0, -22.0, "SACU", "bloc"],
  "eac": [33.0, 1.5, "East African Community", "bloc"],
  "afcfta": [38.7, 9.0, "AfCFTA / Africa", "bloc"],
  "wto": [6.15, 46.2, "WTO", "bloc"],
  "gepa": [112.0, -4.5, "GEPA parties", "bloc"],
};

// Other ways the Sheet might spell the same party -> the key above.
const ALIASES = {
  "turkey": "turkiye", "türkiye": "turkiye",
  "united kingdom": "uk", "britain": "uk",
  "us": "united states", "usa": "united states", "u.s.": "united states",
  "european union": "eu",
  "mercosur": "mercosur",
  "rcep members": "rcep", "rcep": "rcep",
  "gepa parties": "gepa",
  "east african community": "eac",
  "africa": "afcfta", "africa (53 nations)": "afcfta",
  "66 wto members": "wto",
  "korea": "south korea", "republic of korea": "south korea",
  "dr congo": "drc", "democratic republic of congo": "drc",
  "emirates": "uae", "united arab emirates": "uae",
};

// Turn a Parties string ("Brazil/Canada/France/Netherlands", "EU, India") into
// a list of GEO keys. Anything we can't place goes in `unmapped`.
function resolveParties(text) {
  const keys = [], unmapped = [];
  String(text || "").split(/\s*[,/;]\s*|\s+and\s+/i).forEach((raw) => {
    let t = raw.replace(/\s*\(.*?\)\s*/g, " ").trim().toLowerCase();
    if (!t) return;
    t = ALIASES[t] || t;
    if (GEO[t]) { if (!keys.includes(t)) keys.push(t); }
    else unmapped.push(raw.trim());
  });
  return { keys, unmapped };
}
