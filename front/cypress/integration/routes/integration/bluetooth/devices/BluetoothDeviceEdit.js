describe('Bluetooth device list', () => {
  const device = {
    name: 'Bluetooth Device',
    external_id: 'bluetooth:5544332211',
    selector: 'bluetooth-5544332211',
    features: [
      {
        name: 'Presence',
        category: 'presence-sensor',
        type: 'push',
        external_id: 'bluetooth:5544332211:presence-sensor',
        selector: 'bluetooth-5544332211-presence-sensor',
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 1
      }
    ]
  };

  before(() => {
    cy.login();

    // Create a new peripheral
    cy.createDevice(device, 'bluetooth');

    cy.visit('/dashboard/integration/device/bluetooth/bluetooth-5544332211');
  });

  after(() => {
    // Delete all Bluetooth devices
    cy.deleteDevices('bluetooth');
  });

  it('Check first device', () => {
    cy.contains('.card-header', device.name)
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.get('input')
          .first()
          .should('have.value', device.name);
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
          .first()
          .clear()
          .type('New name');
        cy.get('select').select(rooms[0].name);
        cy.get('input')
          .last()
          .clear()
          .type('Sensor');

        cy.contains('button', 'integration.bluetooth.device.saveButton').click();
      });
  });

  it('Check updated device', () => {
    cy.contains('button', 'global.backButton').click();

    const { rooms } = Cypress.env('house');
    cy.contains('.card-header', 'New name')
      .should('exist')
      .parent('.card')
      .within(() => {
        cy.get('input').should('have.value', 'New name');
        cy.get('select option:selected').should('have.text', rooms[0].name);
      });
  });
});
