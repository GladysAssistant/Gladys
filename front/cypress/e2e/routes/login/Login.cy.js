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

  // Only a refusal of Gladys is a wrong email or password: a Gladys that does not answer,
  // asks to wait or fails says so (actions/login/login.js)
  [
    { name: 'Gladys does not answer', response: { forceNetworkError: true }, key: 'login.unreachable' },
    {
      name: 'a proxy answers for a stopped Gladys',
      response: { statusCode: 502, body: 'Bad Gateway' },
      key: 'login.unreachable'
    },
    {
      name: 'there were too many attempts',
      response: { statusCode: 429, body: 'Too many requests, please try again later.' },
      key: 'login.tooManyRequests'
    },
    {
      name: 'Gladys fails',
      response: { statusCode: 500, body: { status: 500, code: 'SERVER_ERROR' } },
      key: 'login.serverError'
    }
  ].forEach(({ name, response, key }) => {
    it(`Does not blame the password when ${name}`, () => {
      const serverUrl = Cypress.env('serverUrl');
      const { tony } = Cypress.env('users');
      cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/login` }, response).as('login');
      cy.clearLocalStorage();
      cy.visit('/login');

      cy.get('input[type=email]').type(tony.email);
      cy.get('input[type=password]').type(tony.password);
      cy.contains('button', 'login.loginButtonText').click();

      cy.wait('@login');
      cy.get('[data-cy=login-error]')
        .should('be.visible')
        .i18n(key);
      cy.location('pathname').should('eq', '/login');
    });
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
