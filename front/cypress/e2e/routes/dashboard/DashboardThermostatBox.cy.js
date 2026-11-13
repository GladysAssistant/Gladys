// A virtual thermostat running, in either use: the room on the wrong side of
// its setpoint and its relay on. Its device is served by intercepts, so the
// widget is drawn without the thermostat service having to regulate anything.
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

const USES = {
  heating: { mode: 1, setpoint: 21, room: 18 },
  cooling: { mode: 2, setpoint: 24, room: 27 }
};

const thermostat = use => ({
  name: 'Cypress thermostat',
  selector: 'cypress-thermostat',
  external_id: 'thermostat:cypress',
  params: [
    { name: 'THERMOSTAT_TYPE', value: 'virtual' },
    { name: 'THERMOSTAT_TEMPERATURE_FEATURE', value: ROOM_TEMPERATURE },
    { name: 'THERMOSTAT_SWITCH_FEATURE', value: RELAY },
    { name: 'THERMOSTAT_MODE', value: use }
  ],
  features: [
    feature(SETPOINT, 'thermostat', 'target-temperature', USES[use].setpoint, { unit: 'celsius', min: 5, max: 35 }),
    feature('cypress-thermostat-mode', 'thermostat', 'mode', USES[use].mode, { max: 2 }),
    // On the comfort preset (5).
    feature('cypress-thermostat-preset', 'thermostat', 'preset', 5, { max: 5 })
  ]
});

const sensors = use => ({
  name: 'Cypress sensors',
  selector: 'cypress-sensors',
  features: [
    feature(ROOM_TEMPERATURE, 'temperature-sensor', 'decimal', USES[use].room, {
      unit: 'celsius',
      read_only: true,
      max: 50
    }),
    feature(RELAY, 'switch', 'binary', 1)
  ]
});

const serveThermostat = use => {
  cy.intercept('GET', '**/api/v1/service/thermostat/device*', [thermostat(use)]);
  cy.intercept('GET', '**/api/v1/service/thermostat/schedule*', []);
  cy.intercept({ method: 'GET', pathname: '/api/v1/device', query: { device_feature_selectors: /.+/ } }, [
    thermostat(use),
    sensors(use)
  ]);
};

// Safari resolves `transform-box: fill-box` on SVG text against the SVG's
// origin: animated on its own position, the flame drifted to the bottom right
// on every pulse. The icon is placed by a group on the gauge's centre line,
// 54 below its centre (110, 110), and drawn on that group's origin, which its
// animation scales and turns about in every browser.
const shouldBeDrawnOnItsGroupOrigin = iconClass => {
  cy.get(`[class*="${iconClass}"]`, { timeout: 10000 })
    .should('have.attr', 'x', '0')
    .and('have.attr', 'y', '0')
    .and('have.css', 'transform-box', 'view-box')
    .and('have.css', 'transform-origin', '0px 0px')
    .parent('g')
    .should('have.attr', 'transform', 'translate(110 164)');
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
  });

  afterEach(() => {
    const serverUrl = Cypress.env('serverUrl');
    cy.request({
      method: 'DELETE',
      url: `${serverUrl}/api/v1/dashboard/test`
    });
  });

  it('Should draw the heating flame on the origin of a placed group', () => {
    serveThermostat('heating');
    cy.visit('/dashboard/test');
    shouldBeDrawnOnItsGroupOrigin('activeIconHeating');
  });

  it('Should draw the cooling snowflake on the origin of a placed group', () => {
    serveThermostat('cooling');
    cy.visit('/dashboard/test');
    shouldBeDrawnOnItsGroupOrigin('activeIconCooling');
  });

  // A preset name longer than its column ran through the names beside it — in
  // German, "Frostschutz" into "Abwesend". On a phone the columns are at their
  // narrowest, so each name has to be painted inside its own button whatever
  // the language, the font and the hyphenation dictionaries the browser has.
  // Measured on the text itself rather than on its box, and clipped to the box
  // only where the box hides its overflow (the ellipsis of the last resort).
  it('Should keep every preset name inside its own column on a phone', () => {
    cy.viewport(360, 800);
    serveThermostat('heating');
    cy.visit('/dashboard/test');
    cy.get('[class*="segmentBtnLabelText"]', { timeout: 10000 })
      .should('have.length.at.least', 2)
      .each($text => {
        const element = $text[0];
        const range = element.ownerDocument.createRange();
        range.selectNodeContents(element);
        const text = range.getBoundingClientRect();
        const box = element.getBoundingClientRect();
        const clipped = element.ownerDocument.defaultView.getComputedStyle(element).overflowX !== 'visible';
        const left = clipped ? Math.max(text.left, box.left) : text.left;
        const right = clipped ? Math.min(text.right, box.right) : text.right;
        const column = element.closest('button').getBoundingClientRect();
        expect(left, `left edge of "${$text.text()}"`).to.be.at.least(column.left - 0.5);
        expect(right, `right edge of "${$text.text()}"`).to.be.at.most(column.right + 0.5);
      });
  });
});
