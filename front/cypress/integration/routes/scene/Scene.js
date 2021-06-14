describe('Scene view', () => {
  beforeEach(() => {
    cy.login();
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
  it('Should add new condition house empty', () => {
    cy.visit('/dashboard/scene/my-scene');
    cy.contains('editScene.newAction')
      .should('have.class', 'btn-outline-primary')
      .click();

    const i18n = Cypress.env('i18n');

    cy.get('.choose-scene-action-type')
      .click()
      .type(`${i18n.editScene.actions.house['is-empty']}{enter}`);

    // I don't know why, but I'm unable to get this button with
    // the text. Using the class but it's not recommended otherwise!!
    cy.get('.btn-success').then(buttons => {
      cy.wrap(buttons[1]).click();
    });

    cy.get('.scene-house-empty-or-not-choose-house')
      .click()
      .type('My House{enter}');
  });
  it('Should delete existing scene', () => {
    cy.login();
    cy.visit('/dashboard/scene/my-scene');

    cy.contains('editScene.deleteButton')
      .should('have.class', 'btn-danger')
      .click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene`);
  });
});
