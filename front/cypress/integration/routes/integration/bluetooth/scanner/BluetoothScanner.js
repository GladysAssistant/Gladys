describe('Bluetooth scanner', () => {
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

    // Reset scanner config
    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/service/bluetooth/config`,
      body: {
        presenceScanner: {
          frequency: 60000,
          status: 'enabled'
        }
      }
    });

    cy.visit('/dashboard/integration/device/bluetooth/config');
  });

  it('Check page', () => {
    // Check warning
    cy.get('.alert.alert-warning').should('be.length', 0);

    // Check scan button is disabled
    cy.contains('button', 'integration.bluetooth.setup.saveLabel').should('be.disabled');
    cy.contains('button', 'integration.bluetooth.setup.presenceScannerButton').should('not.be.disabled');
  });

  it('Disable scanner', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/bluetooth/config`
      },
      req => {
        expect(req.body).deep.eq({
          presenceScanner: {
            frequency: 60000,
            status: 'disabled'
          }
        });
      }
    ).as('saveStatus');

    // Disable scanner
    cy.contains('integration.bluetooth.setup.presenceScannerStatusLabel').click();

    // Check timer is disabled
    cy.get('input[type=number]').should('be.disabled');

    // Check all buttons are enabled
    cy.contains('button', 'integration.bluetooth.setup.saveLabel')
      .should('not.be.disabled')
      .first()
      // Submit new config
      .click()
      .should('be.disabled');

    cy.wait('@saveStatus');
  });

  it('Enable scanner', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/bluetooth/config`
      },
      req => {
        expect(req.body).deep.eq({
          presenceScanner: {
            frequency: 120000,
            status: 'enabled'
          }
        });
      }
    ).as('saveStatus');

    // Check timer is disabled
    cy.get('input[type=number]').should('be.disabled');

    // Enable scanner
    cy.contains('integration.bluetooth.setup.presenceScannerStatusLabel').click();

    // Change timer value
    cy.get('input[type=number]').type('{selectall}2');

    // Check all buttons are enabled
    cy.contains('button', 'integration.bluetooth.setup.saveLabel')
      .should('not.be.disabled')
      .first()
      // Submit new config
      .click()
      .should('be.disabled');

    cy.wait('@saveStatus');
  });
});
