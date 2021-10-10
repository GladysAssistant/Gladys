const peripherals = require('../../../../../fixtures/integration/routes/integration/bluetooth/peripherals.json');

describe('Bluetooth discover', () => {
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
    ).as('status');

    cy.visit('/dashboard/integration/device/bluetooth/setup');
  });

  it('Check page', () => {
    cy.wait('@status');

    // Check warning
    cy.get('.alert.alert-warning').should('have.length', 0);

    // Check scan button is enabled (and is the only button)
    cy.contains('integration.bluetooth.discover.scanButton').should('not.be.disabled');

    // Check no devices
    cy.get('.card .card').should('be.length', 0);
  });

  it('Start scan', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/bluetooth/scan`
      },
      {
        fixture: 'integration/routes/integration/bluetooth/status_scanning.json'
      }
    ).as('scan');

    cy.contains('integration.bluetooth.discover.scanButton')
      .should('have.class', 'btn-outline-primary')
      .click()
      .should('have.class', 'btn-outline-danger');

    cy.wait('@scan')
      .its('request.body')
      .should('have.property', 'scan', 'on');
  });

  it('Manual stop scan', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/bluetooth/scan`
      },
      {
        fixture: 'integration/routes/integration/bluetooth/status_ready.json'
      }
    );

    cy.contains('integration.bluetooth.discover.scanButton')
      .should('have.class', 'btn-outline-danger')
      .click()
      .should('have.class', 'btn-outline-primary');
  });

  it('Auto stop scan', () => {
    cy.sendWebSocket({ type: 'bluetooth.status', payload: { ready: true, scanning: false } })
      .contains('integration.bluetooth.discover.scanButton')
      .should('have.class', 'btn-outline-primary');
  });

  it('Receive new ready device', () => {
    cy.sendWebSocket({ type: 'bluetooth.discover', payload: peripherals[0] })
      .contains('button', 'integration.bluetooth.discover.createDeviceInGladys')
      .should('have.length', 1)
      .should('not.be.disabled');
  });

  it('Receive new updatable device', () => {
    const peripheral = peripherals[1];

    // Load bluetooth service id
    const serverUrl = Cypress.env('serverUrl');
    cy.request({
      method: 'GET',
      url: `${serverUrl}/api/v1/service/bluetooth`
    }).then(res => {
      const serviceId = res.body.id;
      peripheral.service_id = serviceId;
      peripheral.service.id = serviceId;
    });

    cy.sendWebSocket({ type: 'bluetooth.discover', payload: peripheral })
      .contains('button', 'integration.bluetooth.discover.updateDeviceInGladys')
      .should('have.length', 1)
      .should('not.be.disabled');
  });

  it('Receive new already binded device', () => {
    cy.sendWebSocket({ type: 'bluetooth.discover', payload: peripherals[2] })
      .contains('button', 'peanut')
      .should('have.length', 1)
      .should('be.disabled');
  });

  it('Go to creation page', () => {
    // Force required peripheral
    const peripheral = peripherals[0];
    cy.sendWebSocket({ type: 'bluetooth.discover', payload: peripheral })
      // Force status
      .sendWebSocket({ type: 'bluetooth.status', payload: { ready: true, scanning: false } })
      .contains('button', 'integration.bluetooth.discover.createDeviceInGladys')
      .click();

    cy.location('pathname').should('eq', `/dashboard/integration/device/bluetooth/setup/${peripheral.selector}`);
  });
});
