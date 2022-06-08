describe('Withings settings page', () => {
  const serverUrl = Cypress.env('serverUrl');

  before(() => {
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/withings/oauth2/client/authorization-uri`
      },
      {
        authorizationUri: '/dashboard/integration/health/withings/settings'
      }
    ).as('authorizationUriAction');
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

    cy.login();

    cy.visit('/dashboard/integration/health/withings/settings');
  });

  it('Check setting page and connect', () => {
    cy.get('.markup').i18n('oauth2.instructions');

    cy.get('.form-label').i18n('withings.settings.oauth2.apiKeyLabel');

    cy.get('input')
      .first()
      .clear()
      .type('FakeClientId');

    cy.get('input')
      .last()
      .clear()
      .type('FakeSecret');

    cy.contains('button', 'withings.settings.oauth2.buttonConnect').click();

    cy.wait('@authorizationUriAction');
  });
});
