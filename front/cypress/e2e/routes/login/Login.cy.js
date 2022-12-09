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
});
