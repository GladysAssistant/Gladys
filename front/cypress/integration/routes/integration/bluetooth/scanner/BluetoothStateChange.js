describe.skip('Bluetooth scanner - state change', () => {
  before(() => {
    cy.login();

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/bluetooth/status`
      },
      {
        fixture: 'integration/routes/integration/bluetooth/status_not_ready.json'
      }
    );

    cy.visit('/dashboard/integration/device/bluetooth/config');
  });

  it('Default disabled', () => {
    // Check warning
    cy.get('.alert.alert-warning')
      .should('have.length', 1)
      .i18n('integration.bluetooth.bluetoothNotReadyError');

    // Check scan button is enabled (and is the only button)
    cy.contains('integration.bluetooth.setup.presenceScannerButton').should('be.disabled');
  });

  it('Enabled by WebSocket', () => {
    // Handle WebSocket message
    cy.sendWebSocket({ type: 'bluetooth.status', payload: { ready: true } })
      // Check warning
      .get('.alert.alert-warning')
      .should('have.length', 0);

    // Check scan button is enabled (and is the only button)
    cy.contains('integration.bluetooth.setup.presenceScannerButton').should('not.be.disabled');
  });

  it('Disabled by WebSocket', () => {
    // Handle WebSocket message
    cy.sendWebSocket({ type: 'bluetooth.status', payload: { ready: false } })
      // Check warning
      .get('.alert.alert-warning')
      .should('have.length', 1)
      .i18n('integration.bluetooth.bluetoothNotReadyError');

    // Check scan button is enabled (and is the only button)
    cy.contains('integration.bluetooth.setup.presenceScannerButton').should('be.disabled');
  });
});
