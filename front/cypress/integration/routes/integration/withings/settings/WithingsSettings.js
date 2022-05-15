describe('Withings settings page', () => {
  const serverUrl = Cypress.env('serverUrl');

  before(() => {
    /*
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
            console.log('yop 0');
            res.send({});
          } else {
            console.log('yop A');
            console.log(res);
            res = { client_id: 'FakeClientId' };
            return res;
            //res.send({ client_id: 'FakeClientId' });
          }
        });
      }
    );*/
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/service/oauth2/client/authorization-uri`
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

  it('Check setting page and connect and unconnect', () => {
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

    cy.intercept(
      {
        method: 'GET',
        url: `${serverUrl}/api/v1/service/oauth2/client`
      },
      { client_id: 'FakeClientId' }
    );

    cy.contains('button', 'oauth2.buttonConnect').click();

    cy.wait('@authorizationUriAction');

    cy.location('pathname').should('eq', '/dashboard/integration/health/withings/settings');

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
