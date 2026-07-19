# Advertiser · Brand · Industry Integrity

A React dashboard for auditing the integrity of advertiser → brand → industry mappings: surfacing unmapped advertisers, advertiser/brand industry mismatches, taxonomy navigation, and separation of concerns between direct and indirect classifications.

## Stack

- **React 18** + **Vite**
- **Tailwind CSS** for styling
- **lucide-react** for icons

## Getting started

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`.

## Available scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-light production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Loading data

By default the dashboard ships with mock data. To load your own:

1. Click **Data source** in the header.
2. Paste two CSVs:
   - **Unmapped advertisers** — advertisers without a brand/industry assignment.
   - **Advertiser/brand mismatches** — rows where the advertiser industry and brand industry disagree.
3. Click **Load** for each. The dashboard will repopulate from your CSV.

CSV column expectations are documented inline in the paste dialog. The full BigQuery schema, the working power query, and the industry-resolution logic the dashboard relies on are documented in [DATA_SCHEMA.md](DATA_SCHEMA.md).

## Project layout

```
.
├── index.html              # Vite entry HTML
├── src/
│   ├── main.jsx            # React root
│   ├── AppNew.jsx          # App shell (data loading, V3 resolution, layout)
│   ├── data/               # Canonical model, taxonomy, CSV/BQ/FW adapters
│   ├── flags/              # Integrity flag detection (F1, F1_AM, F2…)
│   ├── state/              # Pending-changes store (zustand)
│   ├── views/              # Table, drawers, review/apply modal, dialogs
│   └── index.css           # Tailwind layers
├── server/                 # Express BFF (FreeWheel MCP, V3 resolver, audit)
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── package.json
```

## License

MIT — see [LICENSE](LICENSE).
