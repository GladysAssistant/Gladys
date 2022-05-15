describe('Withings settings page', () => {
  const serverUrl = Cypress.env('serverUrl');

  before(() => {
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
        url: `${serverUrl}/api/v1/service/withings/init_devices`
      },
      {
        body: []
      }
    );
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/withings/reset`
      },
      {
        body: {
          success: true
        }
      }
    );
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/withings/variable/OAUTH2_CLIENT_ID`
      },
      {
        body: {
          success: true
        }
      }
    );
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/withings/variable/OAUTH2_CLIENT_SECRET`
      },
      {
        body: {
          success: true
        }
      }
    );
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/oauth2/client`
      },
      { client_id: 'FakeClientId' }
    ).as('getConfig');

    cy.login();

    cy.visit('/dashboard/integration/health/withings/settings');
  });

  it('Check setting page with existing', () => {
    cy.wait('@getConfig');

    cy.get('.alert.alert-info').i18n('integration.withings.settings.oauth2.complete');

    cy.get('.alert.alert-info').i18n('integration.withings.settings.oauth2.clientId');

    cy.get('.alert.alert-info').contains('FakeClientId');

    cy.get('.alert.alert-info').i18n('integration.withings.settings.oauth2.instructionsToUse');

    cy.contains('p', 'oauth2.delete').should('exist');
  });

  it('Check setting page unconnect', () => {
    cy.contains('button', 'oauth2.unconnectButton').click();

    cy.get('.markup').i18n('oauth2.instructions');

    cy.get('.form-label').i18n('oauth2.apiKeyLabel');
  });
});
