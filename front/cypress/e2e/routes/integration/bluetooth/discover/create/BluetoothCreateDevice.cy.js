const [peripheral] = require('../../../../../../fixtures/integration/routes/integration/bluetooth/peripherals.json');

describe('Bluetooth create new device', () => {
  before(() => {
    cy.login();

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/bluetooth/status`
      },
      {
        fixture: 'integration/routes/integration/bluetooth/status_ready.json'
      }
    );
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/bluetooth/peripheral/${peripheral.selector}`
      },
      {
        body: peripheral
      }
    );

    cy.visit(`/dashboard/integration/device/bluetooth/setup/${peripheral.selector}`);
  });

  after(() => {
    // Delete all Bluetooth devices
    cy.deleteDevices('bluetooth');
  });

  it('Check page', () => {
    // Check warning
    cy.get('.alert.alert-warning').should('have.length', 0);

    // Check no default room
    cy.get('select').should('have.value', '');

    // Check presence not checked
    cy.get('input[type=radio]').should('not.have.property', 'checked');

    // Check save button
    cy.contains('integration.bluetooth.discover.peripheral.createLabel').should('be.disabled');

    // Check save button
    cy.contains('integration.bluetooth.discover.peripheral.cancelLabel').should('not.be.disabled');
  });

  it('Select room', () => {
    // Check no default room
    const { rooms } = Cypress.env('house');
    cy.get('select').select(rooms[0].name);

    // Check save button
    cy.contains('integration.bluetooth.discover.peripheral.createLabel').should('be.disabled');

    // Check save button
    cy.contains('integration.bluetooth.discover.peripheral.cancelLabel').should('not.be.disabled');
  });

  it('Check presence feature', () => {
    // Check presence feature
    cy.contains('integration.bluetooth.device.presenceSensorLabel').click();

    // Check save button
    cy.contains('integration.bluetooth.discover.peripheral.createLabel').should('not.be.disabled');

    // Check save button
    cy.contains('integration.bluetooth.discover.peripheral.cancelLabel').should('not.be.disabled');
  });

  it('Uncheck presence feature', () => {
    // Uncheck presence feature
    cy.contains('integration.bluetooth.device.presenceSensorLabel').click();

    // Check save button
    cy.contains('integration.bluetooth.discover.peripheral.createLabel').should('be.disabled');

    // Check save button
    cy.contains('integration.bluetooth.discover.peripheral.cancelLabel').should('not.be.disabled');
  });

  it('Check device well created', () => {
    // Check presence feature
    cy.contains('integration.bluetooth.device.presenceSensorLabel').click();

    // Check save button
    cy.contains('integration.bluetooth.discover.peripheral.createLabel').click();

    // Same page
    cy.location('pathname').should('eq', `/dashboard/integration/device/bluetooth/setup/${peripheral.selector}`);

    // Check message
    cy.get('.alert.alert-success').i18n('integration.bluetooth.discover.saveSuccess');

    // Click on button
    cy.contains('integration.bluetooth.discover.peripheral.successLabel').click();

    // Redirect
    cy.location('pathname').should('eq', '/dashboard/integration/device/bluetooth/setup');

    // Check device created
    cy.contains('a', 'integration.bluetooth.deviceTab').click();

    const { rooms } = Cypress.env('house');
    cy.contains('.card', peripheral.name)
      .should('exist')
      .within(() => {
        cy.get('select option:selected').should('have.text', rooms[0].name);
        cy.get('.tags .tag')
          .should('have.length', 1)
          .i18n('deviceFeatureCategory.presence-sensor.push');
      });
  });
});
