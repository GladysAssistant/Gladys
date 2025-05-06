describe('RFLink device list', () => {
  const device = {
    id: '86aa7',
    switch: 'switch',
    service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    name: `Prise`,
    selector: `rflink:86aa7:11`,
    external_id: `rflink:86aa7:11`,
    model: 'NewKaku',
    should_poll: false,
    features: [
      {
        name: 'switch',
        selector: `rflink:86aa7:switch:11`,
        external_id: `rflink:86aa7:switch:11`,
        rfcode: 'CMD',
        category: 'switch',
        type: 'binary',
        read_only: false,
        keep_history: true,
        has_feedback: false,
        min: 0,
        max: 1
      }
    ]
  };

  before(() => {
    cy.login();

    // Create a new peripheral
    cy.createDevice(device, 'rflink');

    cy.visit('/dashboard/integration/device/rflink');
  });

  after(() => {
    // Delete all Bluetooth devices
    cy.deleteDevices('rflink');
  });

  it('Check first device', () => {
    cy.contains('.card-header', device.name)
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.get('input').should('have.value', device.name);
        cy.get('select').should('have.value', '');
      });
  });

  it('Update device', () => {
    const { rooms } = Cypress.env('house');
    cy.contains('.card-header', device.name)
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.get('input')
          .clear()
          .type('New name');
        cy.get('select').select(rooms[0].name);

        cy.get('.card-header').should('have.text', 'New name');

        cy.contains('button', 'integration.bluetooth.device.saveButton').click();
      });
  });

  it('Check updated device', () => {
    const { rooms } = Cypress.env('house');
    cy.contains('.card-header', 'New name')
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.get('input').should('have.value', 'New name');
        cy.get('select option:selected').should('have.text', rooms[0].name);
      });
  });

  it('Edit delete', () => {
    cy.contains('.card-header', 'New name')
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.contains('button', 'integration.rflink.device.editButton').click();
      });

    // Check redirected to edit page
    cy.location('pathname').should('eq', '/dashboard/integration/device/rflink/edit/rflink-86aa7-11');

    // Go back
    cy.contains('global.backButton').click();
  });

  it('Delete delete', () => {
    cy.contains('.card-header', 'New name')
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.contains('button', 'integration.rflink.device.deleteButton').click();
      });

    cy.contains('.card-header', 'New name').should('not.exist');
  });
});
