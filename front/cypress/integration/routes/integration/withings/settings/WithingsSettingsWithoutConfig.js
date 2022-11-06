describe('Withings settings page', () => {
  const serverUrl = Cypress.env('serverUrl');
  let interceptCount = 0;
  before(() => {
    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/withings/oauth2/client?service_id=*`
      },
      req => {
        if (interceptCount < 2) {
          interceptCount += 1;
          req.reply({});
        } else {
          req.reply({ client_id: 'FakeClientId' });
        }
      }
    ).as('getCurrentConfig');

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
    ).as('initDevices');
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
    cy.wait('@getCurrentConfig');

    cy.get('.markup').i18n('integration.withings.settings.oauth2.instructions');

    cy.get('.form-label').i18n('integration.withings.settings.oauth2.apiKeyLabel');

    cy.get('input')
      .first()
      .clear()
      .type('FakeClientId');

    cy.get('input')
      .last()
      .clear()
      .type('FakeSecret');

    cy.contains('button', 'integration.withings.settings.oauth2.buttonConnect').click();

    cy.wait('@authorizationUriAction');

    // Check redirected to settings page
    cy.location('pathname').should('eq', '/dashboard/integration/health/withings/settings');

    cy.wait('@initDevices');

    cy.get('.alert-info').i18n('integration.withings.settings.oauth2.complete');

    cy.get('.alert-info').i18n('integration.withings.settings.oauth2.clientId');

    cy.get('.alert-info').contains('FakeClientId');

    cy.get('.alert-info').i18n('integration.withings.settings.oauth2.instructionsToUse');

    cy.contains('button', 'integration.withings.settings.oauth2.unconnectButton').should('exist');
  });

  it('Check unconnect', () => {
    cy.contains('button', 'integration.withings.settings.oauth2.unconnectButton').click();

    cy.get('.markup').i18n('integration.withings.settings.oauth2.instructions');

    cy.get('.form-label').i18n('integration.withings.settings.oauth2.apiKeyLabel');
  });
});
