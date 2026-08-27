# Tide widget

> **Living specification — source of truth.** This document specifies how tides are predicted and displayed in Gladys Assistant, and records the dependency choice behind them. **Rule: any PR that changes how tides are computed, or that revisits the tide predictor dependency, modifies this file in the same diff.**
>
> Status: **implemented**.

## Context

The `tide` dashboard widget shows the tides of a house by the sea: the tides framing the current moment, the water level right now, the curve of the day, and — on the French coast — the tide coefficient. A row of tabs steps through the week ahead, one day at a time.

Tides are **computed locally**. The harmonic constituents of the tide station closest to the house are downloaded once from the [Open Waters tide database](https://openwaters.io/tides/database) (MIT code, CC-BY-4.0 data, built from the NOAA and TICON-4 datasets) and stored in a per-house variable. Every prediction afterwards is computed offline: the widget keeps working with no network access, and a station that can no longer be downloaded is kept rather than dropped.

## Dependency: `@neaps/tide-predictor`

The prediction itself is done by [`@neaps/tide-predictor`](https://www.npmjs.com/package/@neaps/tide-predictor) (MIT, ~217 KB unpacked, no transitive dependencies).

**It is an ES module, while the Gladys server is CommonJS.** It is therefore loaded through a dynamic `import()` in `server/lib/house/house.getTideState.js`, memoized so the module is evaluated once. This is the only dynamic `import()` in the server, which makes it worth explaining.

### Why the dependency is kept

**Reimplementing it would be wrong, not just tedious.** Harmonic tide prediction is not a sum of cosines: it needs the astronomical equilibrium arguments and the nodal corrections that follow the 18.6-year cycle of the lunar orbit. A naive sum of cosines was written with the real Saint-Malo constituents and compared against the library over four dates spread across a year:

| Date | Library | Naive sum | Error |
| --- | --- | --- | --- |
| 2026-08-27 12:00Z | −3.712 m | 1.414 m | 5.13 m |
| 2026-09-15 06:00Z | 0.962 m | −2.520 m | 3.48 m |
| 2026-12-01 18:00Z | −3.423 m | 2.774 m | 6.20 m |
| 2027-06-10 00:00Z | 2.224 m | −0.155 m | 2.38 m |

A home-grown predictor would be either wrong by metres, or a reimplementation of the 6,500 lines and 477 constituent definitions the library already carries — code that would then have to be maintained here.

**There is no CommonJS equivalent.** `tide-predictor`, `noaa-tide-predictor`, `xtide` and `tidal-predictor` do not exist on npm. The `harmonics` package is an unrelated *music* library that happens to share the name.

**The library is accurate.** Predictions were checked against the tide tables published by the SHOM for Concarneau: times land within 1 to 4 minutes and heights within about 20 cm.

### Why the dynamic `import()` is safe here

- **No bundler on the server.** Production installs run `npm ci --production` (see `docker/Dockerfile`) and Node executes the modules as they are; nothing rewrites the `import()`.
- **Node 24 in production**, far above what native `import()` of an ES module from CommonJS requires.
- **Tests cover it**, including the offline path where the station download fails.

### Alternatives considered

| Option | Why not |
| --- | --- |
| Reimplement the harmonic prediction | Wrong by up to 6.20 m if done naively; otherwise 6,500 lines of third-party maths to own and maintain. |
| Another npm package, CommonJS | None exists (see above). |
| Vendor `dist/index.js` into the repo | Removes the external dependency but transfers maintenance of third-party code to Gladys, with no upstream fixes. Rejected. |
| Compute tides in the frontend | The package ships a browser build, but this would mean sending the harmonic constituents to every client and recomputing in each tab, for no gain over a server-side computation. |

**If this is ever revisited**, the trigger would be the library becoming unmaintained, or Gladys introducing a server-side bundler that mishandles dynamic `import()`. Neither is the case today.

## Tide coefficient

The French tide coefficient is a Brest-referenced number on a 20–120 scale: it compares the range of one tide at Brest to the mean spring range there, and the whole Atlantic and Channel coast uses that single value. It is only shown for houses within `MAX_COEFFICIENT_DISTANCE_KM` of Brest, since it describes no other tidal regime.

**It is computed on the semi-diurnal constituents alone** (`COEFFICIENT_CONSTITUENTS`), the way the SHOM publishes it. Keeping the diurnal constituents makes the morning and the evening tide of a same day differ by about ten points, which published coefficients never do. With this, the computed values match the published ones exactly on the checked dates (74/78 on 27 Aug 2026, 83/86 on 28 Aug, 102 on 13–14 Aug and 12 Sep) — a mean error of 0.2 point, verified by test.

Brest's own semi-diurnal harmonics are embedded in `house.tideConstants.js` (467 bytes): every French harbour's coefficient is by definition Brest's, so it must be computable without a second download.

## Places with no tide

Not everywhere has a tide worth showing, and the widget says which case it is rather than drawing a flat curve. The two are told apart by different criteria, because the distance alone is not enough:

- **`no_station_nearby`** — the closest station is further than `MAX_STATION_DISTANCE_KM`. The house is inland: a house in Paris matches a harbour 150 km away, whose tide says nothing about where the user lives.
- **`negligible_tide`** — a station is genuinely nearby, but the spring range is below `NEGLIGIBLE_TIDE_RANGE_METERS`. This is the Mediterranean (Nice: 0.26 m, Ajaccio: 0.26 m) and the Baltic (Tallinn: 0.06 m), against 8.42 m in Saint-Malo.

## Attribution

The tide database is published under CC-BY-4.0, which requires attribution. The credit is rendered on the widget itself, below the curve, and **stays visible when the curve is hidden** — the data is still displayed either way.

## Files

| File | Role |
| --- | --- |
| `server/lib/house/house.getTideState.js` | Prediction, curve, coefficient, day selection |
| `server/lib/house/house.getTideStation.js` | Station download and per-house caching |
| `server/lib/house/house.tideConstants.js` | Thresholds, Brest harmonics, database URL |
| `front/src/components/boxs/tide/Tide.jsx` | Tide clock, curve, day tabs |
| `front/src/components/boxs/tide/EditTide.jsx` | Widget settings |
