describe('Bluetooth create no device', () => {
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

    cy.visit('/dashboard/integration/device/bluetooth/setup/bluetooth-no-device');
  });

  it('Check page', () => {
    // Check warning
    cy.get('.alert.alert-danger')
      .should('have.length', 1)
      .i18n('integration.bluetooth.discover.peripheral.notAvailable');

    cy.contains('global.backButton').click();

    // Redirect
    cy.location('pathname').should('eq', '/dashboard/integration/device/bluetooth/setup');
  });
});
