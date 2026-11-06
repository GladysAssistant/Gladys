describe('Dashboard tablet mode URL parameter', () => {
  const resetTabletMode = () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/session/tablet_mode`,
      body: { tablet_mode: false, house: null }
    });
  };
  beforeEach(() => {
    cy.login();
    // the parameter persists tablet mode on the server session; start every test
    // from a known-off state and leave it off for the other dashboard specs.
    resetTabletMode();
  });
  afterEach(() => {
    resetTabletMode();
  });

  it('Should activate tablet mode for the house given in ?tablet_mode_house=', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept('POST', '**/api/v1/session/tablet_mode').as('setTabletMode');

    cy.visit('/dashboard?tablet_mode_house=my-house');

    // the house selector is posted as-is, turning tablet mode on
    cy.wait('@setTabletMode').then(({ request }) => {
      expect(request.body).to.deep.include({ tablet_mode: true, house: 'my-house' });
    });

    // the server session now reflects tablet mode for that exact house
    cy.request({ method: 'GET', url: `${serverUrl}/api/v1/house` }).then(({ body: houses }) => {
      const house = houses.find(h => h.selector === 'my-house');
      cy.request({ method: 'GET', url: `${serverUrl}/api/v1/session/tablet_mode` }).then(({ body }) => {
        expect(body.tablet_mode).to.equal(true);
        expect(body.current_house_id).to.equal(house.id);
      });
    });
  });

  it('Should show an on-screen alert and not activate tablet mode for an unknown selector', () => {
    const serverUrl = Cypress.env('serverUrl');

    cy.visit('/dashboard?tablet_mode_house=does-not-exist');

    // the server 404 for the unknown selector surfaces a dashboard alert instead
    // of a silent no-op
    cy.get('[data-cy="tablet-mode-param-error"]').should('be.visible');

    // and tablet mode stays off
    cy.request({ method: 'GET', url: `${serverUrl}/api/v1/session/tablet_mode` }).then(({ body }) => {
      expect(body.tablet_mode).to.equal(false);
    });
  });

  it('Should show an on-screen alert when activation fails with a server error', () => {
    cy.intercept('POST', '**/api/v1/session/tablet_mode', { statusCode: 500, body: {} }).as('setTabletMode');

    cy.visit('/dashboard?tablet_mode_house=my-house');

    // a failed activation is surfaced too, never a console-only no-op
    cy.wait('@setTabletMode');
    cy.get('[data-cy="tablet-mode-activation-error"]').should('be.visible');
  });

  it('Should ignore the parameter on a phone, where the tablet mode menu is hidden', () => {
    const serverUrl = Cypress.env('serverUrl');
    cy.viewport('iphone-x');
    cy.intercept('POST', '**/api/v1/session/tablet_mode').as('setTabletMode');

    cy.visit('/dashboard?tablet_mode_house=my-house');

    // below the md breakpoint the menu to turn tablet mode off is hidden, so the
    // parameter is a no-op: no activation POST, no alert, tablet mode stays off
    cy.get('.dashboard').should('exist');
    cy.get('[data-cy="tablet-mode-param-error"]').should('not.exist');
    cy.request({ method: 'GET', url: `${serverUrl}/api/v1/session/tablet_mode` }).then(({ body }) => {
      expect(body.tablet_mode).to.equal(false);
    });
    cy.get('@setTabletMode.all').should('have.length', 0);
  });
});
