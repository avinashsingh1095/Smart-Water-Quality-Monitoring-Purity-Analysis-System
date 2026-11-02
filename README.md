# Smart Water Quality Monitoring & Purity Analysis System — Interactive Lab

Frontend-only React + Vite + TypeScript + Tailwind v4 educational simulation. No backend; not connected to hardware. All data is synthetic and deterministic.

## Run
    npm install
    npm run dev        # http://localhost:5173
    npm run build      # type-check + production build into dist/
    npm run preview

## Deploy (static)
- **Netlify:** build command `npm run build`, publish directory `dist`.
- **Vercel:** framework preset *Vite* (build `npm run build`, output `dist`).

## Structure
- `src/firmware.ts` — exact Arduino sketch shown in the firmware explorer.
- `src/App.tsx` — page sections, architecture, sensors, firmware, dashboard, wiring, calibration, testing and docs.
- `src/FilterVisualization.tsx` — isolated SVG whole-house filter housing, cartridge and measurement-system visualization.
- `src/assets/aditya-sharma.png` — supplied profile photo used in the team section.
- `src/index.css` — theme, flow and filter animations, print and reduced-motion styles.

Disclaimer: educational simulation only; does not certify water quality or drinking-water safety.
