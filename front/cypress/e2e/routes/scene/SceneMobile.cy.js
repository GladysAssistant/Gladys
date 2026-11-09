// The scene pages on a phone (docs/specs/scene-editor-mobile.md): the list, the creation sheet and
// the mobile editor, against the real server. Every interaction goes through data-cy selectors:
// the texts are the i18n keys in the Cypress build.
describe('Scene on a phone', () => {
  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.login();
  });

  it('Should create a scene from its name, then add a trigger and a step', () => {
    cy.visit('/dashboard/scene');
    cy.get('[data-cy=scene-new-button]').click();
    cy.get('[data-cy=scene-new-name]').type('My mobile scene');
    cy.get('[data-cy=scene-new-create]').click();

    cy.url().should('include', `${Cypress.config().baseUrl}/dashboard/scene/my-mobile-scene`);
    cy.url().then(url => {
      Cypress.env('mobileSceneUrl', url.replace(Cypress.config().baseUrl, '').split('?')[0]);
    });

    // a new scene opens on the trigger picker
    cy.get('[data-cy="scene-trigger-sheet-0"]').should('be.visible');
    cy.get('[data-cy="scene-trigger-sheet-0"] [data-cy="type-picker-option"][data-value="house.empty"]').click();
    cy.get('body').type('{esc}');
    cy.get('[data-cy="scene-trigger-row-0"]').should('be.visible');

    // a step, through the type picker sheet
    cy.get('[data-cy=scene-add-step]').click();
    cy.get('[data-cy="scene-step-sheet-0.0"] [data-cy="type-picker-option"][data-value="delay"]').click();
    cy.get('[data-cy="scene-step-sheet-0.0"] input[type="text"]')
      .first()
      .type('5');
    cy.get('body').type('{esc}');
    cy.get('[data-cy="scene-step-row-0.0"]').should('be.visible');

    // the bottom bar follows the save state
    cy.get('[data-cy=scene-unsaved-label]').should('be.visible');
    cy.get('[data-cy=scene-save-button]').click();
    cy.get('[data-cy=scene-run-button]').should('be.visible');
    cy.get('[data-cy=scene-unsaved-label]').should('not.exist');
  });

  it('Should delete a step and undo the deletion', () => {
    const sceneUrl = Cypress.env('mobileSceneUrl');
    expect(sceneUrl).to.exist;
    cy.visit(sceneUrl);

    cy.get('[data-cy="scene-step-row-0.0"]').click();
    cy.get('[data-cy="scene-step-sheet-delete-0.0"]').click();
    cy.get('[data-cy="scene-step-row-0.0"]').should('not.exist');
    cy.get('[data-cy=scene-unsaved-label]').should('be.visible');

    cy.get('[data-cy=scene-toast-undo]').click();
    cy.get('[data-cy="scene-step-row-0.0"]').should('be.visible');
    cy.get('[data-cy=scene-unsaved-label]').should('not.exist');
  });

  it('Should ask before leaving with unsaved changes', () => {
    const sceneUrl = Cypress.env('mobileSceneUrl');
    expect(sceneUrl).to.exist;
    cy.visit(sceneUrl);

    cy.get('[data-cy=scene-add-step]').click();
    cy.get('[data-cy="scene-step-sheet-1.0"] [data-cy="type-picker-option"][data-value="delay"]').click();
    cy.get('body').type('{esc}');
    cy.get('[data-cy=scene-unsaved-label]').should('be.visible');

    cy.get('[data-cy=scene-back-button]').click();
    cy.get('[data-cy=scene-leave-confirm]').should('be.visible');
    cy.get('[data-cy=scene-leave-discard]').click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene`);
  });

  it('Should disable the scene from its status line', () => {
    const sceneUrl = Cypress.env('mobileSceneUrl');
    expect(sceneUrl).to.exist;
    cy.visit(sceneUrl);

    cy.get('[data-cy=scene-active-switch]').should('have.attr', 'aria-checked', 'true');
    cy.get('[data-cy=scene-active-switch]').click();
    cy.get('[data-cy=scene-active-switch]').should('have.attr', 'aria-checked', 'false');
    // patched on its own: not an unsaved change, and still disabled after a reload
    cy.get('[data-cy=scene-unsaved-label]').should('not.exist');
    cy.reload();
    cy.get('[data-cy=scene-active-switch]').should('have.attr', 'aria-checked', 'false');
  });

  it('Should delete the scene from the menu', () => {
    const sceneUrl = Cypress.env('mobileSceneUrl');
    expect(sceneUrl).to.exist;
    cy.visit(sceneUrl);

    cy.get('[data-cy=scene-more-button]').click();
    cy.get('[data-cy=scene-menu-delete]').click();
    cy.get('[data-cy=scene-delete-confirm]').click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene`);
  });
});
