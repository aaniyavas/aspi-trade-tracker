# ASPI Non-U.S. Trade Agreements Tracker

A filterable, searchable tracker of non-U.S. trade agreements and economic
integration efforts, built as a plain HTML/CSS/JavaScript site (no build
step, no framework) so it is easy to embed and easy to hand off.

## Files

- `index.html` -- page structure (the elements on the page)
- `style.css` -- appearance
- `app.js` -- behavior: loads the CSV, filters it based on user input, and
  renders the Table and Timeline views
- `papaparse.min.js` -- a small vendored library that parses CSV text into
  JavaScript data. Vendored locally (not loaded from a CDN) so the page has
  no external runtime dependency.
- `data/tracker.csv` -- the dataset. Currently a static local file; the plan
  is to swap `DATA_SOURCE` in `app.js` to a published Google Sheet CSV link
  so an intern can update the data without touching any code.
- `normalize.py` -- a one-time cleanup script that reads the raw tracker CSV
  and adds two "bucketed" columns (`Status_Category`, `Type_Category`) so the
  dropdown filters stay short and useful even as the detailed Status/
  Agreement_Type text varies a lot row to row. Re-run this any time the raw
  data changes shape in a way that breaks the category buckets.

## Running it locally

Because the page fetches `data/tracker.csv` with JavaScript, opening
`index.html` directly by double-clicking it won't work (browsers block
local file fetches for security). You need a tiny local web server instead:

```bash
cd aspi-tracker
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Swapping in the live Google Sheet

Once the sheet is published as CSV (File > Share > Publish to web >
Comma-separated values), change one line in `app.js`:

```js
const DATA_SOURCE = "data/tracker.csv";
```

to:

```js
const DATA_SOURCE = "https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=0";
```

That's the only code change needed for the intern's biweekly updates to
show up automatically.

## Deploying (GitHub Pages)

1. Push this folder to a GitHub repository.
2. In the repo's Settings > Pages, set the source to the `main` branch, root
   folder.
3. GitHub will publish it at `https://<username>.github.io/<repo-name>/`.
4. Embed that URL in ASPI's site with an `<iframe>`, or link to it directly.

No build step, no server to maintain, no separate hosting account needed.
