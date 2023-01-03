describe('Broadlink edit device', () => {
  before(() => {
    cy.login();

    // Create a actuator device
    const actuator = {
      external_id: 'broadlink:7396e6541fb0',
      selector: 'broadlink-7396e6541fb0',
      name: 'SP2 device',
      should_poll: false,
      poll_frequency: 60000,
      features: [
        {
          name: 'SP2 switch 1',
          category: 'switch',
          type: 'binary',
          external_id: 'broadlink:7396e6541fb0:0',
          selector: 'broadlink-7396e6541fb0-0',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: true
        },
        {
          name: 'SP2 switch 2',
          category: 'switch',
          type: 'binary',
          external_id: 'broadlink:7396e6541fb0:1',
          selector: 'broadlink-7396e6541fb0-1',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: true
        }
      ]
    };
    cy.createDevice(actuator, 'broadlink');

    cy.visit('/dashboard/integration/device/broadlink/edit/broadlink-7396e6541fb0');
  });

  after(() => {
    // Delete all Broadlink devices
    cy.deleteDevices('broadlink');
  });

  it('Check form', () => {
    cy.contains('.card-header', 'SP2 device').should('exist');
    cy.get('.card-body').within(() => {
      // Check device name
      cy.get('input')
        .should('have.value', 'SP2 device')
        .should('not.be.disabled');
      // Check device room
      cy.get('select')
        .should('have.value', '')
        .should('not.be.disabled');
      // Check device features
      cy.get('.tag').should('be.length', 2);
      cy.get('.card').should('be.length', 2);
      // Check device actions
      cy.get('button')
        .should('have.length', 2)
        .should('not.be.disabled');
    });
  });
});
