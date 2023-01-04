const { PARAMS } = require('../../../../../../../server/services/broadlink/lib/utils/broadlink.constants');

describe('Broadlink edit remote - skip all', () => {
  before(() => {
    cy.login();

    // Create a remote device
    const remote = {
      name: 'Light Remote',
      model: 'light',
      selector: 'broadlink-8008bda3ae44',
      external_id: 'broadlink:8008bda3ae44',
      should_poll: false,
      poll_frequency: null,
      created_at: '2019-02-12T07:49:07.556Z',
      updated_at: '2019-02-12T07:49:07.556Z',
      features: [
        {
          name: 'Power',
          external_id: 'broadlink:8008bda3ae44:binary',
          selector: 'broadlink-8008bda3ae44-binary',
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
          name: 'ir_code_binary-1',
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

    cy.visit('/dashboard/integration/device/broadlink/edit/broadlink-8008bda3ae44');
  });

  after(() => {
    // Delete all Broadlink devices
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
        .i18n('global.backButton');
      cy.get('button')
        .last()
        .i18n('integration.broadlink.setup.saveButton');
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

    cy.get('.tag-secondary')
      .should('be.length', 1)
      .first()
      .i18n('deviceFeatureCategory.light.binary');
  });

  [
    { from: 'binary', to: 'binary' },
    { from: 'binary', to: 'brightness' },
    { from: 'brightness', to: 'brightness' },
    { from: 'brightness', to: 'temperature' },
    { from: 'temperature', to: 'temperature' },
    { from: 'temperature' }
  ].forEach((feature, index) => {
    it(`Skip button: ${feature.from} (${index})`, () => {
      const serverUrl = Cypress.env('serverUrl');
      cy.intercept(
        {
          method: 'POST',
          url: `${serverUrl}/api/v1/service/broadlink/learn/cancel`
        },
        { cancelLearn: true }
      ).as('cancelLearnMode');

      cy.get('.tag-secondary')
        .should('be.length', 1)
        .first()
        .i18n(`deviceFeatureCategory.light.${feature.from}`);

      cy.contains('div', 'integration.broadlink.setup.learningModeInProgress').should('exist');
      cy.contains('button', 'integration.broadlink.setup.skipLearningButton').click();

      cy.wait('@cancelLearnMode');

      if (feature.to) {
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
    cy.get('.tag-primary').should('be.length', 0);
  });

  it('Cancel go back', () => {
    cy.contains('button', 'global.backButton').click();
    cy.location('pathname').should('eq', '/dashboard/integration/device/broadlink');
  });
});
