// Regenerates src/config/timezoneCountries.js from the IANA time zone database
// (public domain). Run from /front: node cli/generate-timezone-countries.js
//
// zone.tab lists one zone per country; `backward` lists the aliases of renamed
// zones (Europe/Kiev -> Europe/Kyiv), which take the country of their target.
// zone.tab is used rather than zone1970.tab on purpose: the latter merges the
// zones that have kept the same clocks since 1970 (Europe/Amsterdam into
// Europe/Brussels), which would place a Dutch instance in Belgium.
const fs = require('fs');
const path = require('path');

const TZ_BASE_URL = 'https://raw.githubusercontent.com/eggert/tz/main';
const OUTPUT = path.join(__dirname, '..', 'src', 'config', 'timezoneCountries.js');

const download = async file => {
  const response = await fetch(`${TZ_BASE_URL}/${file}`);
  if (!response.ok) {
    throw new Error(`${file}: HTTP ${response.status}`);
  }
  return response.text();
};

const run = async () => {
  const zones = {};
  (await download('zone.tab'))
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .forEach(line => {
      const [country, , zone] = line.split('\t');
      zones[zone] = country;
    });
  const links = {};
  (await download('backward'))
    .split('\n')
    .filter(line => line.startsWith('Link'))
    .forEach(line => {
      const [, target, alias] = line.split(/\s+/);
      links[alias] = target;
    });
  Object.keys(links).forEach(alias => {
    let target = links[alias];
    const seen = new Set();
    while (links[target] && !zones[target] && !seen.has(target)) {
      seen.add(target);
      target = links[target];
    }
    if (!zones[alias] && zones[target]) {
      zones[alias] = zones[target];
    }
  });
  const lines = [
    '// Generated from the IANA time zone database (zone.tab + backward links,',
    '// public domain): the country of each zone, as an ISO 3166-1 alpha-2 code.',
    '// zone.tab is used rather than zone1970.tab on purpose: the latter merges',
    '// zones that have kept the same clocks since 1970 (Europe/Amsterdam into',
    '// Europe/Brussels), which would place a Dutch instance in Belgium.',
    '// Regenerate with: node cli/generate-timezone-countries.js (from /front)',
    '',
    '/* eslint-disable */',
    '// prettier-ignore',
    'export default {',
    ...Object.keys(zones)
      .sort()
      .map(zone => `  '${zone}': '${zones[zone]}',`),
    '};',
    ''
  ];
  fs.writeFileSync(OUTPUT, lines.join('\n'));
  // eslint-disable-next-line no-console
  console.log(`${Object.keys(zones).length} zones written to ${OUTPUT}`);
};

run().catch(e => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
