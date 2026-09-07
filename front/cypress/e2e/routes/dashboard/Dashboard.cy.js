describe('Dashboard', () => {
  // The created dashboard's selector carries 4 random characters (#2906):
  // captured once at creation, reused by the later tests of this spec
  let dashboardSelector;
  // Selector of the API-created emoji dashboard, deleted from afterEach so a
  // failed visit or assertion never leaves it behind for the next tests
  let emojiDashboardSelector;
  beforeEach(() => {
    cy.login();
  });
  afterEach(() => {
    if (emojiDashboardSelector) {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('serverUrl')}/api/v1/dashboard/${emojiDashboardSelector}`
      });
      emojiDashboardSelector = null;
    }
  });
  it('Should create new dashboard', () => {
    cy.visit('/dashboard');

    // With no dashboard yet, the page is the first-run checklist (GetStarted):
    // its dashboard step is the create entry point.
    cy.get('[data-cy="get-started-create-dashboard"]').click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/create/new`);

    cy.get('input:visible').then(inputs => {
      // dashboard name
      cy.wrap(inputs[0]).type('My new dashboard');
    });

    // the icon is required at creation: the button stays disabled until one
    // is picked (the radio input itself is visually hidden behind the tile)
    cy.contains('button', 'newDashboard.createDashboardButton').should('be.disabled');
    cy.get('input[name="icon"][value="home"]').check({ force: true });

    cy.contains('button', 'newDashboard.createDashboardButton')
      .should('have.class', 'btn-primary')
      .should('not.be.disabled')
      .click();

    // The selector of a new dashboard ends with 4 random characters, like scenes
    cy.url()
      .should('match', new RegExp(`^${Cypress.config().baseUrl}/dashboard/my-new-dashboard-[a-z0-9]{4}/edit$`))
      .then(url => {
        dashboardSelector = url.match(/\/dashboard\/([^/]+)\/edit$/)[1];
      });
  });
  it('Should add new boxes', () => {
    cy.contains('.btn-primary', 'dashboard.addBoxButton').click();
    cy.get('[data-cy="box-type-user-presence"]').click();
    cy.contains('.btn-outline-primary', 'dashboard.editDashboardSaveButton').click();

    // saving keeps the user in the editor (chain editing): a transient
    // confirmation shows, and leaving is available immediately
    cy.get('[data-cy="dashboard-saved-label"]').should('be.visible');
    cy.contains('button', 'dashboard.editDashboardDoneButton').should('be.visible');
    cy.then(() => {
      cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/${dashboardSelector}/edit`);
    });
  });
  it('Should widen a column', () => {
    // a new dashboard starts with 3 columns: widen the first one
    cy.get('[data-cy="toggle-column-width-0"]').click();
    cy.intercept('PATCH', '**/api/v1/dashboard/*').as('saveDashboard');
    cy.contains('.btn-outline-primary', 'dashboard.editDashboardSaveButton').click();
    // the section is saved with one weight per column, wide first
    cy.wait('@saveDashboard')
      .its('request.body.boxes.0.widths')
      .should('deep.equal', [2, 1, 1]);
    cy.get('[data-cy="dashboard-saved-label"]').should('be.visible');
  });
  it('Should map the leading emoji of an icon-less dashboard to an icon in the tab bar', () => {
    const serverUrl = Cypress.env('serverUrl');
    // Created straight through the API without an icon, like every dashboard
    // predating the required icon: the tab bar derives the icon from the
    // leading emoji of the name (🎬 → clapperboard), never renders the emoji
    // itself, and strips it from the pill label.
    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/dashboard`,
      body: {
        name: '🎬 Cinema room',
        type: 'main',
        visibility: 'private',
        boxes: [{ columns: [[], [], []] }]
      }
    }).then(res => {
      emojiDashboardSelector = res.body.selector;
      cy.visit('/dashboard');
      cy.get(`a[href="/dashboard/${emojiDashboardSelector}"]`)
        .should('contain', 'Cinema room')
        .and('not.contain', '🎬')
        .find('i.fe-clapperboard')
        .should('exist');
    });
  });
  it('Should delete dashboard', () => {
    cy.then(() => {
      cy.visit(`/dashboard/${dashboardSelector}`);
    });
    // the edit action is an icon pill (its label lives in the title attribute)
    cy.get('[data-cy="edit-dashboard-button"]')
      .should('have.class', 'btn-outline-primary')
      .click();
    cy.contains('dashboard.editDashboardDeleteButton')
      .should('have.class', 'btn-outline-danger')
      .click();
    cy.contains('dashboard.editDashboardDeleteButton')
      .should('have.class', 'btn-outline-danger')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard`);
  });
});
