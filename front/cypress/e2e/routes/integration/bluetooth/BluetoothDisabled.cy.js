describe('Bluetooth - Disabled', () => {
  before(() => {
    cy.login();
  });

  it('Devices - Check page', () => {
    // Go to home page
    cy.visit('/dashboard/integration/device/bluetooth');

    // Check page URL
    cy.location('pathname').should('eq', '/dashboard/integration/device/bluetooth');

    // Check no warning
    cy.get('.alert.alert-warning').should('be.length', 0);
  });

  it('Discover - Check page', () => {
    // Go to discover page
    cy.contains('a', 'integration.bluetooth.discoverTab').click();

    // Check page URL
    cy.location('pathname').should('eq', '/dashboard/integration/device/bluetooth/setup');

    // Check warning
    cy.get('.alert.alert-warning')
      .should('be.length', 1)
      .i18n('integration.bluetooth.bluetoothNotReadyError');

    // Check scan button is disabled
    cy.contains('button', 'integration.bluetooth.discover.scanButton').should('be.disabled');
  });

  it('Scanner - Check page', () => {
    // Go to scanner page
    cy.contains('a', 'integration.bluetooth.setupTab').click();

    // Check page URL
    cy.location('pathname').should('eq', '/dashboard/integration/device/bluetooth/config');

    // Check warning
    cy.get('.alert.alert-warning')
      .should('be.length', 1)
      .i18n('integration.bluetooth.bluetoothNotReadyError');

    // Check scan button is disabled
    cy.contains('button', 'integration.bluetooth.setup.saveLabel').should('be.disabled');
    cy.contains('button', 'integration.bluetooth.setup.presenceScannerButton').should('be.disabled');
  });
});
