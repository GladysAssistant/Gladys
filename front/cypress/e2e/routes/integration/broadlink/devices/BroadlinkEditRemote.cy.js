const { PARAMS } = require('../../../../../../../server/services/broadlink/lib/utils/broadlink.constants');

describe('Broadlink edit remote', () => {
  before(() => {
    cy.login();

    // Create a remote device
    const remote = {
      name: 'Light Remote',
      model: 'light',
      selector: 'broadlink-any-remote',
      external_id: 'broadlink:any-remote',
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
          name: PARAMS.REMOTE_TYPE,
          value: 'light'
        },
        {
          name: 'ir_code_binary-0',
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

    cy.visit('/dashboard/integration/device/broadlink/edit/broadlink-any-remote');
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

  it('Quit learn all mode', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/broadlink/learn/cancel`
      },
      { learn: true }
    ).as('cancelLearnMode');

    cy.contains('button', 'integration.broadlink.setup.learnAllLabel').should('not.exist');

    cy.contains('button', 'integration.broadlink.setup.quitLearnModeLabel')
      .should('exist')
      .should('not.be.disabled')
      .click();

    cy.wait('@cancelLearnMode');

    cy.contains('button', 'integration.broadlink.setup.learnAllLabel')
      .should('exist')
      .should('not.be.disabled');

    cy.contains('button', 'integration.broadlink.setup.quitLearnModeLabel').should('not.exist');
  });

  it('Select feature', () => {
    cy.get('.tag-dark').should('not.exist');
    cy.get('.input-icon').should('not.exist');

    cy.get('.tag')
      .first()
      .click();

    cy.get('.tag-dark').should('have.length', 1);
    cy.get('.input-icon > input')
      .should('have.length', 1)
      .should('have.value', 'Power');

    cy.contains('button', 'integration.broadlink.setup.learnAllLabel').should('not.exist');
    cy.contains('button', 'integration.broadlink.setup.quitLearnModeLabel').should('not.exist');
    cy.contains('div', 'integration.broadlink.setup.learningModeInProgress').should('not.exist');

    cy.contains('button', 'integration.broadlink.setup.testLabel')
      .should('exist')
      .should('be.disabled');
    cy.contains('button', 'integration.broadlink.setup.deleteLabel')
      .should('exist')
      .should('be.disabled');
    cy.contains('button', 'integration.broadlink.setup.learnModeTitle')
      .should('exist')
      .should('be.disabled');
    cy.contains('button', 'integration.broadlink.setup.features.light.binary.none')
      .should('exist')
      .should('not.be.disabled');
    cy.contains('button', 'integration.broadlink.setup.features.light.binary.one')
      .should('exist')
      .should('not.be.disabled');
  });

  it('Select sub-feature', () => {
    cy.contains('button', 'integration.broadlink.setup.features.light.binary.none').click();

    cy.contains('button', 'integration.broadlink.setup.testLabel')
      .should('exist')
      .should('not.be.disabled');
    cy.contains('button', 'integration.broadlink.setup.deleteLabel')
      .should('exist')
      .should('not.be.disabled');
    cy.contains('button', 'integration.broadlink.setup.learnModeTitle')
      .should('exist')
      .should('not.be.disabled');
    cy.contains('button', 'integration.broadlink.setup.features.light.binary.none')
      .should('exist')
      .should('not.be.disabled');
    cy.contains('button', 'integration.broadlink.setup.features.light.binary.one')
      .should('exist')
      .should('not.be.disabled');
  });

  it('Enable capture mode', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/broadlink/learn`
      },
      { learn: true }
    ).as('learnMode');

    cy.contains('button', 'integration.broadlink.setup.learnModeTitle').click();

    cy.wait('@learnMode');

    cy.contains('button', 'integration.broadlink.setup.testLabel').should('be.disabled');
    cy.contains('button', 'integration.broadlink.setup.deleteLabel').should('be.disabled');
    cy.contains('button', 'integration.broadlink.setup.learnModeTitle').should('not.exist');
    cy.contains('button', 'integration.broadlink.setup.cancelLearnModeButton').should('exist');
    cy.contains('div', 'integration.broadlink.setup.learningModeInProgress').should('exist');
  });

  it('Cancel capture mode', () => {
    cy.contains('button', 'integration.broadlink.setup.cancelLearnModeButton').click();

    cy.contains('button', 'integration.broadlink.setup.testLabel').should('not.be.disabled');
    cy.contains('button', 'integration.broadlink.setup.deleteLabel').should('not.be.disabled');
    cy.contains('button', 'integration.broadlink.setup.learnModeTitle').should('exist');
    cy.contains('button', 'integration.broadlink.setup.cancelLearnModeButton').should('not.exist');
    cy.contains('div', 'integration.broadlink.setup.learningModeInProgress').should('not.exist');
    // cy.sendWebSocket({ type: 'broadlink.learn', payload: { action: 'success', code: 'payload' } });
  });

  it('Enable capture mode and recieve code', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/broadlink/learn`
      },
      { learn: true }
    ).as('learnMode');

    cy.contains('button', 'integration.broadlink.setup.learnModeTitle').click();

    cy.wait('@learnMode');

    cy.sendWebSocket({ type: 'broadlink.learn', payload: { action: 'success', code: 'payload' } });

    cy.contains('button', 'integration.broadlink.setup.testLabel').should('not.be.disabled');
    cy.contains('button', 'integration.broadlink.setup.deleteLabel').should('not.be.disabled');
    cy.contains('button', 'integration.broadlink.setup.learnModeTitle').should('exist');
    cy.contains('button', 'integration.broadlink.setup.cancelLearnModeButton').should('not.exist');
    cy.contains('div', 'integration.broadlink.setup.learningModeInProgress').should('not.exist');
  });
});
