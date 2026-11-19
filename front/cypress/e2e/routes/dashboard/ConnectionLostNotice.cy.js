// The "Gladys is unreachable" notice of the app shell (components/header/ConnectionLostNotice.jsx):
// shown when the session check at load gets no answer, or when the live connection is lost for
// more than a few seconds. "Retry" only reloads the app once Gladys answers again.
//
// The session check is stubbed without an answer for as long as the notice must stay: the
// websocket of the test instance is up, and a connection that is back runs the check again.
describe('Connection lost notice', () => {
  const serverUrl = Cypress.env('serverUrl');

  beforeEach(() => {
    cy.login();
  });

  it('is not shown while Gladys answers', () => {
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/me` }).as('me');
    cy.visit('/dashboard');
    cy.wait('@me');
    cy.get('[data-cy=sidebar-nav]').should('exist');
    cy.get('[data-cy=connection-lost-notice]').should('not.exist');
  });

  it('says that Gladys is unreachable when the session check gets no answer, and reloads once it answers', () => {
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/me` }, { forceNetworkError: true }).as('me');
    cy.visit('/dashboard');
    cy.wait('@me');
    cy.get('[data-cy=connection-lost-notice]')
      .should('be.visible')
      .and('have.attr', 'role', 'alert')
      .i18n('header.connectionNoticeTitle');
    cy.get('[data-cy=connection-lost-notice-text]').i18n('header.connectionNoticeText');

    // Gladys still does not answer: the app is kept, and says so
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/ping` }, { forceNetworkError: true }).as('pingRefused');
    cy.window().then(win => {
      win.pageBeforeRetry = true;
    });
    cy.get('[data-cy=connection-lost-notice-retry]')
      .i18n('header.connectionNoticeRetry')
      .click();
    cy.wait('@pingRefused');
    cy.get('[data-cy=connection-lost-notice-text]').i18n('header.connectionNoticeStillUnreachable');
    cy.window()
      .its('pageBeforeRetry')
      .should('eq', true);

    // Gladys answers again: the app is reloaded, the notice is gone
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/me` }, req => req.continue());
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/ping` }, req => req.continue()).as('ping');
    cy.get('[data-cy=connection-lost-notice-retry]').click();
    cy.wait('@ping');
    cy.window()
      .its('pageBeforeRetry')
      .should('not.exist');
    cy.get('[data-cy=sidebar-nav]').should('exist');
    cy.get('[data-cy=connection-lost-notice]').should('not.exist');
  });

  it('stays out of the way of the top bar on a phone', () => {
    cy.viewport('iphone-x');
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/me` }, { forceNetworkError: true }).as('me');
    cy.visit('/dashboard');
    cy.wait('@me');
    cy.get('[data-cy=connection-lost-notice]').should('be.visible');
    // the burger stays reachable: the notice sits below the top bar
    cy.get('[data-cy=sidebar-toggler]').then($toggler => {
      const togglerBottom = $toggler[0].getBoundingClientRect().bottom;
      cy.get('[data-cy=connection-lost-notice]').then($notice => {
        expect($notice[0].getBoundingClientRect().top).to.be.at.least(togglerBottom);
      });
    });
    cy.document().then(doc => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
    });
    cy.get('[data-cy=connection-lost-notice-retry]')
      .invoke('outerHeight')
      .should('be.at.least', 32);
  });

  it('is shown when the live connection is lost for more than a few seconds', () => {
    cy.visit('/dashboard', {
      onBeforeLoad(win) {
        // keeps the socket of the session, to close it from the test
        const RealWebSocket = win.WebSocket;
        win.WebSocket = function WebSocketSpy(...args) {
          const socket = new RealWebSocket(...args);
          win.gladysSocket = socket;
          return socket;
        };
      }
    });
    cy.get('[data-cy=sidebar-nav]').should('exist');
    cy.window()
      .its('gladysSocket.readyState')
      .should('eq', 1);
    cy.get('[data-cy=connection-lost-notice]').should('not.exist');
    cy.window().then(win => {
      // from now on a socket never opens: Gladys is gone
      win.WebSocket = function DeadWebSocket() {
        return { close() {}, send() {} };
      };
      win.gladysSocket.onclose({ code: 1006, reason: '' });
    });
    // not at once: a connection that comes back within the delay is not announced
    cy.get('[data-cy=connection-lost-notice]').should('not.exist');
    cy.get('[data-cy=connection-lost-notice]', { timeout: 10000 })
      .should('be.visible')
      .i18n('header.connectionNoticeTitle');
  });
});
