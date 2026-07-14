describe('Dashboard', () => {
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

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/my-new-dashboard/edit`);
  });
  it('Should add new boxes', () => {
    cy.contains('.btn-primary', 'dashboard.addBoxButton').click();
    cy.get('select').then(inputs => {
      cy.wrap(inputs[1]).select('user-presence');
    });
    cy.contains('.btn-outline-primary', 'dashboard.editDashboardSaveButton').click();
  });
  it('Should delete dashboard', () => {
    cy.contains('dashboard.editDashboardButton')
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
