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

CSV column expectations are documented inline in the paste dialog.

## Project layout

```
.
├── index.html              # Vite entry HTML
├── src/
│   ├── main.jsx            # React root
│   ├── Dashboard.jsx       # Single-file dashboard (views, mock data, parsing)
│   └── index.css           # Tailwind layers
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── package.json
```

## License

MIT — see [LICENSE](LICENSE).
