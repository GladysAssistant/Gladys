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

  it('Should add a step inside the Then branch of an if block', () => {
    const sceneUrl = Cypress.env('mobileSceneUrl');
    expect(sceneUrl).to.exist;
    cy.visit(sceneUrl);

    cy.get('[data-cy=scene-add-step]').click();
    cy.get(
      '[data-cy="scene-step-sheet-1.0"] [data-cy="type-picker-option"][data-value="condition.if-then-else"]'
    ).click();
    cy.get('body').type('{esc}');

    cy.get('[data-cy="scene-add-to-1.0.then"]').click();
    cy.get('[data-cy="scene-step-sheet-1.0.then.0.0"] [data-cy="type-picker-option"][data-value="delay"]').click();
    cy.get('body').type('{esc}');
    cy.get('[data-cy="scene-step-row-1.0.then.0.0"]').should('be.visible');

    cy.get('[data-cy=scene-back-button]').click();
    cy.get('[data-cy=scene-leave-discard]').click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene`);
  });

  it('Should leave a scene opened by mistake without asking', () => {
    const serverUrl = Cypress.env('serverUrl');
    // a scene the forms normalize when they mount: a delay without unit, an if block without
    // then / else
    cy.window().then(win => {
      const { access_token: accessToken } = JSON.parse(win.localStorage.getItem('user'));
      cy.request({
        method: 'POST',
        url: `${serverUrl}/api/v1/scene`,
        headers: { authorization: `Bearer ${accessToken}` },
        body: {
          name: 'My normalized scene',
          icon: 'zap',
          actions: [[{ type: 'delay', value: 3 }], [{ type: 'condition.if-then-else', if: [] }]],
          tags: []
        }
      }).then(resp => {
        Cypress.env('normalizedSceneSelector', resp.body.selector);
        cy.visit(`/dashboard/scene/${resp.body.selector}`);
      });
    });

    cy.get('[data-cy="scene-step-row-0.0"]').should('be.visible');
    cy.get('[data-cy=scene-back-button]').click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene`);
    cy.get('[data-cy=scene-leave-confirm]').should('not.exist');

    // once the forms have settled, the normalizations are part of the saved version
    cy.then(() => cy.visit(`/dashboard/scene/${Cypress.env('normalizedSceneSelector')}`));
    cy.get('[data-cy="scene-step-row-0.0"]').should('be.visible');
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2500);
    cy.get('[data-cy=scene-unsaved-label]').should('not.exist');
    cy.get('[data-cy=scene-back-button]').click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene`);
    cy.get('[data-cy=scene-leave-confirm]').should('not.exist');

    cy.window().then(win => {
      const { access_token: accessToken } = JSON.parse(win.localStorage.getItem('user'));
      cy.request({
        method: 'DELETE',
        url: `${serverUrl}/api/v1/scene/${Cypress.env('normalizedSceneSelector')}`,
        headers: { authorization: `Bearer ${accessToken}` }
      });
    });
  });

  it('Should offer back the unsaved changes after a reload', () => {
    const sceneUrl = Cypress.env('mobileSceneUrl');
    expect(sceneUrl).to.exist;
    cy.visit(sceneUrl);
    // the forms settle first; the edit is then reloaded right away, before the debounced write:
    // the draft comes from the beforeunload flush
    cy.get('[data-cy="scene-step-row-0.0"]').should('be.visible');
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    cy.get('[data-cy=scene-add-step]').click();
    cy.get('[data-cy="scene-step-sheet-1.0"] [data-cy="type-picker-option"][data-value="delay"]').click();
    cy.get('body').type('{esc}');
    cy.get('[data-cy=scene-unsaved-label]').should('be.visible');

    cy.reload();
    cy.get('[data-cy=scene-draft-banner]').should('be.visible');
    cy.get('[data-cy=scene-draft-restore]').click();
    cy.get('[data-cy="scene-step-row-1.0"]').should('be.visible');
    cy.get('[data-cy=scene-unsaved-label]').should('be.visible');

    cy.get('[data-cy=scene-back-button]').click();
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
