// Scene triggers and actions declared by an external integration: the
// declarations are stubbed (they would need an installed Docker container),
// everything else is the real app — the scene is created, edited and saved
// through the actual server.
const SELECTOR = 'ext-frigate';
const TRIGGER_VALUE = `external-integration.scene-event|${SELECTOR}|object_detected`;
const ACTION_VALUE = `external-integration.scene-action|${SELECTOR}|create_snapshot`;
const CAMERA_EXTERNAL_ID = `ext:${SELECTOR}:front`;

const SCENE_INTEGRATIONS = {
  integrations: [
    {
      selector: SELECTOR,
      name: 'Frigate',
      status: 'RUNNING',
      scene_triggers: [
        {
          key: 'object_detected',
          label: { en: 'Object detected', fr: 'Objet détecté' },
          description: { en: 'Frigate detected an object on a camera.' },
          fields: [
            { key: 'camera', type: 'select', source: 'devices', label: { en: 'Camera' }, required: true },
            { key: 'zone', type: 'string', label: { en: 'Zone' } }
          ],
          variables: [{ key: 'label', type: 'string', label: { en: 'Object type' } }]
        }
      ],
      scene_actions: [
        {
          key: 'create_snapshot',
          label: { en: 'Take a snapshot' },
          fields: [
            { key: 'camera', type: 'select', source: 'devices', label: { en: 'Camera' }, required: true },
            { key: 'caption', type: 'string', label: { en: 'Caption' } }
          ],
          outputs: [{ key: 'clip_id', type: 'string', label: { en: 'Clip identifier' } }]
        }
      ]
    }
  ]
};

const DEVICES = [{ name: 'Front camera', selector: `${SELECTOR}-front`, external_id: CAMERA_EXTERNAL_ID }];

// the scene as persisted by the server, read back with the session token (the
// selector is the last segment of the editor URL: the creation page suffixes it)
const getSavedScene = () =>
  cy.window().then(win => {
    const { access_token: accessToken } = JSON.parse(win.localStorage.getItem('user'));
    const selector = Cypress.env('integrationSceneUrl')
      .split('/')
      .pop();
    return cy
      .request({
        method: 'GET',
        url: `${Cypress.env('serverUrl')}/api/v1/scene/${selector}`,
        headers: { authorization: `Bearer ${accessToken}` }
      })
      .its('body');
  });

describe('Scene - external integration triggers and actions', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Should create the scene', () => {
    cy.visit('/dashboard/scene');
    cy.contains('scene.newButton')
      .should('have.class', 'btn-outline-primary')
      .click();

    cy.get('input')
      .first()
      .as('sceneInput');
    cy.get('@sceneInput').clear();
    cy.get('@sceneInput').type('Integration scene');

    cy.get('.fe-activity').click();

    cy.contains('newScene.createSceneButton')
      .should('have.class', 'btn-primary')
      .click();

    cy.url().should('include', `${Cypress.config().baseUrl}/dashboard/scene/integration-scene`);

    cy.url().then(url => {
      Cypress.env('integrationSceneUrl', url.replace(Cypress.config().baseUrl, ''));
    });
  });

  it('Should add a declared trigger and a declared action, then save the declared shapes', () => {
    cy.intercept('GET', '**/api/v1/external_integration/scene', SCENE_INTEGRATIONS).as('getSceneIntegrations');
    cy.intercept('GET', `**/api/v1/service/${SELECTOR}/device`, DEVICES).as('getDevices');

    const sceneUrl = Cypress.env('integrationSceneUrl');
    expect(sceneUrl).to.exist;
    cy.visit(sceneUrl);
    cy.wait('@getSceneIntegrations');

    // the "Integrations" category of the trigger picker
    cy.contains('editScene.addNewTriggerButton')
      .should('have.class', 'btn-outline-primary')
      .click();
    cy.contains('editScene.triggerCategories.integrations').should('exist');
    cy.get(`[data-cy="type-picker-option"][data-value="${TRIGGER_VALUE}"]`)
      .should('contain', 'Object detected')
      .should('contain', 'Frigate')
      .click();
    cy.wait('@getDevices');

    // the required device filter blocks the save while empty (a wildcard on
    // a required filter would fire on every camera), then the information the
    // trigger passes on, named by label (never by path)
    cy.contains('button', 'editScene.saveButton').click();
    const requiredFieldError = Cypress.env('i18n')
      .editScene.externalIntegration.requiredFieldError.replace('{{field}}', 'Camera')
      .replace('{{title}}', 'Frigate · Object detected');
    cy.get('.alert-danger').should('contain', requiredFieldError);
    cy.get('select#config_camera').select(CAMERA_EXTERNAL_ID);
    cy.contains('editScene.externalIntegration.variablesAvailable').should('exist');
    cy.contains('.badge', 'Object type').should('exist');
    cy.contains('{{triggerEvent.data.label}}').should('not.exist');

    // the "Integrations" category of the action picker
    cy.contains('editScene.addStepButton')
      .should('have.class', 'btn-outline-primary')
      .click();
    cy.contains('editScene.actionCategories.integrations').should('exist');
    cy.get(`[data-cy="type-picker-option"][data-value="${ACTION_VALUE}"]`)
      .should('contain', 'Take a snapshot')
      .click();
    cy.wait('@getDevices');

    // the device parameter, the variables-aware string parameter and the
    // results of the action, named by label
    cy.get('select#config_camera')
      .last()
      .select(CAMERA_EXTERNAL_ID);
    cy.get('.tagify__input').type('Visitor detected');
    cy.contains('editScene.externalIntegration.outputsAvailable').should('exist');
    cy.contains('.badge', 'Clip identifier').should('exist');

    cy.contains('button', 'editScene.saveButton').click();
    cy.contains('editScene.savedLabel').should('exist');

    // the persisted JSON carries the generic types with the declared shapes
    getSavedScene().then(scene => {
      const trigger = scene.triggers.find(candidate => candidate.type === 'external-integration.scene-event');
      expect(trigger).to.include({ integration: SELECTOR, trigger_key: 'object_detected' });
      expect(trigger.fields).to.include({ camera: CAMERA_EXTERNAL_ID });
      const action = scene.actions.flat().find(candidate => candidate.type === 'external-integration.scene-action');
      expect(action).to.include({ integration: SELECTOR, action_key: 'create_snapshot' });
      expect(action.fields).to.include({ camera: CAMERA_EXTERNAL_ID, caption: 'Visitor detected' });
    });
  });

  it('Should refuse the save while the declarations cannot be loaded', () => {
    cy.intercept('GET', '**/api/v1/external_integration/scene', { statusCode: 500, body: {} }).as(
      'getSceneIntegrations'
    );

    const sceneUrl = Cypress.env('integrationSceneUrl');
    expect(sceneUrl).to.exist;
    cy.visit(sceneUrl);
    cy.wait('@getSceneIntegrations');

    // the cards wait for the catalog instead of posing as orphans
    cy.contains('editScene.triggers.external-integration.scene-event').click();
    cy.contains('editScene.externalIntegration.catalogLoading').should('exist');
    cy.contains('editScene.externalIntegration.triggerNotInstalled').should('not.exist');

    // the save retries the catalog once, then refuses: an unchecked required
    // filter must never be persisted
    cy.contains('button', 'editScene.saveButton').click();
    cy.wait('@getSceneIntegrations');
    cy.get('.alert-danger').should(
      'contain',
      Cypress.env('i18n').editScene.externalIntegration.catalogUnavailableError
    );
  });

  it('Should save on the retried catalog when the first request failed', () => {
    let requests = 0;
    cy.intercept('GET', '**/api/v1/external_integration/scene', req => {
      requests += 1;
      // the editor opens on a failed request, the save retries and gets the list
      req.reply(requests === 1 ? { statusCode: 500, body: {} } : SCENE_INTEGRATIONS);
    }).as('getSceneIntegrations');
    cy.intercept('GET', `**/api/v1/service/${SELECTOR}/device`, DEVICES).as('getDevices');

    const sceneUrl = Cypress.env('integrationSceneUrl');
    expect(sceneUrl).to.exist;
    cy.visit(sceneUrl);
    cy.wait('@getSceneIntegrations');
    cy.contains('editScene.externalIntegration.catalogLoading').should('exist');

    // the retried list is what the save validates against (not a stale
    // state): the filled required filter passes, the cards come alive
    cy.contains('button', 'editScene.saveButton').click();
    cy.wait('@getSceneIntegrations');
    cy.get('.alert-danger').should('not.exist');
    cy.contains('Frigate · Object detected').should('exist');
  });

  it('Should keep the cards, flagged as orphans, when the integration is gone', () => {
    cy.intercept('GET', '**/api/v1/external_integration/scene', { integrations: [] }).as('getSceneIntegrations');

    const sceneUrl = Cypress.env('integrationSceneUrl');
    expect(sceneUrl).to.exist;
    cy.visit(sceneUrl);
    cy.wait('@getSceneIntegrations');

    // the collapsed cards carry the generic labels: expand them to read the warnings
    cy.contains('editScene.triggers.external-integration.scene-event').click();
    cy.contains('editScene.externalIntegration.triggerNotInstalled').should('exist');
    cy.contains('editScene.actions.external-integration.scene-action').click();
    cy.contains('editScene.externalIntegration.actionNotInstalled').should('exist');

    // the scene still saves as-is: the orphan cards are kept untouched
    cy.contains('button', 'editScene.saveButton').click();
    cy.contains('editScene.savedLabel').should('exist');
    getSavedScene().then(scene => {
      expect(scene.triggers.some(candidate => candidate.type === 'external-integration.scene-event')).to.equal(true);
      expect(scene.actions.flat().some(candidate => candidate.type === 'external-integration.scene-action')).to.equal(
        true
      );
    });
  });

  it('Should delete the scene', () => {
    const sceneUrl = Cypress.env('integrationSceneUrl');
    expect(sceneUrl).to.exist;
    cy.visit(sceneUrl);

    cy.contains('editScene.deleteButton').click();
    // Confirmation button
    cy.contains('editScene.deleteButton').click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene`);
  });
});
