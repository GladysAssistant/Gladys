// What cannot be taken back in the settings asks first on a wide screen too
// (docs/specs/mobile-pages/settings-pages.md, B and J). The lists and the writes are stubbed:
// nothing real is revoked or disconnected.
describe('Settings confirmations on a wide screen', () => {
  const serverUrl = Cypress.env('serverUrl');
  const api = path => `${serverUrl}/api/v1${path}`;
  const minutesAgo = minutes => new Date(Date.now() - minutes * 60 * 1000).toISOString();

  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.login();
  });

  describe('Sessions', () => {
    const CURRENT_SESSION_ID = 'cy-current-session';
    const sessions = [
      {
        id: CURRENT_SESSION_ID,
        token_type: 'refresh_token',
        useragent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        created_at: minutesAgo(5)
      },
      {
        id: 'cy-phone-session',
        token_type: 'refresh_token',
        useragent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        created_at: minutesAgo(60 * 24)
      },
      {
        id: 'cy-api-key-session',
        token_type: 'api_key',
        scope: ['dashboard:write'],
        useragent: null,
        created_at: minutesAgo(60 * 24 * 90)
      }
    ];

    beforeEach(() => {
      cy.then(() => {
        const user = JSON.parse(window.localStorage.getItem('user'));
        window.localStorage.setItem('user', JSON.stringify({ ...user, session_id: CURRENT_SESSION_ID }));
      });
      cy.intercept({ method: 'GET', url: api('/session') }, { body: sessions }).as('getSessions');
    });

    it('should revoke a session only once confirmed', () => {
      cy.intercept({ method: 'POST', url: api('/session/*/revoke') }, { body: { success: true } }).as('revokeSession');
      cy.visit('/dashboard/settings/session');
      cy.wait('@getSessions');
      cy.get('table tbody tr').should('have.length', 3);

      cy.get('[data-cy=session-revoke]')
        .eq(1)
        .click();
      cy.get('[data-cy=session-revoke-confirm]')
        .should('be.visible')
        .i18n('sessionsSettings.mobile.revokeText');
      cy.get('[data-cy=session-revoke-confirm] [data-cy=confirm-sheet-cancel]').click();
      cy.get('[data-cy=session-revoke-confirm]').should('not.exist');
      cy.get('@revokeSession.all').should('have.length', 0);
      cy.get('table tbody tr').should('have.length', 3);

      cy.get('[data-cy=session-revoke]')
        .eq(1)
        .click();
      cy.get('[data-cy=session-revoke-confirm] [data-cy=confirm-sheet-confirm]').click();
      cy.wait('@revokeSession')
        .its('request.url')
        .should('include', '/session/cy-phone-session/revoke');
      cy.get('[data-cy=session-revoke-confirm]').should('not.exist');
      cy.get('table tbody tr').should('have.length', 2);
    });

    it('should say what revoking this device or an API key does, and keep the dialog on a failure', () => {
      cy.intercept({ method: 'POST', url: api('/session/*/revoke') }, { statusCode: 500, body: {} }).as('revokeFails');
      cy.visit('/dashboard/settings/session');
      cy.wait('@getSessions');

      cy.get('[data-cy=session-revoke]')
        .eq(0)
        .click();
      cy.get('[data-cy=session-revoke-confirm]').i18n('sessionsSettings.mobile.revokeCurrentText');
      cy.get('[data-cy=session-revoke-confirm] [data-cy=confirm-sheet-cancel]').click();

      cy.get('[data-cy=session-revoke]')
        .eq(2)
        .click();
      cy.get('[data-cy=session-revoke-confirm]').i18n('sessionsSettings.mobile.revokeApiKeyText');
      cy.get('[data-cy=session-revoke-confirm] [data-cy=confirm-sheet-confirm]').click();
      cy.wait('@revokeFails');
      cy.get('[data-cy=session-revoke-confirm]')
        .should('be.visible')
        .i18n('sessionsSettings.mobile.revokeError');
      cy.get('table tbody tr').should('have.length', 3);
    });
  });

  describe('Gladys Plus', () => {
    beforeEach(() => {
      cy.intercept(
        { method: 'GET', url: api('/gateway/status') },
        { configured: true, connected: true, subscription_active: true }
      ).as('getStatus');
    });

    it('should disconnect the account only once confirmed', () => {
      cy.intercept({ method: 'POST', url: api('/gateway/logout') }, { body: { success: true } }).as('disconnect');
      cy.visit('/dashboard/settings/gateway');
      cy.wait('@getStatus');

      cy.get('[data-cy=gateway-disconnect]').click();
      cy.get('[data-cy=gateway-disconnect-confirm]')
        .should('be.visible')
        .i18n('gateway.disconnectConfirmText');
      cy.get('[data-cy=gateway-disconnect-confirm] [data-cy=confirm-sheet-cancel]').click();
      cy.get('[data-cy=gateway-disconnect-confirm]').should('not.exist');
      cy.get('@disconnect.all').should('have.length', 0);

      cy.get('[data-cy=gateway-disconnect]').click();
      cy.get('[data-cy=gateway-disconnect-confirm] [data-cy=confirm-sheet-confirm]').click();
      cy.wait('@disconnect');
      cy.get('[data-cy=gateway-disconnect-confirm]').should('not.exist');
    });

    it('should say when the account could not be disconnected', () => {
      cy.intercept({ method: 'POST', url: api('/gateway/logout') }, { statusCode: 500, body: {} }).as('disconnect');
      cy.visit('/dashboard/settings/gateway');
      cy.wait('@getStatus');

      cy.get('[data-cy=gateway-disconnect]').click();
      cy.get('[data-cy=gateway-disconnect-confirm] [data-cy=confirm-sheet-confirm]').click();
      cy.wait('@disconnect');
      cy.get('[data-cy=gateway-disconnect-error]')
        .should('be.visible')
        .i18n('gateway.disconnectError');
    });
  });
});
