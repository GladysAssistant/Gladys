// The widget handing a thermostat back to an Off point of its programme
// (spec thermostat.md C.0.1, D.0). The device and its programme are served by
// intercepts and every write is captured, so what is checked is the order of
// the widget's own writes — the server is not asked to regulate anything.
const SETPOINT = 'cypress-offpoint-setpoint';
const MODE = 'cypress-offpoint-mode';
const PRESET = 'cypress-offpoint-preset';

// THERMOSTAT_PRESET and THERMOSTAT_MODE in server/utils/constants.js.
const PRESET_SCHEDULE = 0;
const PRESET_COMFORT = 5;
const MODE_OFF = 0;
const MODE_HEATING = 1;

const feature = (selector, type, lastValue, extra = {}) => ({
  name: selector,
  selector,
  external_id: selector,
  category: 'thermostat',
  type,
  last_value: lastValue,
  last_value_changed: new Date().toISOString(),
  read_only: false,
  has_feedback: false,
  min: 0,
  max: 5,
  ...extra
});

// A virtual thermostat on `mode`, carrying a hold on Comfort until in an hour.
const thermostat = mode => ({
  name: 'Cypress Off point',
  selector: 'cypress-offpoint',
  external_id: 'thermostat:cypress-offpoint',
  params: [
    { name: 'THERMOSTAT_TYPE', value: 'virtual' },
    { name: 'THERMOSTAT_MODE', value: 'heating' },
    { name: 'THERMOSTAT_MANUAL_SETPOINT', value: '21' },
    { name: 'THERMOSTAT_MANUAL_UNTIL', value: String(Date.now() + 60 * 60 * 1000) }
  ],
  features: [
    feature(SETPOINT, 'target-temperature', 21, { unit: 'celsius', min: 5, max: 35 }),
    feature(MODE, 'mode', mode, { max: 2 }),
    feature(PRESET, 'preset', PRESET_COMFORT)
  ]
});

// A programme whose point in force is Off.
const programme = {
  id: 'cypress-programme',
  selector: 'cypress-programme',
  name: 'Cypress programme',
  house: 'cypress-house',
  devices: [{ selector: 'cypress-offpoint' }],
  transitions: [{ day_of_week: 0, time: '00:00', preset: 'off' }],
  current: { day_of_week: 0, time: '00:00', preset: 'off' },
  next: null
};

// `scheduleDelay`: how long every read of the programme after the first takes.
const serve = (mode, scheduleDelay = 0) => {
  let scheduleReads = 0;
  cy.intercept('GET', '**/api/v1/service/thermostat/device*', [thermostat(mode)]);
  cy.intercept('GET', '**/api/v1/service/thermostat/schedule*', req => {
    scheduleReads += 1;
    req.reply({ body: [programme], delay: scheduleReads > 1 ? scheduleDelay : 0 });
  });
  cy.intercept({ method: 'GET', pathname: '/api/v1/device', query: { device_feature_selectors: /.+/ } }, [
    thermostat(mode)
  ]);
  cy.intercept('POST', '**/api/v1/device_feature/*/value', { statusCode: 200, body: {} }).as('write');
};

// Every write the widget made so far, as `selector=value`.
const writes = () =>
  cy
    .get('@write.all')
    .then(calls =>
      calls.map(call => `${call.request.url.split('/device_feature/')[1].split('/')[0]}=${call.request.body.value}`)
    );

const presetButton = icon => cy.get(`button[aria-pressed]:has(i.${icon})`, { timeout: 10000 });

describe('Dashboard Thermostat Box on an Off point', () => {
  beforeEach(() => {
    cy.login();
    cy.request({
      method: 'POST',
      url: `${Cypress.env('serverUrl')}/api/v1/dashboard`,
      body: {
        name: 'Test',
        type: 'test',
        selector: 'test',
        visibility: 'private',
        boxes: [[{ type: 'thermostat', thermostat_feature: SETPOINT }], [], []]
      }
    });
  });

  afterEach(() => {
    cy.request({ method: 'DELETE', url: `${Cypress.env('serverUrl')}/api/v1/dashboard/test` });
  });

  // Started while its hold was still in force, the thermostat powered the unit
  // on, and the pass the `schedule` write triggers switched it off again.
  it('Should hand the programme back before starting a stopped thermostat', () => {
    serve(MODE_OFF);
    cy.visit('/dashboard/test');
    cy.get('button:has(i.fe-play)', { timeout: 10000 }).click();
    cy.wait(['@write', '@write']);
    writes().should('deep.equal', [`${PRESET}=${PRESET_SCHEDULE}`, `${MODE}=${MODE_HEATING}`]);
  });

  // Comfort tapped while Off was handing back was sent at once, then
  // overwritten by the `schedule` the hand-back wrote last.
  it('Should apply a preset tapped during the hand-back once it is done', () => {
    serve(MODE_HEATING, 1500);
    cy.visit('/dashboard/test');
    presetButton('fe-power').click();
    presetButton('fe-flame').click();
    cy.wait(['@write', '@write']);
    writes().should('deep.equal', [`${PRESET}=${PRESET_SCHEDULE}`, `${PRESET}=${PRESET_COMFORT}`]);
  });

  // A second Off while the first hands back would stop the thermostat for the
  // season: it is dropped.
  it('Should drop a second Off tapped during the hand-back', () => {
    serve(MODE_HEATING, 1500);
    cy.visit('/dashboard/test');
    presetButton('fe-power').click();
    presetButton('fe-power').click();
    cy.wait('@write');
    // A write that must not happen has no request to wait for: long enough for a
    // queued tap to have been written.
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    writes().should('deep.equal', [`${PRESET}=${PRESET_SCHEDULE}`]);
  });
});
