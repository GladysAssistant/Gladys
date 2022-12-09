const peripherals = require('../../../../../fixtures/integration/routes/integration/bluetooth/peripherals.json');

describe('Bluetooth discovered devices', () => {
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
        url: `${serverUrl}/api/v1/service/bluetooth/peripheral`
      },
      {
        fixture: 'integration/routes/integration/bluetooth/peripherals.json'
      }
    );

    cy.visit('/dashboard/integration/device/bluetooth/setup');
  });

  it('Check devices', () => {
    // Check scan button is enabled (and is the only button)
    cy.get('.card .card')
      .should('have.length', 3)
      .each((card, index) => {
        const peripheral = peripherals[index];
        cy.wrap(card).within(() => {
          // Check name
          cy.get('.card-header').should('have.text', peripheral.name);

          // Check data
          cy.get('input:visible')
            .should('have.length', 3)
            .then(inputs => {
              // Selector
              cy.wrap(inputs[0]).should('have.value', peripheral.external_id);
              // Bra,d
              const brand = ((peripheral.params || []).find(p => p.name === 'manufacturer') || {}).value || '';
              cy.wrap(inputs[1]).should('have.value', brand);
              // Model
              cy.wrap(inputs[2]).should('have.value', peripheral.model || '');
            });
        });
      });
  });
});
