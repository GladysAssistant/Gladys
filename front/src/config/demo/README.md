# Demo fixtures

These files feed the public demo of Gladys ([demo.gladysassistant.com](https://demo.gladysassistant.com)),
published on every release by `.github/workflows/build-demo-website.yml`.

In demo mode (`DEMO_MODE=true`), the front never talks to a server: every request goes
through [`DemoHttpClient`](../../utils/DemoHttpClient.js), which looks the response up in
the map exported by [`index.js`](./index.js).

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
| `dashboards.js`    | The three dashboards (Home, Energy, Comfort) and their widgets.             |
| `weather.js`       | Weather forecast and sun position, computed from the current date.          |
| `history.js`       | Chart series, energy consumption and the activity page, generated on the fly. |
| `scenes.js`        | Scenes, calendar events and chat history.                                   |
| `integrations.js`  | Fixtures of the integration pages (`/api/v1/service/*`).                    |
| `system.js`        | System, gateway, sessions and background jobs pages.                        |
| `assets.js`        | Base64 avatars and camera snapshot.                                         |
| `index.js`         | Assembles everything into the response map.                                 |

## Adding a device

Add it to the right room in `home.js`: `index.js` derives `/device`, `/device/:selector`,
`/room`, `/room/:selector` and the "set value" routes from it, so the device shows up on the
devices page, in the room widgets and in the scene editor at once. Nothing else to write.

## Keeping the demo honest

Values are dated relatively (`minutesAgo(4)`) and the time series are generated from the
current date, so the demo never shows a forecast from three years ago. When you add a page
or a widget, open the demo, watch the console, and add the missing fixture.
