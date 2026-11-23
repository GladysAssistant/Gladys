// A setpoint row of the "devices" widget stays within the range the device publishes (the min and
// max of the feature): + and − stop at the bounds, and a typed value beyond them is brought back.
describe('Dashboard Devices Box: setpoint within the range of the device', () => {
  const serverUrl = Cypress.env('serverUrl');
  const setpoint = 'setpoint-radiator-valve';
  const row = () => cy.contains('tr', 'Radiator valve');
  const addButton = () => row().find('[data-cy="setpoint-add"]');
  const substractButton = () => row().find('[data-cy="setpoint-substract"]');
  const valueField = () => row().find('[data-cy="setpoint-value"]');
  // what the server sends when the device reports a new setpoint
  const deviceReports = value =>
    cy.sendWebSocket({
      type: 'device.new-state',
      payload: { device_feature_selector: setpoint, last_value: value, last_value_changed: new Date().toISOString() }
    });
  const expectSent = value =>
    cy.wait('@command').then(({ request }) => {
      expect(request.url).to.contain(`/device_feature/${setpoint}/value`);
      expect(request.body.value).to.equal(value);
    });

  beforeEach(() => {
    cy.login();
    const { rooms } = Cypress.env('house');
    cy.request({ method: 'GET', url: `${serverUrl}/api/v1/room/${rooms[0].selector}` }).then(res => {
      cy.createDevice(
        {
          name: 'Radiator valve',
          external_id: setpoint,
          selector: setpoint,
          room_id: res.body.id,
          features: [
            {
              name: 'Setpoint',
              category: 'thermostat',
              type: 'target-temperature',
              external_id: setpoint,
              selector: setpoint,
              read_only: false,
              keep_history: false,
              has_feedback: true,
              unit: 'celsius',
              min: 5,
              max: 28
            }
          ]
        },
        'example'
      );
    });
    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/dashboard`,
      body: {
        name: 'Test',
        type: 'test',
        selector: 'test',
        visibility: 'private',
        boxes: [
          [{ type: 'devices', name: 'Heating', device_features: [setpoint], device_feature_names: ['Radiator valve'] }]
        ]
      }
    });
    cy.intercept('POST', '**/api/v1/device_feature/*/value', { statusCode: 200, body: {} }).as('command');
    cy.visit('/dashboard/test');
    cy.waitForWebSocket();
  });

  afterEach(() => {
    cy.deleteDevices('example');
    cy.request({ method: 'DELETE', url: `${serverUrl}/api/v1/dashboard/test` });
  });

  it('Should stop + at the maximum of the device and − at its minimum', () => {
    deviceReports(28);
    valueField().should('have.value', '28');
    addButton().should('be.disabled');
    substractButton()
      .should('not.be.disabled')
      .click();
    expectSent(27.5);

    deviceReports(27.8);
    // 28.3 would be refused by the device: + sends its maximum
    addButton().click();
    expectSent(28);

    deviceReports(5);
    substractButton().should('be.disabled');
    addButton().should('not.be.disabled');
  });

  it('Should bring a setpoint left outside the range back into it', () => {
    deviceReports(30);
    addButton().should('be.disabled');
    substractButton().click();
    expectSent(28);
  });

  it('Should bring a typed setpoint beyond the range back to the nearest bound', () => {
    deviceReports(20);
    valueField()
      .clear()
      .type('35')
      .blur();
    expectSent(28);
    valueField().should('have.value', '28');
  });
});
