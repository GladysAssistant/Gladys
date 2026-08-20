describe('Dashboard', () => {
  // The created dashboard's selector carries 4 random characters (#2906):
  // captured once at creation, reused by the later tests of this spec
  let dashboardSelector;
  beforeEach(() => {
    cy.login();
  });
  it('Should create new dashboard', () => {
    cy.visit('/dashboard');

    // cy.contains as root command: the subject is re-queried on retry, so the
    // assertion survives the async route chunk rendering after the header.
    cy.contains('a', 'dashboard.newDashboardButton')
      .should('have.class', 'btn-success')
      .click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/create/new`);

    cy.get('input:visible').then(inputs => {
      // dashboard name
      cy.wrap(inputs[0]).type('My new dashboard');
    });

    cy.contains('button', 'newDashboard.createDashboardButton')
      .should('have.class', 'btn-primary')
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
