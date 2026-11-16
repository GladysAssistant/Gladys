// The mobile scene editor beyond its first screen (docs/specs/scene-editor-mobile.md): summaries
// that name things (C.1), the sheets closed by a drag or by the system "back" (E.4), a step moved
// by a long press (E.9) and the forms dressed for a phone (E.11).
describe('Scene editor on a phone: sheets, forms and gestures', () => {
  const serverUrl = Cypress.env('serverUrl');
  let sceneSelector;

  // a finger on the screen: the handlers read the touch points of real touch events, a list
  // with an item() method (react-select listens to them on the document too)
  const touchList = points => {
    const list = points.slice();
    list.item = index => list[index];
    return list;
  };
  const touch = (clientX, clientY) => ({
    touches: touchList([{ clientX, clientY, pageX: clientX, pageY: clientY }])
  });
  const noTouch = () => ({ touches: touchList([]) });

  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.login();

    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/scene`,
      body: {
        name: 'Gesture scene',
        icon: 'zap',
        tags: [],
        triggers: [
          {
            type: 'time.changed',
            scheduler_type: 'every-week',
            time: '08:00',
            days_of_the_week: ['monday', 'tuesday']
          },
          { type: 'user.back-home', user: 'tony', house: 'my-house' }
        ],
        actions: [
          [{ type: 'delay', value: 5, unit: 'seconds' }],
          [{ type: 'message.send', user: 'tony', text: 'Hello' }],
          [{ type: 'house.is-empty', house: 'my-house' }]
        ]
      }
    }).then(res => {
      sceneSelector = res.body.selector;
    });
  });

  afterEach(() => {
    cy.request({ method: 'DELETE', url: `${serverUrl}/api/v1/scene/${sceneSelector}`, failOnStatusCode: false });
  });

  const openScene = () => {
    cy.visit(`/dashboard/scene/${sceneSelector}`);
    cy.get('[data-cy="scene-step-row-0.0"]').should('be.visible');
  };

  it('Should name the user and the house in the summaries, not their selectors', () => {
    openScene();
    cy.get('[data-cy="scene-trigger-row-1"]').should('contain', 'Tony');
    cy.get('[data-cy="scene-trigger-row-1"]').should('contain', 'My House');
    cy.get('[data-cy="scene-trigger-row-1"]').should('not.contain', 'my-house');
    cy.get('[data-cy="scene-step-row-1.0"]').should('contain', 'Tony');
    cy.get('[data-cy="scene-step-row-2.0"]').should('contain', 'My House');
  });

  it('Should close the sheet on top with the system back, and leave the editor with the next one', () => {
    cy.visit('/dashboard/scene');
    cy.get(`[data-cy="scene-row-${sceneSelector}"]`).click();
    cy.get('[data-cy="scene-step-row-1.0"]').click();
    cy.get('[data-cy="scene-step-sheet-1.0"]').should('be.visible');

    cy.go('back');
    cy.get('[data-cy="scene-step-sheet-1.0"]').should('not.be.visible');
    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene/${sceneSelector}`);

    // a sheet closed with its button leaves nothing in the way: one "back" leaves the editor
    cy.get('[data-cy="scene-step-row-1.0"]').click();
    cy.get('[data-cy="scene-step-sheet-1.0"]').should('be.visible');
    cy.get('body').type('{esc}');
    cy.get('[data-cy="scene-step-sheet-1.0"]').should('not.be.visible');
    cy.go('back');
    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/scene`);
  });

  it('Should close a sheet dragged down by its header, and keep one barely moved', () => {
    openScene();
    cy.get('[data-cy="scene-step-row-0.0"]').click();
    cy.get('[data-cy="scene-step-sheet-0.0"]').should('be.visible');

    cy.get('[data-cy="scene-step-sheet-0.0"] h2').then($title => {
      const { left, top, width } = $title[0].getBoundingClientRect();
      const x = left + width / 2;
      const drag = distance => {
        cy.wrap($title).trigger('touchstart', touch(x, top + 5));
        cy.wrap($title).trigger('touchmove', touch(x, top + 5 + distance / 2));
        cy.wrap($title).trigger('touchmove', touch(x, top + 5 + distance));
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(120);
        cy.wrap($title).trigger('touchend', noTouch());
      };
      drag(40);
      cy.get('[data-cy="scene-step-sheet-0.0"]').should('be.visible');
      drag(260);
      cy.get('[data-cy="scene-step-sheet-0.0"]').should('not.be.visible');
    });
    // closing a sheet is not an edit
    cy.get('[data-cy=scene-unsaved-label]').should('not.exist');
  });

  it('Should move a step held under the finger, and scroll on a quick move', () => {
    openScene();
    // the forms have settled: the move below is the only change
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get('[data-cy="scene-step-row-0.0"]').should('contain', '5');

    cy.get('[data-cy="scene-step-row-0.0"]').then($row => {
      const { left, top, width, height } = $row[0].getBoundingClientRect();
      const x = left + width / 2;
      const y = top + height / 2;
      // a press that moves at once is a scroll: nothing is picked up
      cy.wrap($row).trigger('touchstart', touch(x, y));
      cy.wrap($row).trigger('touchmove', touch(x, y + 40));
      cy.wrap($row).trigger('touchend', noTouch());
      cy.get('[data-cy="scene-step-row-0.0"]').should('contain', '5');
      cy.get('[data-cy=scene-unsaved-label]').should('not.exist');

      // held, the step follows the finger below the next one
      cy.wrap($row).trigger('touchstart', touch(x, y));
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.wrap($row).trigger('touchmove', touch(x, y + 40));
      cy.wrap($row).trigger('touchmove', touch(x, y + height * 1.6));
      cy.wrap($row).trigger('touchend', noTouch());
    });

    cy.get('[data-cy="scene-step-row-1.0"]').should('contain', '5');
    cy.get('[data-cy="scene-step-row-0.0"]').should('contain', 'Tony');
    cy.get('[data-cy=scene-unsaved-label]').should('be.visible');
    // the drop is not a tap: no sheet opened
    cy.get('[data-cy="scene-step-sheet-0.0"]').should('not.be.visible');
    cy.get('[data-cy="scene-step-sheet-1.0"]').should('not.be.visible');
  });

  it('Should fold the long explanations of a form and open them on a tap', () => {
    openScene();
    cy.get('[data-cy="scene-step-row-1.0"]').click();
    cy.get('[data-cy="scene-step-sheet-1.0"] [data-help-fold]')
      .first()
      .as('help');
    cy.get('@help').should('have.attr', 'aria-expanded', 'false');
    cy.get('@help').click();
    cy.get('@help').should('have.attr', 'aria-expanded', 'true');
    cy.get('@help').click();
    cy.get('@help').should('have.attr', 'aria-expanded', 'false');
    cy.get('body').type('{esc}');
    // reading a help text is not an edit
    cy.get('[data-cy=scene-unsaved-label]').should('not.exist');
  });

  it('Should pick the days with toggles and the time with the native field', () => {
    cy.intercept('PATCH', '**/api/v1/scene/*').as('saveScene');
    openScene();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get('[data-cy="scene-trigger-row-0"]').click();

    cy.get('[data-cy="scene-trigger-sheet-0"] [data-cy=day-pill-monday]').should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-cy="scene-trigger-sheet-0"] [data-cy=day-pill-friday]').should('have.attr', 'aria-pressed', 'false');
    cy.get('[data-cy="scene-trigger-sheet-0"] [data-cy=day-pill-friday]').click();
    cy.get('[data-cy="scene-trigger-sheet-0"] [data-cy=day-pill-monday]').click();
    cy.get('[data-cy="scene-trigger-sheet-0"] input[type="time"]')
      .should('have.value', '08:00')
      .type('21:45');
    cy.get('[data-cy="scene-trigger-sheet-0"] [data-cy=sheet-ok]').click();

    cy.get('[data-cy=scene-save-button]').click();
    cy.wait('@saveScene').then(({ request }) => {
      expect(request.body.triggers[0].days_of_the_week).to.deep.equal(['tuesday', 'friday']);
      expect(request.body.triggers[0].time).to.equal('21:45');
    });
  });
});
