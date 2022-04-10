describe('Withings settings page', () => {
  const serverUrl = Cypress.env('serverUrl');

  before(() => {
    let interceptCount = 0;
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/oauth2/client`
      },
      req => {
        req.reply(res => {
          if (interceptCount === 0) {
            interceptCount += 1;
            res.send({});
          } else {
            res.send({ client_id: 'FakeClientId' });
          }
        });
      }
    );
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/oauth2/client/authorization-uri`
      },
      {
        authorizationUri: '/dashboard/integration/health/withings/settings'
      }
    );
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/withings/init`
      },
      {
        body: []
      }
    );

    cy.login();

    cy.visit('/dashboard/integration/health/withings/settings');
  });

  it('Check setting page and connect', () => {
    cy.get('.markup').i18n('oauth2.instructions');

    cy.get('.form-label').i18n('oauth2.apiKeyLabel');

    cy.get('input')
      .first()
      .clear()
      .type('FakeClientId');

    cy.get('input')
      .last()
      .clear()
      .type('FakeSecret');

    cy.contains('button', 'oauth2.buttonConnect').click();

    // Check redirected to settings page
    cy.location('pathname').should('eq', '/dashboard/integration/health/withings/settings');

    cy.get('.alert-info').i18n('integration.withings.settings.oauth2.complete');

    cy.get('.alert-info').i18n('integration.withings.settings.oauth2.clientId');

    cy.get('.alert-info').contains('FakeClientId');

    cy.get('.alert-info').i18n('integration.withings.settings.oauth2.instructionsToUse');

    cy.contains('p', 'oauth2.delete').should('exist');
  });

  it('Check unconnect', () => {
    cy.contains('button', 'oauth2.unconnectButton').click();

    cy.get('.markup').i18n('oauth2.instructions');

    cy.get('.form-label').i18n('oauth2.apiKeyLabel');
  });
});
