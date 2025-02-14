describe('Bluetooth device edit', () => {
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
    const { features } = device;
    let keepHistoryValueBegin;
    let keepHistoryValueAfter;
    if (features[0].keep_history) {
      keepHistoryValueBegin = 'be.checked';
      keepHistoryValueAfter = 'be.not.checked';
    } else {
      keepHistoryValueBegin = 'be.not.checked';
      keepHistoryValueAfter = 'be.checked';
    }
    cy.contains('.card-header', device.name)
      .should('exist')
      .parent('.card')
      .within(() => {
        // Input name
        cy.get('input')
          .first()
          .as('nameInput');
        cy.get('@nameInput').clear();
        cy.get('@nameInput').type('New name');

        // Select room
        cy.get('select').select(rooms[0].name);

        // Feature name
        cy.get('#featureName_0').as('featureInput');
        cy.get('@featureInput').clear();
        cy.get('@featureInput').type('Sensor');

        cy.get('#keep_history_0').should(keepHistoryValueBegin);
        cy.get('[class="custom-switch-indicator"]').click();
        cy.get('#keep_history_0').should(keepHistoryValueAfter);

        cy.contains('button', 'integration.bluetooth.device.saveButton').click();
      });
  });
});
