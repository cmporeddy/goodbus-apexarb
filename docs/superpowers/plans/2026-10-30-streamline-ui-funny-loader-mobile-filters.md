# Streamline UI, Funny Bus Loading Experience & Collapsible Mobile Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Streamline the GoodBus booking interface by removing promotional marketing clutter, replacing the generic search loading spinner with a delightful animated Indian bus and witty transit quotes, and collapsing filters by default on mobile so bus search results appear immediately at the top without scrolling.

**Architecture:** 
1. Prune unused marketing filler from `HomeScreen.tsx` (trust badges strip, fleet cards, route stats) and ensure mobile overlay banners don't obstruct the search bar.
2. Build a dedicated `FunnyBusLoader.tsx` component with an animated CSS bus driving over moving dashed road lines and cycling witty travel quips every 2 seconds.
3. Refactor `SearchResultsScreen.tsx` to make filters collapsible on mobile (closed by default) with an active filter badge and expand/collapse trigger, ensuring bus result cards are displayed immediately at the top on small screens while keeping sidebar functionality on desktop.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide / Material Symbols.

---

## Global Constraints

- **Node.js**: >= 24.22.1
- **Styling**: Tailwind CSS v4 in `goodbus-ui-main`
- **Git Safety**: Follow `AGENTS.md` (no direct commits to `main`, no unsolicited git pushes without chat confirmation, atomic commits)
- **Zero Regression**: City resolution, seat layout expansion, booking flow, and RedBus API connectivity must remain 100% functional.

## Review Focus

1. **Mobile Screen Widths (< 1024px)**: When search results load, the very first bus trip card must be visible above the fold without any manual downward scrolling.
2. **Filter State Preservation**: Expanding/collapsing the filters on mobile must not reset selected filter checkboxes or sort order.
3. **Timer Cleanup in Funny Loader**: Interval timer for cycling funny quotes must properly clear on unmount to avoid memory leaks.
4. **Desktop Layout Integrity (>= 1024px)**: On desktop, the sidebar filter panel should remain natural and accessible alongside the bus list.
5. **No Broken Links or Crashes**: Removing marketing components must not remove any essential navigation or city selection handlers.

---

### Task 1: Clean Up Home Screen Clutter & Unnecessary Content

**Files:**
- Modify: `goodbus-ui-main/src/components/HomeScreen.tsx:945-1128`
- Modify: `goodbus-ui-main/src/components/InstallAppBanner.tsx`

**Interfaces:**
- Consumes: Existing `HomeScreenProps`, `onSearch`, `onSelectPopularRoute`
- Produces: Clean, focused `HomeScreen` without fake stats and dummy fleet grids

- [ ] **Step 1: Inspect and isolate marketing clutter in `HomeScreen.tsx`**
Identify sections: `4 Trust Badges Strip`, `India's Most Trusted Bus Fleets`, and `Route Stats Bar`. Retain the connected search bar and popular routes for quick city picks.

- [ ] **Step 2: Streamline `HomeScreen.tsx`**
Remove:
- The 4 trust badge cards ("Instant Checkout", "Free Cancellation", "Live GPS Tracking", "Women Safety First")
- The dummy fleet grid ("India's Most Trusted Bus Fleets")
- The redundant stats cards ("Average Checkout Time 60s", etc.)
Ensure the hero section focuses cleanly on the search form and quick popular route shortcuts.

- [ ] **Step 3: Prevent `InstallAppBanner.tsx` from obstructing the mobile search bar**
Adjust `InstallAppBanner.tsx` positioning or make it non-intrusive so it never overlaps the sticky search bar or search inputs on mobile.

- [ ] **Step 4: Verify typecheck passes**
Run: `npm --prefix goodbus-ui-main run lint` (or `npx tsc --noEmit`)
Expected: 0 errors

- [ ] **Step 5: Commit Task 1**
```bash
git add goodbus-ui-main/src/components/HomeScreen.tsx goodbus-ui-main/src/components/InstallAppBanner.tsx
git commit -m "refactor(goodbus-ui): remove unnecessary marketing clutter from home screen"
```

---

### Task 2: Create Delightful & Funny Bus Loading Experience

**Files:**
- Create: `goodbus-ui-main/src/components/FunnyBusLoader.tsx`
- Modify: `goodbus-ui-main/src/components/SearchResultsScreen.tsx:605-640`

**Interfaces:**
- Produces: `<FunnyBusLoader sourceCity={string} destinationCity={string} />`
- Consumes: Material Symbols / SVG, React hooks (`useState`, `useEffect`)

- [ ] **Step 1: Write `FunnyBusLoader.tsx` component**
Features:
- Animated red sleeper coach bus bouncing gently with rotating wheels and trailing exhaust puffs 💨.
- Moving road with dashed yellow center lines scrolling underneath.
- Cycling funny Indian bus journey status lines (cycling every 2 seconds):
  1. "Honking horn in 18 distinct musical melodies... 📯"
  2. "Negotiating with conductor for that sweet window seat... 🪟"
  3. "Asking uncle in seat 14 to lower his reel audio... 🎧"
  4. "Stopping at highway dhaba for piping hot chai & samosas... ☕"
  5. "Checking if the AC sleeper berth charging socket actually works... ⚡"
  6. "Flashing high beams to overtake slow trucks on the bypass... 🚌💨"
  7. "Waking up the cleaner to load heavy luggage onto the roof... 🧳"
  8. "Syncing GPS with driver's legendary sixth sense... 🛰️"
- Dynamic subtext showing: *"Scanning live private and RTC buses from {sourceCity} to {destinationCity}..."*

- [ ] **Step 2: Replace dull skeletons in `SearchResultsScreen.tsx` with `FunnyBusLoader`**
Replace the 5 grey pulsating skeleton blocks with `<FunnyBusLoader sourceCity={sourceCity} destinationCity={destinationCity} />`.

- [ ] **Step 3: Test component in browser / verify lint**
Run: `npm --prefix goodbus-ui-main run lint`
Expected: 0 errors

- [ ] **Step 4: Commit Task 2**
```bash
git add goodbus-ui-main/src/components/FunnyBusLoader.tsx goodbus-ui-main/src/components/SearchResultsScreen.tsx
git commit -m "feat(goodbus-ui): add funny bus loading animation with humorous travel quotes"
```

---

### Task 3: Collapsible Mobile Filters with Bus Results on Top

**Files:**
- Modify: `goodbus-ui-main/src/components/SearchResultsScreen.tsx`

**Interfaces:**
- Consumes: `filterBusTypes`, `filterDepartureTimes`, `filterOperators`, `filterAmenities`, `sortedTrips`
- Produces: Collapsible mobile filter accordion / drawer (closed by default) and prominent bus list placed immediately at the top on mobile.

- [ ] **Step 1: Introduce `isMobileFiltersOpen` state in `SearchResultsScreen.tsx`**
Default `isMobileFiltersOpen` to `false`.

- [ ] **Step 2: Reorder mobile DOM / responsive structure**
On mobile screens (`< lg`):
- Place a sleek, compact Filter & Sort toolbar directly above the bus results:
  - Toggle button: `[tune Filters (N active)]` with clear expand/collapse indicator (`expand_more` / `expand_less`).
  - Active filter badges with 1-click removal.
  - Quick sort dropdown or pills.
- Keep the expandable filter panel collapsed by default. When the user taps the filter button, it expands smoothly into a clean accordion or bottom card.
- On desktop (`lg:block`), maintain the full left sidebar alongside the bus results.
- Ensure the bus list appears immediately beneath the search bar on mobile so the first bus card is 100% visible on load!

- [ ] **Step 3: Test and verify filter interactions**
Verify:
- Default state on mobile: Bus cards visible without scrolling.
- Tap "Filters": Panel expands showing Bus Types, Times, Operators, Amenities.
- Select AC / Sleeper: Result count and bus list updates dynamically.
- Tap "Hide Filters": Panel collapses cleanly without resetting filter criteria.

- [ ] **Step 4: Run typecheck**
Run: `npm --prefix goodbus-ui-main run lint`
Expected: 0 errors

- [ ] **Step 5: Commit Task 3**
```bash
git add goodbus-ui-main/src/components/SearchResultsScreen.tsx
git commit -m "feat(goodbus-ui): collapse filters on mobile and prioritize instant bus list display"
```

---

### Task 4: End-to-End Verification & Sanity Check

**Files:**
- Verify: Full booking workflow (`HomeScreen` -> `SearchResultsScreen` -> `SeatLayout` -> `PaymentScreen`)

- [ ] **Step 1: Run complete typecheck and build validation**
Run: `npm --prefix goodbus-ui-main run build`
Expected: Clean build with 0 TypeScript or Vite bundling errors.

- [ ] **Step 2: Verify git status and diff**
Run: `git status && git log -n 4 --oneline`
Confirm clean atomic commits adhering to Conventional Commits.
