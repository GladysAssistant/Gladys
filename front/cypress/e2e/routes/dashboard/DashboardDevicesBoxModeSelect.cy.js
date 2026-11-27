// A mode widget of the devices box is a native <select>. On Android, Chrome closes and
// reopens the picker of an open select whose value or options are written from script
// (issue 3438): device events that do not change the mode must leave that select alone.
describe('Dashboard Devices Box mode select', () => {
  const serverUrl = Cypress.env('serverUrl');
  const PILOT_WIRE = 'heater-pilot-wire';
  const COMFORT = 5;
  const ECO = 2;

  // the dashboard has other selects (tablet mode): this one is the control of a device row
  const modeSelect = () => cy.get('table select');

  const newState = (selector, value) =>
    cy.sendWebSocket({
      type: 'device.new-state',
      payload: { device_feature_selector: selector, last_value: value, last_value_changed: new Date().toISOString() }
    });

  beforeEach(() => {
    cy.login();

    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/dashboard`,
      body: {
        name: 'Test',
        type: 'test',
        selector: 'test',
        visibility: 'private',
        boxes: [
          [
            {
              type: 'devices',
              name: 'Heating',
              device_features: [PILOT_WIRE, 'heater-switch'],
              device_feature_names: ['Mode', 'Switch']
            }
          ],
          [],
          []
        ]
      }
    });

    cy.createDevice(
      {
        name: 'Heater',
        external_id: 'heater',
        selector: 'heater',
        features: [
          {
            name: 'Mode',
            category: 'heater',
            type: 'pilot-wire-mode',
            external_id: PILOT_WIRE,
            selector: PILOT_WIRE,
            read_only: false,
            keep_history: true,
            has_feedback: false,
            min: 0,
            max: 5
          },
          {
            name: 'Switch',
            category: 'switch',
            type: 'binary',
            external_id: 'heater-switch',
            selector: 'heater-switch',
            read_only: false,
            keep_history: true,
            has_feedback: false,
            min: 0,
            max: 1
          }
        ]
      },
      'example'
    );

    cy.visit('/dashboard/test');
    // the box only takes the states of the features it has loaded
    modeSelect().should('exist');
    cy.waitForWebSocket();
  });

  afterEach(() => {
    cy.deleteDevices('example');
    cy.request({
      method: 'DELETE',
      url: `${serverUrl}/api/v1/dashboard/test`
    });
  });

  it('Should not write to the select when a device event does not change the mode', () => {
    newState(PILOT_WIRE, COMFORT);
    modeSelect().should('have.value', `${COMFORT}`);

    // Count every write from script: the value of the select, and the value of its options
    const writes = { select: 0, options: 0 };
    modeSelect().then($select => {
      const select = $select[0];
      const win = select.ownerDocument.defaultView;
      const { get, set } = Object.getOwnPropertyDescriptor(win.HTMLSelectElement.prototype, 'value');
      Object.defineProperty(select, 'value', {
        configurable: true,
        get() {
          return get.call(this);
        },
        set(value) {
          writes.select += 1;
          set.call(this, value);
        }
      });
      new win.MutationObserver(mutations => {
        writes.options += mutations.length;
      }).observe(select, { attributes: true, childList: true, characterData: true, subtree: true });
    });

    // a feature no box shows, another feature of the same box, and the mode repeated
    newState('not-on-this-dashboard', 1);
    newState('heater-switch', 1);
    newState(PILOT_WIRE, COMFORT);
    cy.sendWebSocket({
      type: 'device.new-string-state',
      payload: {
        device_feature: 'not-on-this-dashboard',
        last_value_string: 'comfort',
        last_value_changed: new Date().toISOString()
      }
    });

    // the switch proves the events went through and the box rendered them
    cy.get('table .custom-switch-input').should('be.checked');
    modeSelect().should('have.value', `${COMFORT}`);
    cy.wrap(writes).should('deep.equal', { select: 0, options: 0 });

    // a mode that does change is still shown
    newState(PILOT_WIRE, ECO);
    modeSelect().should('have.value', `${ECO}`);
    cy.wrap(writes).should('deep.equal', { select: 1, options: 0 });
  });

  it('Should send the mode picked by the user', () => {
    cy.intercept('POST', `${serverUrl}/api/v1/device_feature/${PILOT_WIRE}/value`).as('setValue');
    newState(PILOT_WIRE, COMFORT);
    modeSelect().should('have.value', `${COMFORT}`);

    modeSelect().select(`${ECO}`);
    // the mode, whatever its type: this widget sends the string of the DOM, the fan ones a number
    cy.wait('@setValue')
      .its('request.body.value')
      .should(value => expect(Number(value)).to.eq(ECO));
    modeSelect().should('have.value', `${ECO}`);
  });
});
