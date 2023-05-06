describe('Zigbee2Mqtt setup wizard local mode from scratch', () => {
  before(() => {
    cy.login();

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/status`
      },
      {
        fixture: 'integration/routes/integration/zigbee2mqtt/status_ready_to_setup.json'
      }
    );
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/zigbee2mqtt/setup`
      },
      {
        body: {}
      }
    );
    cy.visit('/dashboard/integration/device/zigbee2mqtt/setup');
  });

  it('Check list', () => {
    cy.get('[data-cy=z2m-setup-wizard]')
      .should('exist')
      .get('.card-deck')
      .should('be.length', 1)
      .get('button')
      .should('be.length', 1);

    cy.get('[data-cy=z2m-setup-local-panel]')
      .should('exist')
      .get('.requirement')
      .should('be.length', 3);

    cy.get('[data-cy=z2m-setup-select-local]')
      .should('exist')
      .should('not.be.disabled');
  });

  it('Select local mode', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/usb/port`
      },
      {
        fixture: 'integration/routes/integration/usb/get_available_usb_ports.json'
      }
    ).as('usbPorts');

    cy.get('[data-cy=z2m-setup-select-local]').click();
    cy.wait('@usbPorts');

    // Setup panel should be hidden
    cy.get('[data-cy=z2m-setup-select-local]').should('not.exist');

    // Save button is disabled
    cy.get('[data-cy=z2m-setup-local-save]').should('be.disabled');

    // Start typing on USB port and abort
    cy.get('[data-cy=z2m-setup-local-usb-field]')
      .children()
      .type('invalid value{esc}');
    // Save button is still disabled
    cy.get('[data-cy=z2m-setup-local-save]').should('be.disabled');

    // Start typing on USB port and confirm
    cy.get('[data-cy=z2m-setup-local-usb-field]')
      .children()
      .click()
      .type('{downArrow}{enter}');

    // Save button is still enabled
    cy.get('[data-cy=z2m-setup-local-save]').should('not.be.disabled');

    // Select a dongle name
    cy.get('[data-cy=z2m-setup-local-dongle-field]')
      .children()
      .click()
      .type('{downArrow}{enter}');
  });

  it('Confirm configuration', () => {
    cy.get('[data-cy=z2m-setup-local-save]').click();
    cy.get('[data-cy=z2m-setup-local-save]').should('not.exist');
    cy.get('[data-cy=z2m-setup-local-summary]').should('exist');
    cy.get('[data-cy=z2m-setup-save]').should('exist');
  });
});
