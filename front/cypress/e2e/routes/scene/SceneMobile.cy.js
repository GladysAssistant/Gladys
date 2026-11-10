// The scene pages on a phone (docs/specs/scene-editor-mobile.md): the list, the creation sheet and
// the mobile editor, against the real server. Every interaction goes through data-cy selectors:
// the texts are the i18n keys in the Cypress build.
// the local draft of a scene, whatever the user id in its key
const findDraftKey = (win, sceneUrl) => {
  const key = Object.keys(win.localStorage).find(
    storageKey => storageKey.startsWith('gladys-scene-draft:') && storageKey.endsWith(`:${sceneUrl.split('/').pop()}`)
  );
  expect(key).to.exist;
  return key;
};

const hasDraft = (win, sceneUrl) =>
  Object.keys(win.localStorage).some(
    storageKey => storageKey.startsWith('gladys-scene-draft:') && storageKey.endsWith(`:${sceneUrl.split('/').pop()}`)
  );

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

    // closing the picker without choosing, once the draft check has run, leaves nothing behind:
    // the empty trigger the editor added by itself is not an unsaved change
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get('body').type('{esc}');
    cy.get('[data-cy="scene-trigger-sheet-0"]').should('not.exist');
    cy.get('[data-cy=scene-run-button]').should('be.visible');
    cy.get('[data-cy=scene-unsaved-label]').should('not.exist');
    // (the draft written while the picker was open goes with the debounced write)
    cy.url().then(url => {
      cy.window().should(win => {
        expect(hasDraft(win, url.split('?')[0])).to.equal(false);
      });
    });

    cy.get('[data-cy=scene-add-trigger]').click();
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

    // a condition deleted from the block's sheet: the sheet stays open, Undo stays within reach
    cy.get('[data-cy="scene-step-row-1.0"]').click();
    cy.get('[data-cy="scene-add-condition-1.0"]').click();
    cy.get('[data-cy="scene-step-sheet-1.0.if.0"] [data-cy="type-picker-option"][data-value="house.is-empty"]').click();
    cy.get('[data-cy="scene-step-sheet-delete-1.0.if.0"]').click();
    cy.get('[data-cy="scene-step-sheet-1.0"]').should('be.visible');
    cy.get('[data-cy="scene-step-row-1.0.if.0"]').should('not.exist');
    cy.get('[data-cy=scene-toast-undo]').click();
    cy.get('[data-cy="scene-step-row-1.0.if.0"]').should('be.visible');
    cy.get('[data-cy="scene-step-sheet-1.0"]').should('be.visible');
    cy.get('body').type('{esc}');

    cy.get('[data-cy="scene-add-to-1.0.then"]').click();
    cy.get('[data-cy="scene-step-sheet-1.0.then.0.0"] [data-cy="type-picker-option"][data-value="delay"]').click();
    cy.get('body').type('{esc}');
    cy.get('[data-cy="scene-step-row-1.0.then.0.0"]').should('be.visible');

    cy.get('[data-cy=scene-back-button]').click();
    cy.get('[data-cy=scene-leave-discard]').click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene`);
  });

  it('Should show a save error that can be closed', () => {
    const sceneUrl = Cypress.env('mobileSceneUrl');
    expect(sceneUrl).to.exist;
    cy.visit(sceneUrl);

    cy.get('[data-cy=scene-add-step]').click();
    cy.get('[data-cy="scene-step-sheet-1.0"] [data-cy="type-picker-option"][data-value="delay"]').click();
    cy.get('body').type('{esc}');

    cy.intercept('PATCH', `${Cypress.env('serverUrl')}/api/v1/scene/*`, {
      statusCode: 422,
      body: { status: 422, code: 'UNPROCESSABLE_ENTITY', message: 'Validation error' }
    }).as('refusedSave');
    cy.get('[data-cy=scene-save-button]').click();
    cy.wait('@refusedSave');
    cy.get('[data-cy=scene-save-error]').should('be.visible');

    // closing the alert only hides it: the changes stay unsaved
    cy.get('[data-cy=scene-save-error-close]').click();
    cy.get('[data-cy=scene-save-error]').should('not.exist');
    cy.get('[data-cy=scene-unsaved-label]').should('be.visible');

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

  it('Should keep an edit made while a save is in flight', () => {
    const sceneUrl = Cypress.env('mobileSceneUrl');
    expect(sceneUrl).to.exist;
    cy.intercept('PATCH', '**/api/v1/scene/*', req => {
      req.on('response', res => {
        res.setDelay(1500);
      });
    }).as('saveScene');
    cy.visit(sceneUrl);
    cy.get('[data-cy="scene-step-row-0.0"]').should('be.visible');
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    // a first edit, saved slowly
    cy.get('[data-cy=scene-add-step]').click();
    cy.get('[data-cy="scene-step-sheet-1.0"] [data-cy="type-picker-option"][data-value="delay"]').click();
    cy.get('body').type('{esc}');
    cy.get('[data-cy=scene-save-button]').click();

    // a second edit while the request is in flight
    cy.get('[data-cy=scene-add-step]').click();
    cy.get('[data-cy="scene-step-sheet-2.0"] [data-cy="type-picker-option"][data-value="delay"]').click();
    cy.get('body').type('{esc}');
    cy.wait('@saveScene');
    // the response reaching the browser is not the editor having applied it: the "saved" toast is
    cy.get('[data-cy=scene-toast]').should('be.visible');
    cy.get('[data-cy=scene-unsaved-label]').should('be.visible');
    // written with the acknowledgement, before any reload: the second edit, against the saved base
    cy.window().then(win => {
      const draft = JSON.parse(win.localStorage.getItem(findDraftKey(win, sceneUrl)));
      expect(draft.scene.actions[2][0].type).to.eq('delay');
      expect(JSON.parse(draft.base).actions[1][0].type).to.eq('delay');
    });

    // the second edit is still recoverable once the save has landed
    cy.reload();
    cy.get('[data-cy=scene-draft-banner]').should('be.visible');
    cy.get('[data-cy=scene-draft-restore]').click();
    cy.get('[data-cy="scene-step-row-2.0"]').should('be.visible');

    cy.get('[data-cy=scene-back-button]').click();
    cy.get('[data-cy=scene-leave-discard]').click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene`);
  });

  it('Should stay in the editor when Keep editing is chosen during a Save and leave', () => {
    const sceneUrl = Cypress.env('mobileSceneUrl');
    expect(sceneUrl).to.exist;
    cy.intercept('PATCH', '**/api/v1/scene/*', req => {
      req.on('response', res => {
        res.setDelay(1500);
      });
    }).as('saveScene');
    cy.visit(sceneUrl);
    cy.get('[data-cy="scene-step-row-0.0"]').should('be.visible');
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    // the previous test saved a second step: the new ones come third and fourth
    cy.get('[data-cy=scene-add-step]').click();
    cy.get('[data-cy="scene-step-sheet-2.0"] [data-cy="type-picker-option"][data-value="delay"]').click();
    cy.get('body').type('{esc}');

    // Save and leave, then Keep editing while the request is in flight
    cy.get('[data-cy=scene-back-button]').click();
    cy.get('[data-cy=scene-leave-save]').click();
    cy.get('[data-cy=scene-leave-keep-editing]').click();
    cy.get('[data-cy=scene-add-step]').click();
    cy.get('[data-cy="scene-step-sheet-3.0"] [data-cy="type-picker-option"][data-value="delay"]').click();
    cy.get('body').type('{esc}');

    cy.wait('@saveScene');
    cy.get('[data-cy=scene-toast]').should('be.visible');
    // the editor stayed, with the later edit unsaved and already in the draft
    cy.url().should('include', sceneUrl);
    cy.get('[data-cy=scene-unsaved-label]').should('be.visible');
    cy.window().then(win => {
      const draft = JSON.parse(win.localStorage.getItem(findDraftKey(win, sceneUrl)));
      expect(draft.scene.actions[3][0].type).to.eq('delay');
    });

    cy.get('[data-cy=scene-back-button]').click();
    cy.get('[data-cy=scene-leave-discard]').click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene`);
  });

  it('Should not keep the offered draft after a Save and leave', () => {
    const sceneUrl = Cypress.env('mobileSceneUrl');
    expect(sceneUrl).to.exist;
    cy.visit(sceneUrl);
    cy.get('[data-cy="scene-step-row-0.0"]').should('be.visible');
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    // a draft, offered back after a reload (the previous tests saved three steps)
    cy.get('[data-cy=scene-add-step]').click();
    cy.get('[data-cy="scene-step-sheet-3.0"] [data-cy="type-picker-option"][data-value="delay"]').click();
    cy.get('body').type('{esc}');
    cy.get('[data-cy=scene-unsaved-label]').should('be.visible');
    cy.reload();
    cy.get('[data-cy=scene-draft-banner]').should('be.visible');

    // ignored: another edit, then Save and leave
    cy.get('[data-cy=scene-add-step]').click();
    cy.get('[data-cy="scene-step-sheet-3.0"] [data-cy="type-picker-option"][data-value="delay"]').click();
    cy.get('body').type('{esc}');
    cy.get('[data-cy=scene-back-button]').click();
    cy.get('[data-cy=scene-leave-save]').click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene`);

    // the save superseded the offered draft: nothing is offered on the next open
    cy.window().then(win => {
      expect(hasDraft(win, sceneUrl)).to.eq(false);
    });
    cy.visit(sceneUrl);
    cy.get('[data-cy="scene-step-row-3.0"]').should('be.visible');
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get('[data-cy=scene-draft-banner]').should('not.exist');
  });

  it('Should follow a run: the last run of the status line and the executing step', () => {
    const sceneUrl = Cypress.env('mobileSceneUrl');
    expect(sceneUrl).to.exist;
    const sceneSelector = sceneUrl.split('/').pop();
    cy.visit(sceneUrl);
    cy.get('[data-cy="scene-step-row-0.0"]').should('be.visible');
    cy.get('[data-cy=scene-last-run]').should('not.exist');

    // the messages the server sends over a run (Cypress delivers the websocket messages itself)
    cy.sendWebSocket({
      type: 'scene.started',
      payload: { executionId: 'cypress-run', sceneSelector, startedAt: new Date().toISOString() }
    });
    cy.get('[data-cy=scene-last-run]').should('be.visible');
    // a run is not an unsaved change
    cy.get('[data-cy=scene-unsaved-label]').should('not.exist');

    // the executing action is named by its path
    cy.sendWebSocket({ type: 'scene.executing-action', payload: { path: '0.0' } });
    cy.get('[data-cy="scene-step-row-0.0"]').should('have.attr', 'aria-current', 'step');
    cy.sendWebSocket({ type: 'scene.finished-executing-action', payload: { path: '0.0' } });
    cy.get('[data-cy="scene-step-row-0.0"]').should('not.have.attr', 'aria-current');

    cy.sendWebSocket({ type: 'scene.stopped', payload: { executionId: 'cypress-run', sceneSelector } });
    cy.get('[data-cy=scene-run-button]').should('be.visible');
    cy.get('[data-cy=scene-unsaved-label]').should('not.exist');
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
