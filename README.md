# Interactive Wall Calendar

A creative, responsive calendar experience inspired by a physical wall calendar layout.

Built with:

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS (v4)
- Framer Motion (for transitions and visual polish)

## Challenge Alignment

This implementation covers all required scope from the frontend challenge:

- Wall calendar aesthetic with a strong hero-image panel and physical-paper composition.
- Day range selector with clear start, end, and in-between visual states.
- Integrated notes section:
- Monthly memo
- Range-specific notes (activated when a range is selected)
- Full responsiveness:
- Desktop keeps segmented wall-calendar composition.
- Mobile collapses into a touch-friendly vertical layout.

## Creative Additions

- Animated month transitions (Framer Motion).
- Seasonal visual accents that change by month.
- "Today", month navigation, and clear selection controls.
- Subtle occasion markers on specific dates.
- Local persistence for notes via browser localStorage.
- Multi-theme support with a top-right Light/Dark/Night toggle.
- Dynamic color extraction from the active hero image to retheme accents automatically.
- "Download Month" export to PNG using html2canvas.
- Magnetic hover glow interaction under the date grid.
- Markdown-enabled notes preview (`react-markdown` + `remark-gfm`).
- International context switch (USA/India/Japan) with locale-aware week start and formatting.

## Project Structure

```text
app/
	globals.css              # Global design system + decorative calendar effects
	layout.tsx               # Metadata + fonts
	page.tsx                 # Page composition and intro
components/
	wall-calendar.tsx        # Main interactive component
lib/
	calendar.ts              # Typed calendar/date helpers
assets/
	jan.jpg ... dec.jpg      # Provided month artwork
```

## How It Works

1. A month grid is generated with a fixed 6-week matrix (42 cells), Monday-first.
2. Clicking days sets a range:
- First click: range start
- Second click: range end
- Next click after a full range: starts a new range
3. Notes are stored in two buckets:
- Per-month notes, keyed by `YYYY-MM`
- Per-range notes, keyed by `start__end`
4. Notes are persisted to localStorage so refreshes keep user input.
5. Theme preference (light, dark, night) is saved in localStorage and restored on reload.
6. Selecting an international context updates timezone display formatting and weekday order.
7. Export creates a shareable PNG snapshot of the active month card.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

Then open http://localhost:3000.

### 3. Production build

```bash
npm run build
npm run start
```

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - create production build
- `npm run start` - run production server
- `npm run lint` - run ESLint checks


## Notes

- This project is intentionally frontend-only (no backend/API/database).
