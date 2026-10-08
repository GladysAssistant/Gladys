describe('Login', () => {
  before(() => {
    cy.login();
    cy.clearLocalStorage();
  });

  it('Fill only email', () => {
    cy.visit('/login');

    cy.get('.alert.alert-danger').should('have.length', 0);

    cy.get('input[type=email]').type('mon-adresse@email.com');

    cy.contains('button', 'login.loginButtonText')
      .should('not.be.disabled')
      .click();

    cy.get('.alert.alert-danger')
      .should('be.visible')
      .i18n('login.wrongCredentials');
  });

  it('Redirects to return_url after login', () => {
    const { tony } = Cypress.env('users');
    cy.clearLocalStorage();
    cy.visit(`/login?return_url=${encodeURIComponent('/dashboard/chat')}`);

    cy.get('input[type=email]').type(tony.email);
    cy.get('input[type=password]').type(tony.password);
    cy.contains('button', 'login.loginButtonText').click();

    cy.location('pathname').should('eq', '/dashboard/chat');
  });

  it('Ignores a return_url pointing to another domain', () => {
    const { tony } = Cypress.env('users');
    cy.clearLocalStorage();
    cy.visit(`/login?return_url=${encodeURIComponent('//example.com')}`);

    cy.get('input[type=email]').type(tony.email);
    cy.get('input[type=password]').type(tony.password);
    cy.contains('button', 'login.loginButtonText').click();

    cy.location('pathname').should('match', /^\/dashboard/);
    cy.location('origin').should('eq', Cypress.config('baseUrl').replace(/\/$/, ''));
  });
});
