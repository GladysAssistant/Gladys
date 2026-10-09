# Weather condition icons

Icons of the pivot weather format (contract B.18), one file per condition of
`WEATHER_CONDITIONS` in a `-day` and a `-night` variant. The widget resolves
this folder with `import.meta.glob`, so adding a condition here is enough for
it to be rendered.

## Source

[Meteocons](https://github.com/basmilius/meteocons) by Bas Milius, taken from
the `@bybas/weather-icons` npm package (v2.0.0), `production/fill/all` set.

**Licensed under the MIT License** — see `LICENSE`. MIT allows redistribution
and modification, which makes it compatible with the Apache-2.0 license of
Gladys. Keep `LICENSE` alongside the icons: the MIT terms require the copyright
notice to travel with the files.

## Mapping

Several pivot conditions share a drawing when Meteocons draws no distinct one:

| Condition | Icon |
|---|---|
| `freezing-rain` | `sleet` — the closest phenomenon Meteocons draws |
| `freezing-fog` | `fog` (the plain variant, no sun or moon) |
| `sandstorm` | `dust-wind` |
| `night` | `clear-night` (deprecated condition, still rendered) |

`unknown` has no icon on purpose: the widget falls back to a neutral
thermometer emoji, which is the visual cue that the provider sent nothing
usable.
