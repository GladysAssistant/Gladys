describe('Scene user location action', () => {
  let selector;

  beforeEach(() => {
    cy.login();
    cy.request({
      method: 'POST',
      url: `${Cypress.env('serverUrl')}/api/v1/scene`,
      body: { name: 'Location action test', icon: 'map-pin', active: true, triggers: [], actions: [] }
    }).then(res => {
      selector = res.body.selector;
      cy.visit(`/dashboard/scene/${selector}`);
    });
  });

  afterEach(() => {
    if (selector) cy.request({ method: 'DELETE', url: `${Cypress.env('serverUrl')}/api/v1/scene/${selector}` });
    selector = null;
  });

  it('creates, saves, reloads and executes a user-location action through the real scene editor', () => {
    cy.viewport(1280, 900);
    cy.contains('editScene.addStepButton').click();
    cy.get('[data-cy="type-picker-option"][data-value="user.set-location"]').click();
    cy.get('.react-select__control').click();
    cy.get('.react-select__menu')
      .contains('.react-select__option', 'Tony')
      .click({ scrollBehavior: false });
    cy.get('[data-cy="location-latitude"] .tagify__input').type('-33.86');
    cy.get('[data-cy="location-longitude"] .tagify__input').type('0');
    cy.intercept('PATCH', '**/api/v1/scene/*').as('saveScene');
    cy.contains('button', 'editScene.saveButton').click();
    cy.wait('@saveScene')
      .its('response.statusCode')
      .should('eq', 200);
    cy.reload();
    cy.contains('[data-step-label]', 'editScene.actions.user.set-location').click();
    cy.get('[data-cy="location-latitude"] .tagify__input').should('contain', '-33.86');
    cy.get('[data-cy="location-longitude"] .tagify__input').should('contain', '0');
    if (Cypress.env('presenceScreenshots')) {
      cy.contains('.card', 'editScene.actions.user.set-location').screenshot('location-action-desktop');
      cy.viewport(375, 812);
      cy.get('[data-cy="location-longitude"]').should('be.visible');
      cy.contains('.card', 'editScene.actions.user.set-location').screenshot('location-action-mobile');
      cy.viewport(1280, 900);
    }
    cy.contains('button', 'editScene.startButton').click();
    cy.visit('/dashboard');
    cy.request({ method: 'GET', url: `${Cypress.env('serverUrl')}/api/v1/user/tony` })
      .its('body')
      .should('include', { last_latitude: -33.86, last_longitude: 0 });
  });

  it('preserves the selected coordinate variables when their producing steps are reordered', () => {
    cy.request({
      method: 'PATCH',
      url: `${Cypress.env('serverUrl')}/api/v1/scene/${selector}`,
      body: {
        actions: [
          [{ type: 'variable.set', name: 'Latitude', text: '48.1' }],
          [{ type: 'variable.set', name: 'Longitude', text: '11.2' }],
          [{ type: 'user.set-location', user: 'tony', latitude: '', longitude: '' }]
        ]
      }
    });
    cy.reload();
    cy.contains('[data-step-label]', 'editScene.actions.user.set-location').click();
    ['latitude', 'longitude'].forEach(field => {
      cy.get(`[data-cy="location-${field}"] .tagify__input`).type(field === 'latitude' ? '{{Lat' : '{{Lon', {
        parseSpecialCharSequences: false
      });
      cy.contains('.tagify__dropdown__item', field === 'latitude' ? 'Latitude' : 'Longitude').click({
        scrollBehavior: false
      });
    });
    cy.get('[data-cy="drag-step-0.0"]').trigger('keydown', { key: 'ArrowDown' });
    cy.intercept('PATCH', '**/api/v1/scene/*').as('saveReorderedScene');
    cy.contains('button', 'editScene.saveButton').click();
    cy.wait('@saveReorderedScene').then(({ request, response }) => {
      expect(response.statusCode).to.equal(200);
      expect(request.body.actions[2][0]).to.include({ latitude: '{{1.0.value}}', longitude: '{{0.0.value}}' });
    });
    cy.reload();
    cy.contains('[data-step-label]', 'editScene.actions.user.set-location').click();
    cy.get('[data-cy="location-latitude"] .tagify__tag').should('contain', 'Latitude');
    cy.get('[data-cy="location-longitude"] .tagify__tag').should('contain', 'Longitude');
    cy.contains('button', 'editScene.startButton').click();
    cy.visit('/dashboard');
    cy.request({ method: 'GET', url: `${Cypress.env('serverUrl')}/api/v1/user/tony` })
      .its('body')
      .should('include', { last_latitude: 48.1, last_longitude: 11.2 });
  });
});
