// On a wide screen the "x" of a card deletes at once: the deletion can be undone
// (docs/specs/scene-editor-mobile.md, C.7). Against the real server.
const SUFFIX = Date.now();
const SCENE = `undo-desktop-${SUFFIX}`;

const apiRequest = (method, path, body) =>
  cy.window().then(win => {
    const { access_token: accessToken } = JSON.parse(win.localStorage.getItem('user'));
    return cy
      .request({
        method,
        url: `${Cypress.env('serverUrl')}/api/v1${path}`,
        headers: { authorization: `Bearer ${accessToken}` },
        body
      })
      .its('body');
  });

// the name a card shows for its step: what tells which step sits at a position
const stepLabel = path =>
  cy
    .get(`[data-cy="delete-step-${path}"]`)
    .closest('.card-header')
    .find('[data-step-label]');

describe('Undoing a deletion in the scene editor, on a wide screen', () => {
  beforeEach(() => {
    cy.viewport(1280, 1000);
    cy.login();
  });

  it('Should create the scene', () => {
    cy.visit('/dashboard/scene');
    apiRequest('POST', '/scene', {
      name: SCENE,
      selector: SCENE,
      icon: 'activity',
      triggers: [{ type: 'system.start' }],
      actions: [
        [{ type: 'delay', unit: 'seconds', value: 5 }],
        [
          {
            type: 'condition.if-then-else',
            if: [{ type: 'house.is-empty', house: 'my-house' }],
            then: [[{ type: 'delay', unit: 'minutes', value: 2 }]],
            else: []
          }
        ]
      ]
    });
  });

  it('Should bring a deleted step back', () => {
    cy.visit(`/dashboard/scene/${SCENE}`);
    cy.get('[data-cy="delete-step-0.0"]').should('be.visible');
    cy.get('[data-cy="delete-step-1.0"]').should('be.visible');

    stepLabel('0.0').i18n('editScene.actions.delay');
    stepLabel('1.0').i18n('editScene.actions.condition.if-then-else');

    cy.get('[data-cy="delete-step-0.0"]').click();
    // the block took the place of the step
    cy.get('[data-cy="delete-step-1.0"]').should('not.exist');
    stepLabel('0.0').i18n('editScene.actions.condition.if-then-else');
    cy.get('[data-cy=scene-toast]')
      .should('be.visible')
      .i18n('editScene.mobile.stepDeleted');
    // the "x" that had the focus is gone with its card: the keyboard is on "Undo"
    cy.focused().should('have.attr', 'data-cy', 'mobile-toast-action');
    cy.get('[data-cy=scene-toast] [data-cy=mobile-toast-action]').click();
    cy.get('[data-cy=scene-toast]').should('not.exist');
    // the step is back where it was, and the block after it with its branch
    stepLabel('0.0').i18n('editScene.actions.delay');
    stepLabel('1.0').i18n('editScene.actions.condition.if-then-else');
    cy.get('[data-cy="delete-step-1.0.then.0.0"]').should('exist');
  });

  it('Should withdraw the Undo at the first edit made after the deletion, and keep that edit', () => {
    cy.visit(`/dashboard/scene/${SCENE}`);
    cy.get('[data-cy=delete-trigger-0]').click();
    cy.get('[data-cy=scene-toast]').should('be.visible');
    // opening a card is not an edit: the Undo stays
    stepLabel('0.0').click();
    cy.get('[data-cy=scene-toast]').should('be.visible');
    // adding a step is one: undoing now would take it back with the deletion
    cy.get(`button:contains("${Cypress.env('i18n').editScene.addStepButton}")`)
      .last()
      .click();
    cy.get('[data-cy=scene-toast]').should('not.exist');
    cy.get('[data-cy="delete-step-2.0"]').should('exist');
    cy.get('[data-cy=delete-trigger-0]').should('not.exist');
  });

  it('Should not say "Scene saved" twice: the footer already does', () => {
    cy.intercept({ method: 'PATCH', url: `${Cypress.env('serverUrl')}/api/v1/scene/${SCENE}` }).as('saveScene');
    cy.visit(`/dashboard/scene/${SCENE}`);
    cy.get('[data-cy="delete-step-0.0"]').should('be.visible');
    cy.get(`button:contains("${Cypress.env('i18n').editScene.saveButton}")`).click();
    cy.wait('@saveScene');
    cy.contains(Cypress.env('i18n').editScene.savedLabel).should('be.visible');
    cy.get('[data-cy=scene-toast]').should('not.exist');
  });

  it('Should bring a deleted If / Then / Else block back with its branches', () => {
    cy.visit(`/dashboard/scene/${SCENE}`);
    cy.get('[data-cy="delete-step-1.0.then.0.0"]').should('exist');

    cy.get('[data-cy="delete-step-1.0"]').click();
    cy.get('[data-cy="delete-step-1.0"]').should('not.exist');
    cy.get('[data-cy=scene-toast] [data-cy=mobile-toast-action]').click();
    cy.get('[data-cy="delete-step-1.0"]').should('be.visible');
    cy.get('[data-cy="delete-step-1.0.if.0"]').should('exist');
    cy.get('[data-cy="delete-step-1.0.then.0.0"]').should('exist');
  });

  it('Should bring a deleted trigger back', () => {
    cy.visit(`/dashboard/scene/${SCENE}`);
    cy.get('[data-cy=delete-trigger-0]').click();
    cy.get('[data-cy=delete-trigger-0]').should('not.exist');
    cy.get('[data-cy=scene-toast]').i18n('editScene.mobile.triggerDeleted');
    cy.get('[data-cy=scene-toast] [data-cy=mobile-toast-action]').click();
    cy.get('[data-cy=delete-trigger-0]').should('be.visible');
  });

  it('Should remove a step that has no type yet without a toast', () => {
    cy.visit(`/dashboard/scene/${SCENE}`);
    // the "Add a step" of the scene itself is the last one: the branches of the block have theirs
    cy.get(`button:contains("${Cypress.env('i18n').editScene.addStepButton}")`)
      .last()
      .click();
    cy.get('[data-cy="delete-step-2.0"]').click();
    cy.get('[data-cy="delete-step-2.0"]').should('not.exist');
    cy.get('[data-cy=scene-toast]').should('not.exist');
  });

  it('Should delete the scene', () => {
    cy.visit('/dashboard/scene');
    apiRequest('DELETE', `/scene/${SCENE}`);
  });
});
