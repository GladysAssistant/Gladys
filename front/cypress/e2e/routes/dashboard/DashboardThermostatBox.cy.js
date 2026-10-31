// A virtual thermostat heating: the room below its setpoint and its relay on.
// Its device is served by intercepts, so the widget is drawn without the
// thermostat service having to regulate anything.
const SETPOINT = 'cypress-thermostat-setpoint';
const ROOM_TEMPERATURE = 'cypress-thermostat-temperature';
const RELAY = 'cypress-thermostat-relay';

const feature = (selector, category, type, lastValue, extra = {}) => ({
  name: selector,
  selector,
  external_id: selector,
  category,
  type,
  last_value: lastValue,
  last_value_changed: new Date().toISOString(),
  read_only: false,
  has_feedback: false,
  min: 0,
  max: 1,
  ...extra
});

const thermostat = {
  name: 'Cypress thermostat',
  selector: 'cypress-thermostat',
  external_id: 'thermostat:cypress',
  params: [
    { name: 'THERMOSTAT_TYPE', value: 'virtual' },
    { name: 'THERMOSTAT_TEMPERATURE_FEATURE', value: ROOM_TEMPERATURE },
    { name: 'THERMOSTAT_SWITCH_FEATURE', value: RELAY },
    { name: 'THERMOSTAT_MODE', value: 'heating' }
  ],
  features: [
    feature(SETPOINT, 'thermostat', 'target-temperature', 21, { unit: 'celsius', min: 5, max: 35 }),
    // Heating (1), on the comfort preset (5).
    feature('cypress-thermostat-mode', 'thermostat', 'mode', 1, { max: 2 }),
    feature('cypress-thermostat-preset', 'thermostat', 'preset', 5, { max: 5 })
  ]
};

const sensors = {
  name: 'Cypress sensors',
  selector: 'cypress-sensors',
  features: [
    feature(ROOM_TEMPERATURE, 'temperature-sensor', 'decimal', 18, { unit: 'celsius', read_only: true, max: 50 }),
    feature(RELAY, 'switch', 'binary', 1)
  ]
};

describe('Dashboard Thermostat Box', () => {
  beforeEach(() => {
    cy.login();
    const serverUrl = Cypress.env('serverUrl');
    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/dashboard`,
      body: {
        name: 'Test',
        type: 'test',
        selector: 'test',
        visibility: 'private',
        boxes: [[{ type: 'thermostat', thermostat_feature: SETPOINT }], [], []]
      }
    });
    cy.intercept('GET', '**/api/v1/service/thermostat/device*', [thermostat]);
    cy.intercept('GET', '**/api/v1/service/thermostat/schedule*', []);
    cy.intercept({ method: 'GET', pathname: '/api/v1/device', query: { device_feature_selectors: /.+/ } }, [
      thermostat,
      sensors
    ]);
  });

  afterEach(() => {
    const serverUrl = Cypress.env('serverUrl');
    cy.request({
      method: 'DELETE',
      url: `${serverUrl}/api/v1/dashboard/test`
    });
  });

  // Safari resolves `transform-box: fill-box` on SVG text against the SVG's
  // origin: animated on its own position, the flame drifted to the bottom right
  // on every pulse. It is placed by a group and drawn on that group's origin,
  // which the pulse scales about in every browser.
  it('Should draw the heating flame on the origin of a placed group', () => {
    cy.visit('/dashboard/test');
    cy.get('[class*="activeIconHeating"]', { timeout: 10000 })
      .should('have.attr', 'x', '0')
      .and('have.attr', 'y', '0')
      .parent('g')
      .should('have.attr', 'transform')
      .and('match', /^translate\(/);
  });
});
