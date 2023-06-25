describe('Scene view', () => {
  before(() => {
    cy.login();
    const serverUrl = Cypress.env('serverUrl');
    cy.request({
      method: 'GET',
      url: `${serverUrl}/api/v1/room`
    }).then(res => {
      const device = {
        name: 'One device',
        external_id: 'one-device',
        selector: 'one-device',
        room_id: res.body[0].id,
        features: [
          {
            name: 'Multilevel',
            category: 'light',
            type: 'temperature',
            external_id: 'light-temperature',
            selector: 'light-temperature',
            read_only: false,
            keep_history: true,
            has_feedback: true,
            min: 0,
            max: 1
          }
        ]
      };
      cy.createDevice(device, 'mqtt');
    });
  });
  beforeEach(() => {
    cy.login();
  });
  after(() => {
    // Delete all Bluetooth devices
    cy.deleteDevices('mqtt');
  });
  it('Should create new scene', () => {
    cy.visit('/dashboard/scene');
    cy.contains('scene.newButton')
      .should('have.class', 'btn-outline-primary')
      .click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene/new`);

    cy.get('input:visible').then(inputs => {
      // Zone name
      cy.wrap(inputs[0]).type('My scene');
    });

    cy.get('.fe-activity').click();

    cy.contains('newScene.createSceneButton')
      .should('have.class', 'btn-primary')
      .click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene/my-scene`);
  });
  it('Should edit the scene description', () => {
    cy.visit('/dashboard/scene/my-scene');

    cy.contains('editScene.editDescriptionPlaceholder').click();

    cy.get('input:visible').then(inputs => {
      // Zone name
      cy.wrap(inputs[0]).type('My scene description');
    });

    // I don't know why, but I'm unable to get this button with
    // the text. Using the class but it's not recommended otherwise!!
    cy.get('.btn-success').then(buttons => {
      cy.wrap(buttons[0]).click();
    });
  });
  it('Should add new condition house empty', () => {
    cy.visit('/dashboard/scene/my-scene');
    cy.contains('editScene.addActionButton')
      .should('have.class', 'btn-outline-primary')
      .click();

    const i18n = Cypress.env('i18n');

    cy.get('div[class*="-control"]')
      .click(0, 0, { force: true })
      .get('[class*="-menu"]')
      .find('[class*="-option"]')
      .filter(`:contains("${i18n.editScene.actions.house['is-empty']}")`)
      .click(0, 0, { force: true });

    // I don't know why, but I'm unable to get this button with
    // the text. Using the class but it's not recommended otherwise!!
    cy.get('.btn-success').then(buttons => {
      cy.wrap(buttons[1]).click();
    });

    cy.get('div[class*="-control"]')
      .click(0, 0, { force: true })
      .get('[class*="-menu"]')
      .find('[class*="-option"]')
      .filter(`:contains("My House")`)
      .click(0, 0, { force: true });
  });
  it('Should add new condition device set value', () => {
    cy.visit('/dashboard/scene/my-scene');
    cy.contains('editScene.addActionButton')
      .should('have.class', 'btn-outline-primary')
      .click();

    const i18n = Cypress.env('i18n');

    cy.get('div[class*="-control"]')
      .click(0, 0, { force: true })
      .get('[class*="-menu"]')
      .find('[class*="-option"]')
      .filter(`:contains("${i18n.editScene.actions.device['set-value']}")`)
      .click(0, 0, { force: true });

    // I don't know why, but I'm unable to get this button with
    // the text. Using the class but it's not recommended otherwise!!
    cy.get('.btn-success').then(buttons => {
      cy.wrap(buttons[1]).click();
    });

    cy.get('div[class*="-control"]')
      .click(0, 0, { force: true })
      .get('[class*="-menu"]')
      .find('[class*="-option"]')
      .filter(`:contains("Multilevel")`)
      .click(0, 0, { force: true });
  });
  it('Should add new calendar event trigger', () => {
    cy.visit('/dashboard/scene/my-scene');
    cy.contains('editScene.addNewTriggerButton')
      .should('have.class', 'btn-outline-primary')
      .click();

    const i18n = Cypress.env('i18n');

    cy.get('div[class*="-control"]')
      .click(0, 0, { force: true })
      .get('[class*="-menu"]')
      .find('[class*="-option"]')
      .filter(`:contains("${i18n.editScene.triggers.calendar['event-is-coming']}")`)
      .click(0, 0, { force: true });

    // I don't know why, but I'm unable to get this button with
    // the text. Using the class but it's not recommended otherwise!!
    cy.get('.btn-success').then(buttons => {
      cy.wrap(buttons[1]).click();
    });

    cy.get('select').then(selects => {
      cy.wrap(selects[0]).select('contains');
      cy.wrap(selects[1]).select('start');
      cy.wrap(selects[2]).select('minute');
    });
  });
  it('Should disable scene', () => {
    cy.visit('/dashboard/scene');

    // Normally we shouldn't use CSS classes to identify element,
    // but here we don't have much choice as there is no label
    // on this element, and the checkbox is covered by this element
    cy.get('.custom-switch-indicator').click();

    cy.visit('/dashboard/scene/my-scene');

    cy.get('[type="checkbox"]').should('not.be.checked');

    cy.visit('/dashboard/scene');

    cy.get('[type="checkbox"]').should('not.be.checked');

    cy.get('.custom-switch-indicator').click();

    cy.visit('/dashboard/scene');

    cy.get('[type="checkbox"]').should('be.checked');
  });
  it('Should duplicate existing scene', () => {
    cy.login();
    cy.visit('/dashboard/scene/my-scene');

    cy.contains('editScene.moreButton').click();

    cy.contains('editScene.duplicateButton').click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene/my-scene/duplicate`);

    cy.get('input:visible').then(inputs => {
      // Zone name
      cy.wrap(inputs[0]).type('My Duplicated scene');
    });

    cy.get('.fe-activity').click();

    cy.get('.form-footer')
      .contains('duplicateScene.duplicateSceneButton')
      .should('have.class', 'btn-primary')
      .click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene/my-duplicated-scene`);
  });
  it('Should delete existing scene', () => {
    cy.login();
    cy.visit('/dashboard/scene/my-scene');

    cy.contains('editScene.moreButton').click();
    cy.contains('editScene.deleteButton').click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene`);

    cy.visit('/dashboard/scene/my-duplicated-scene');

    cy.contains('editScene.moreButton').click();

    cy.contains('editScene.deleteButton').click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene`);
  });
});
