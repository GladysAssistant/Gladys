describe('Broadlink peripheral list', () => {
  const peripherals = [];

  before(() => {
    cy.login();

    const serverUrl = Cypress.env('serverUrl');

    // Set right serviceId to loaded peripherals
    cy.request({
      method: 'GET',
      url: `${serverUrl}/api/v1/service/broadlink`
    }).then(resp => {
      return cy.fixture('integration/routes/integration/broadlink/peripherals.json').then(list => {
        list.forEach(peripheral => {
          if (peripheral.device) {
            peripheral.device.service_id = resp.body.id;
          }
          peripherals.push(peripheral);
        });

        return peripherals;
      });
    });

    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/broadlink/peripheral`
      },
      peripherals
    );

    cy.visit('/dashboard/integration/device/broadlink/peripheral');
  });

  after(() => {
    // Delete all Broadlink devices
    cy.deleteDevices('broadlink');
  });

  it('Check list', () => {
    cy.get('[data-cy=peripheral-card]').should('be.length', 4);
  });

  it('Check already created device', () => {
    cy.contains('.card-header', 'MP1')
      .should('exist')
      .parent('.card')
      .within(() => {
        // Check peripheral name
        cy.get('[data-cy=peripheral-name]')
          .should('have.value', 'MP1')
          .should('be.disabled');
        // Check peripheral model
        cy.get('[data-cy=peripheral-model]')
          .should('have.value', 'MP1 model')
          .should('be.disabled');
        // Check room
        cy.get('select').should('be.disabled');
        // Check peripheral ip
        cy.get('[data-cy=peripheral-ip]')
          .should('have.value', '210.248.100.245')
          .should('be.disabled');
        // Check peripheral address
        cy.get('[data-cy=peripheral-address]')
          .should('have.value', '4bf75cf0fdbb')
          .should('be.disabled');
        // Check peripheral features
        cy.get('.tag').should('be.length', 4);
        // Check peripheral action
        cy.get('[data-cy=peripheral-submit]')
          .should('be.disabled')
          .i18n('integration.broadlink.peripheral.alreadyCreatedButton');
      });
  });

  it('Check new device', () => {
    cy.contains('.card-header', 'SP2')
      .should('exist')
      .parent('.card')
      .within(() => {
        // Check peripheral name
        cy.get('[data-cy=peripheral-name]')
          .should('have.value', 'SP2')
          .should('not.be.disabled');
        // Check peripheral model
        cy.get('[data-cy=peripheral-model]')
          .should('have.value', 'SP2 model')
          .should('be.disabled');
        // Check room
        cy.get('select').should('not.be.disabled');
        // Check peripheral ip
        cy.get('[data-cy=peripheral-ip]')
          .should('have.value', '227.154.146.114')
          .should('be.disabled');
        // Check peripheral address
        cy.get('[data-cy=peripheral-address]')
          .should('have.value', '7396e6541fb0')
          .should('be.disabled');
        // Check peripheral features
        cy.get('.tag').should('be.length', 1);
        // Check peripheral action
        cy.get('[data-cy=peripheral-submit]')
          .should('not.be.disabled')
          .i18n('integration.broadlink.peripheral.saveButton');
      });
  });

  it('Check locked device', () => {
    cy.contains('.card-header', 'SP3')
      .should('exist')
      .parent('.card')
      .within(() => {
        // Check peripheral name
        cy.get('[data-cy=peripheral-name]')
          .should('have.value', 'SP3')
          .should('be.disabled');
        // Check peripheral model
        cy.get('[data-cy=peripheral-model]')
          .should('have.value', 'SP3 model')
          .should('be.disabled');
        // Check room
        cy.get('select').should('be.disabled');
        // Check peripheral ip
        cy.get('[data-cy=peripheral-ip]')
          .should('have.value', '227.154.146.115')
          .should('be.disabled');
        // Check peripheral address
        cy.get('[data-cy=peripheral-address]')
          .should('have.value', '7396e6541fb9')
          .should('be.disabled');
        // Check peripheral features
        cy.get('.tag').should('be.length', 1);
        // Check peripheral action
        cy.get('[data-cy=peripheral-submit]')
          .should('be.disabled')
          .i18n('integration.broadlink.peripheral.notConnectable');
      });
  });

  it('Check hub peripheral', () => {
    cy.contains('.card-header', 'RM3 Pro Plus')
      .should('exist')
      .parent('.card')
      .within(() => {
        // Check peripheral name
        cy.get('[data-cy=peripheral-name]')
          .should('have.value', 'RM3 Pro Plus')
          .should('be.disabled');
        // Check peripheral model
        cy.get('[data-cy=peripheral-model]')
          .should('have.value', 'RM3 model')
          .should('be.disabled');
        // Check room
        cy.get('select').should('not.exist');
        // Check peripheral ip
        cy.get('[data-cy=peripheral-ip]')
          .should('have.value', '220.156.58.18')
          .should('be.disabled');
        // Check peripheral address
        cy.get('[data-cy=peripheral-address]')
          .should('have.value', '8008bda3ae44')
          .should('be.disabled');
        // Check peripheral features
        cy.get('.tag').should('be.length', 0);
        // Check peripheral action
        cy.get('[data-cy=peripheral-submit]')
          .should('not.be.disabled')
          .i18n('integration.broadlink.peripheral.createRemoteButton');
      });
  });

  it('Create new device', () => {
    const serverUrl = Cypress.env('serverUrl');
    const { rooms } = Cypress.env('house');

    cy.intercept({
      method: 'POST',
      url: `${serverUrl}/api/v1/device`
    }).as('saveDevice');

    cy.contains('.card-header', 'SP2')
      .should('exist')
      .parent('.card')
      .within(() => {
        // Check peripheral name
        cy.get('[data-cy=peripheral-name]')
          // Update name value
          .type(' Renamed');

        cy.get('select').select(rooms[0].name);

        cy.get('[data-cy=peripheral-submit]').click();
      });

    cy.wait('@saveDevice');

    // Check device well created
    cy.get('@saveDevice')
      .its('response.body')
      .should(body => {
        expect(body.name).to.eq('SP2 Renamed');
        expect(body.room.name).to.eq(rooms[0].name);
      });

    cy.contains('.card-header', 'SP2')
      .should('exist')
      .parent('.card')
      .within(() => {
        // Check peripheral name
        cy.get('[data-cy=peripheral-name]')
          .should('have.value', 'SP2 Renamed')
          .should('be.disabled');
        // Check room
        cy.get('select')
          .should('not.have.value', '')
          .should('be.disabled');
        // Check peripheral address
        cy.get('[data-cy=peripheral-address]')
          .should('have.value', '7396e6541fb0')
          .should('be.disabled');
        // Check peripheral features
        cy.get('.tag').should('be.length', 1);
        // Check peripheral action
        cy.get('[data-cy=peripheral-submit]')
          .should('be.disabled')
          .i18n('integration.broadlink.peripheral.alreadyCreatedButton');
      });
  });

  it('Create new remote', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/broadlink/peripheral`
      },
      peripherals
    ).as('peripherals');

    cy.contains('button', 'integration.broadlink.peripheral.createRemoteButton').click();
    cy.location('pathname').should('eq', '/dashboard/integration/device/broadlink/edit');

    cy.wait('@peripherals');

    cy.get('[data-cy=remote-name]').should('have.value', '');
    cy.get('[data-cy=remote-room]').should('have.value', '');
    cy.get('[data-cy=remote-peripheral]').should('have.value', '8008bda3ae44');
    cy.get('[data-cy=remote-category]').should('not.have.value');

    cy.contains('button', 'global.backButton').click();
    cy.location('pathname').should('eq', '/dashboard/integration/device/broadlink/peripheral');
  });
});
