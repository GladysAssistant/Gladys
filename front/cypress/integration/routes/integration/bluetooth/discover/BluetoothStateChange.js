describe('Bluetooth discover - state change', () => {
  before(() => {
    cy.login();

    cy.visit('/dashboard/integration/device/bluetooth/setup');
  });

  it('Default disabled', () => {
    // Check warning
    cy.get('.alert.alert-warning')
      .should('have.length', 1)
      .i18n('integration.bluetooth.bluetoothNotReadyError');

    // Check scan button is enabled (and is the only button)
    cy.contains('integration.bluetooth.discover.scanButton').should('be.disabled');
  });

  it('Enabled by WebSocket', () => {
    // Handle WebSocket message
    cy.sendWebSocket({ type: 'bluetooth.status', payload: { ready: true } })
      // Check warning
      .get('.alert.alert-warning')
      .should('have.length', 0);

    // Check scan button is enabled (and is the only button)
    cy.contains('integration.bluetooth.discover.scanButton').should('not.be.disabled');
  });

  it('Disabled by WebSocket', () => {
    // Handle WebSocket message
    cy.sendWebSocket({ type: 'bluetooth.status', payload: { ready: false } })
      // Check warning
      .get('.alert.alert-warning')
      .should('have.length', 1)
      .i18n('integration.bluetooth.bluetoothNotReadyError');

    // Check scan button is enabled (and is the only button)
    cy.contains('integration.bluetooth.discover.scanButton').should('be.disabled');
  });
});
