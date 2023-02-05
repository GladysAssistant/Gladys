describe('Dashboard', () => {
  beforeEach(() => {
    cy.login();
  });
  it('Should create new dashboard', () => {
    cy.visit('/dashboard');

    cy.get('a')
      .contains('dashboard.newDashboardButton')
      .should('have.class', 'btn-success')
      .click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/create/new`);

    cy.get('input:visible').then(inputs => {
      // dashboard name
      cy.wrap(inputs[0]).type('My new dashboard');
    });

    cy.get('button')
      .contains('newDashboard.createDashboardButton')
      .should('have.class', 'btn-primary')
      .click();

    cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard/my-new-dashboard/edit`);
  });
  it('Should add new boxes', () => {
    cy.get('select').then(inputs => {
      cy.wrap(inputs[0]).select('user-presence');
      cy.get('button').then(inputs => {
        cy.wrap(inputs[0]).click();
      });
    });
    cy.get('[class*="-control"]')
      .find('div')
      .first()
      .click(0, 0, { force: true })
      .get('[class*="-menu"]')
      .find('[class*="-option"]')
      .filter(`:contains("Tony")`)
      .click(0, 0, { force: true });
    cy.contains('dashboard.editDashboardSaveButton')
      .should('have.class', 'btn-outline-primary')
      .click();
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
