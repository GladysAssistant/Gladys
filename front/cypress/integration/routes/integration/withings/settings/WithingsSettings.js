describe('Withings settings page', () => {
  before(() => {
    cy.login();

    cy.visit('/dashboard/integration/health/withings/settings');
  });

  it('Check setting page and connect', () => {
    cy.get('.markup').i18n('integration.oauth2.instructions');

    cy.get('.form-label').i18n('integration.oauth2.apiKeyLabel');

    cy.get('input')
      .first()
      .clear()
      .type('FakeClientId');

    cy.get('input')
      .last()
      .clear()
      .type('FakeSecret');

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/oauth2/client/authorization-uri`
      },
      req => {
        req.reply(res => {
          res.body.authorizationUri = `/dashboard/integration/health/withings/settings`;
        });
      }
    );

    cy.contains('button', 'integration.oauth2.buttonConnect').click();

    // Check redirected to settings page
    cy.location('pathname').should('eq', '/dashboard/integration/health/withings/settings');

    cy.get('.alert-info').i18n('integration.withings.settings.complete');

    cy.get('.alert-info').i18n('integration.withings.settings.clientId');

    cy.get('.alert-info').contains('FakeClientId');

    cy.get('.alert-info').i18n('integration.withings.settings.instructionsToUse');

    cy.contains('p', 'integration.oauth2.delete').should('exist');
  });

  it('Check unconnect', () => {
    cy.contains('button', 'integration.oauth2.unconnectButton').click();

    cy.get('.markup').i18n('integration.oauth2.instructions');

    cy.get('.form-label').i18n('integration.oauth2.apiKeyLabel');
  });
});
