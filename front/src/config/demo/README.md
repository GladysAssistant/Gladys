# Demo fixtures

These files feed the public demo of Gladys ([demo.gladysassistant.com](https://demo.gladysassistant.com)),
published on every release by `.github/workflows/build-demo-website.yml`.

In demo mode (`DEMO_MODE=true`), the front never talks to a Gladys server: every request
goes through [`DemoHttpClient`](../../utils/DemoHttpClient.js), which looks the response up
in the map exported by [`index.js`](./index.js). The one exception is the community
integration store, downloaded live from its public index (see below).

## Running it locally

```bash
cd front
npm run start-demo   # http://localhost:1445
```

The browser console logs `<method> <url> not found in the demo fixtures` whenever a page
asks for a route nobody wrote a fixture for, which is the quickest way to spot a page that
was added without its demo data.

## How a response is resolved

A key is `"<method> <url>"`. `DemoHttpClient` tries, in this order:

1. the URL with its query string (`get /api/v1/room/kitchen?expand=devices`),
2. the URL alone (`get /api/v1/room/kitchen`),
3. the path without its query string.

So a fixture can answer one precise request, and the route itself answers all the others.
A value can also be **a function** of the query parameters: that is how charts, activity
history and device filters answer the request that was actually made.

## The files

| File               | What it holds                                                              |
| ------------------ | -------------------------------------------------------------------------- |
| `home.js`          | The demo house: rooms, devices and their features. **Source of truth.**     |
| `helpers.js`       | Builders for device features, stable ids, relative timestamps.              |
| `dashboards.js`    | The three dashboards (Home, Energy, Comfort): sections, widgets, appearance. |
| `weather.js`       | Weather forecast and sun position, computed from the current date.          |
| `history.js`       | Chart series, energy consumption and the activity page, generated on the fly. |
| `scenes.js`        | Scenes, calendar events and chat history.                                   |
| `integrations.js`  | Fixtures of the integration pages (`/api/v1/service/*`).                    |
| `store.js`         | The **live** catalog of community integrations, downloaded from the store.  |
| `system.js`        | System, gateway, sessions and background jobs pages.                        |
| `assets.js`        | Base64 avatars and camera snapshot.                                         |
| `index.js`         | Assembles everything into the response map.                                 |

## Dashboards

A dashboard is a stack of **sections**, each owning its own columns (see
`docs/specs/dashboard-flexible-layout-and-widgets.md`), plus its appearance: `icon` for the
tablet tab bar, `background_scene` for the Horizon background, `width` for wall panels. The
demo uses that model to show what the theme can do — a chips bar, quick actions, the house
view with live pins, scene buttons with a state subtitle — so keep new widgets on a real
device of `home.js` rather than inventing a selector.

## The community integration store

The catalog of external integrations is the one thing the demo does not invent.
`store.js` downloads the public store index (`index.json`, rebuilt hourly by
`GladysAssistant/integration-store`) — the very same file every Gladys instance
downloads, so **the demo lists the integrations published right now**, with their
covers, categories, GitHub stars and documentation. A snapshot committed here
would be out of date the week after.

It is therefore the only request of the demo that leaves the browser. It is made
only when the integrations page is opened, and a failure is not a bug: the last
index downloaded is kept (empty if none ever was, and the page then shows the
native integrations alone), exactly like an instance whose store is unreachable.
The refresh button reports `refreshed: false` when the download did not happen,
so the page warns about a stale catalog instead of claiming a fresh one.

Installing from the store answers like the rest of the demo: the integration is
turned into an installed one and its screens (Devices, Discovery, Configuration
built from the real `config_schema`, Logs) are registered on the fly, until the
page is reloaded — nothing is persisted.

## Adding a device

Add it to the right room in `home.js`: `index.js` derives `/device`, `/device/:selector`,
`/room`, `/room/:selector` and the "set value" routes from it, so the device shows up on the
devices page, in the room widgets and in the scene editor at once. Nothing else to write.

## Keeping the demo honest

Values are dated relatively (`minutesAgo(4)`) and the time series are generated from the
current date, so the demo never shows a forecast from three years ago. When you add a page
or a widget, open the demo, watch the console, and add the missing fixture.

Texts the demo writes as **Gladys itself** — today the chat history of `scenes.js` — go
through `localized({ en, fr })`, so they follow the language of the browser like the
interface does (`demoLanguage()` in `helpers.js`, also what `get /api/v1/me` answers).
The house itself (rooms, devices, scenes) stays in English: those are the names a user
typed in, not something the product says.
