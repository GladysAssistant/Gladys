const { PARAMS } = require('../../../../../../../server/services/broadlink/lib/utils/broadlink.constants');
const uuid = require('uuid');

describe('Broadlink edit remote', () => {
  before(() => {
    cy.login();

    // Create a remote device
    const random = uuid.v4();
    const remote = {
      id: random,
      name: 'Light Remote',
      model: 'light',
      selector: `broadlink-${random}`,
      external_id: `broadlink:${random}`,
      should_poll: false,
      poll_frequency: null,
      created_at: '2019-02-12T07:49:07.556Z',
      updated_at: '2019-02-12T07:49:07.556Z',
      features: [
        {
          name: 'Power',
          external_id: `broadlink:${random}:binary`,
          selector: `broadlink-${random}-binary`,
          category: 'television',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: true
        }
      ],
      params: [
        {
          name: PARAMS.PERIPHERAL,
          value: '8008bda3ae44'
        },
        {
          name: 'code_binary-1',
          value: 'POWER'
        }
      ]
    };
    cy.createDevice(remote, 'broadlink');

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/broadlink/peripheral`
      },
      {
        fixture: 'integration/routes/integration/broadlink/peripherals.json'
      }
    );

    cy.visit(`/dashboard/integration/device/broadlink/edit/broadlink-${random}`);
  });

  after(() => {
    // Delete all Bluetooth devices
    cy.deleteDevices('broadlink');
  });

  it('Check form', () => {
    cy.contains('.card-header', 'Light Remote').should('exist');
    cy.get('.card-body').within(() => {
      // Check device name
      cy.get('input')
        .should('have.value', 'Light Remote')
        .should('not.be.disabled');
      // Check selects
      cy.get('select')
        .should('have.length', 3)
        .should('not.be.disabled');
      // Check room
      cy.get('select')
        .first()
        .should('have.value', '');
      cy.get('select')
        .eq(1)
        .should('have.value', '8008bda3ae44');
      cy.get('select')
        .last()
        .should('have.value', 'light');
      // Check device features
      cy.get('.tag').should('be.length', 3);
      cy.get('.tag-primary').should('be.length', 1);
      // Check device actions
      cy.get('button')
        .should('have.length', 3)
        .should('not.be.disabled');
      cy.get('button')
        .first()
        .i18n('integration.broadlink.setup.learnAllLabel');
      cy.get('button')
        .eq(1)
        .i18n('integration.broadlink.setup.saveButton');
      cy.get('button')
        .last()
        .i18n('integration.broadlink.setup.cancel');
    });
  });

  it('Learn all mode', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/broadlink/learn`
      },
      { learn: true }
    ).as('learnMode');

    cy.contains('button', 'integration.broadlink.setup.learnAllLabel')
      .should('not.be.disabled')
      .click()
      .should('not.exist');

    cy.contains('button', 'integration.broadlink.setup.quitLearnModeLabel')
      .should('exist')
      .should('not.be.disabled');

    cy.wait('@learnMode');

    // Check remote selctors are disabled
    cy.get('select')
      .eq(1)
      .should('be.disabled');
    cy.get('select')
      .eq(2)
      .should('be.disabled');

    cy.contains('div', 'integration.broadlink.setup.learningModeInProgress').should('exist');
    cy.contains('button', 'integration.broadlink.setup.skipLearningButton')
      .should('exist')
      .should('not.be.disabled');

    cy.get('.tag-info').should('be.length', 0);

    cy.get('.tag-secondary')
      .should('be.length', 1)
      .first()
      .i18n('deviceFeatureCategory.light.binary');
  });

  [
    { from: 'binary', to: 'binary', payload: 'binary-0' },
    { from: 'binary', to: 'brightness', payload: 'binary-1' },
    { from: 'brightness', to: 'brightness', payload: 'brightness-0' },
    { from: 'brightness', to: 'temperature', payload: 'brightness-1' },
    { from: 'temperature', to: 'temperature', payload: 'temperature-0' },
    { from: 'temperature', payload: 'temperature-1' }
  ].forEach((feature, index) => {
    it(`Learn button: ${feature.from} (${index})`, () => {
      cy.get('.tag-secondary')
        .should('be.length', 1)
        .first()
        .i18n(`deviceFeatureCategory.light.${feature.from}`);

      cy.contains('div', 'integration.broadlink.setup.learningModeInProgress').should('exist');

      // Handle WebSocket message
      cy.sendWebSocket({
        type: 'broadlink.learn',
        payload: { action: 'success', code: feature.payload }
      });

      if (feature.to) {
        const serverUrl = Cypress.env('serverUrl');
        cy.intercept(
          {
            method: 'POST',
            url: `${serverUrl}/api/v1/service/broadlink/learn`
          },
          { learn: true }
        ).as('learnMode');

        cy.contains('button', 'integration.broadlink.setup.skipLearningButton').should('not.exist');

        cy.wait('@learnMode');

        cy.get('.tag-secondary')
          .should('be.length', 1)
          .first()
          .i18n(`deviceFeatureCategory.light.${feature.to}`);
      } else {
        cy.get('.tag-secondary').should('not.exist');
      }
    });
  });

  it('Check all learned', () => {
    cy.get('.tag-primary').should('be.length', 3);
  });

  it('Save device', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept({
      method: 'POST',
      url: `${serverUrl}/api/v1/device`
    }).as('saveDevice');

    cy.contains('button', 'integration.broadlink.setup.saveButton').click();

    cy.wait('@saveDevice');

    cy.contains('button', 'integration.broadlink.setup.successLabel').click();
    cy.location('pathname').should('eq', '/dashboard/integration/device/broadlink');
  });

  it('Check switch device', () => {
    cy.contains('.card-header', 'Light Remote')
      .should('exist')
      .parent('.card')
      .within(() => {
        // Check device name
        cy.get('input')
          .should('have.value', 'Light Remote')
          .should('not.be.disabled');
        // Check device room
        cy.get('select')
          .should('have.value', '')
          .should('not.be.disabled');
        // Check device features
        cy.get('.tag').should('be.length', 3);
      });
  });
});
