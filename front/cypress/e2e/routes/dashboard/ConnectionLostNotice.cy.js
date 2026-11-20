// The "Gladys is unreachable" notice of the app shell (components/header/ConnectionLostNotice.jsx):
// active when the session check at load gets no answer, or when the live connection is lost for
// more than a few seconds. It asks Gladys before saying anything — "unreachable" when Gladys does
// not answer, "live updates are interrupted" when it does — and a dashboard is reloaded by the
// notice itself once Gladys is back.
//
// The websocket of the tests delivers no message by itself (support/commands.js): the session of
// the page is authenticated when a test says so, with `authenticated()`.
describe('Connection lost notice', () => {
  const serverUrl = Cypress.env('serverUrl');
  const AUTO_RELOAD_KEY = 'gladys-connection-notice-reloaded';
  const notice = '[data-cy=connection-lost-notice]';

  const gladysDoesNotAnswer = url =>
    cy.intercept({ method: 'GET', url: `${serverUrl}${url}` }, { forceNetworkError: true });
  const gladysAnswers = url => cy.intercept({ method: 'GET', url: `${serverUrl}${url}` }, req => req.continue());
  const authenticated = () => cy.sendWebSocket({ type: 'authentication.connected', payload: {} });

  // Opens the dashboard and keeps the socket of the session at hand, to close it from the test
  const visitDashboard = () => {
    cy.visit('/dashboard', {
      onBeforeLoad(win) {
        win.sessionStorage.removeItem(AUTO_RELOAD_KEY);
        const TrackedWebSocket = win.WebSocket;
        win.WebSocket = function WebSocketSpy(...args) {
          const socket = new TrackedWebSocket(...args);
          // (the dev server of the front opens a websocket of its own)
          if (String(args[0]).startsWith(Cypress.env('websocketUrl'))) {
            win.gladysSocket = socket;
          }
          return socket;
        };
      }
    });
    cy.get('[data-cy=sidebar-nav]').should('exist');
    cy.window()
      .its('gladysSocket.readyState')
      .should('eq', 1);
  };

  const loseTheLiveConnection = () =>
    cy.window().then(win => {
      win.gladysSocket.onclose({ code: 1006, reason: '' });
    });

  beforeEach(() => {
    cy.login();
  });

  // A test that signs out leaves the session of the run behind it: the next cy.login() signs
  // in again instead of reusing a token that may have been revoked
  const forgetTheSessionOfTheRun = () => cy.task('storeVariable', { key: 'tony', value: null });

  it('is not shown while Gladys answers', () => {
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/me` }).as('me');
    cy.visit('/dashboard');
    cy.wait('@me');
    cy.get('[data-cy=sidebar-nav]').should('exist');
    cy.get(notice).should('not.exist');
  });

  describe('when the live connection is lost', () => {
    beforeEach(() => {
      cy.clock();
      visitDashboard();
    });

    it('waits 4 seconds, then says that Gladys is unreachable when it does not answer', () => {
      gladysDoesNotAnswer('/api/v1/ping').as('ping');
      loseTheLiveConnection();
      // a connection that comes back within the delay is not announced
      cy.tick(3900);
      cy.get(notice).should('not.exist');
      cy.get('@ping.all').should('have.length', 0);
      cy.tick(200);
      cy.wait('@ping');
      cy.get(notice)
        .should('be.visible')
        .and('have.attr', 'role', 'status')
        .and('have.attr', 'data-state', 'unreachable');
      cy.get('[data-cy=connection-lost-notice-title]').i18n('header.connectionNoticeTitle');
      cy.get('[data-cy=connection-lost-notice-text]').i18n('header.connectionNoticeText');
      cy.get('[data-cy=connection-lost-notice-retry]').i18n('header.connectionNoticeRetry');
    });

    it('says that live updates are interrupted, and not that Gladys is unreachable, when Gladys answers', () => {
      gladysAnswers('/api/v1/ping').as('ping');
      loseTheLiveConnection();
      cy.tick(4100);
      cy.wait('@ping');
      cy.get(notice)
        .should('be.visible')
        .and('have.attr', 'data-state', 'interrupted');
      cy.get('[data-cy=connection-lost-notice-title]').i18n('header.connectionNoticeInterruptedTitle');
      cy.get('[data-cy=connection-lost-notice-text]').i18n('header.connectionNoticeInterruptedText');
      cy.get('[data-cy=connection-lost-notice-retry]').i18n('header.connectionNoticeReload');
    });

    it('follows Gladys: unreachable while it is down, interrupted once it answers again', () => {
      gladysDoesNotAnswer('/api/v1/ping').as('pingRefused');
      loseTheLiveConnection();
      cy.tick(4100);
      cy.wait('@pingRefused');
      cy.get(notice).should('have.attr', 'data-state', 'unreachable');
      // Gladys is asked again every 5 seconds
      gladysAnswers('/api/v1/ping').as('ping');
      cy.tick(5000);
      cy.wait('@ping');
      cy.get(notice).should('have.attr', 'data-state', 'interrupted');
    });

    it('does not restart the delay when the connection is lost again while reconnecting', () => {
      gladysDoesNotAnswer('/api/v1/ping').as('ping');
      loseTheLiveConnection();
      cy.window().then(win => {
        win.firstSocket = win.gladysSocket;
      });
      // the session tries again, and its new socket is lost in turn
      cy.tick(2000);
      cy.window().should(win => {
        expect(win.gladysSocket).not.to.equal(win.firstSocket);
        expect(win.gladysSocket.readyState).to.equal(1);
      });
      loseTheLiveConnection();
      cy.tick(1900);
      cy.get(notice).should('not.exist');
      // 4 seconds after the first loss, not after the second one
      cy.tick(200);
      cy.wait('@ping');
      cy.get(notice).should('be.visible');
    });

    it('leaves as soon as the live connection is back', () => {
      gladysDoesNotAnswer('/api/v1/ping').as('ping');
      loseTheLiveConnection();
      cy.tick(4100);
      cy.wait('@ping');
      cy.get(notice).should('be.visible');
      // the session reconnects: its new socket is authenticated
      cy.tick(2000);
      authenticated();
      cy.get(notice).should('not.exist');
      // and Gladys is no longer asked
      cy.get('@ping.all').then(calls => {
        const count = calls.length;
        cy.tick(10000);
        cy.get('@ping.all').should('have.length', count);
      });
    });

    it('never announces a connection that came back within the delay', () => {
      gladysDoesNotAnswer('/api/v1/ping').as('ping');
      loseTheLiveConnection();
      cy.tick(2000);
      authenticated();
      cy.tick(10000);
      cy.get(notice).should('not.exist');
      cy.get('@ping.all').should('have.length', 0);
    });

    it('sits at the bottom of the content on a desktop, away from the controls of the page', () => {
      gladysDoesNotAnswer('/api/v1/ping').as('ping');
      loseTheLiveConnection();
      cy.tick(4100);
      cy.wait('@ping');
      cy.get(notice).should('be.visible');
      cy.window().then(win => {
        // the page is padded by the width of the rail: what is left is the content column
        const contentLeft = parseFloat(win.getComputedStyle(win.document.querySelector('#app > .page')).paddingLeft);
        expect(contentLeft).to.be.greaterThan(100);
        cy.get(notice).then($notice => {
          const rect = $notice[0].getBoundingClientRect();
          // in the bottom half, inside the viewport
          expect(rect.top).to.be.greaterThan(win.innerHeight / 2);
          expect(rect.bottom).to.be.at.most(win.innerHeight);
          // centred on the content column, beside the rail (a scrollbar is not part of it)
          expect(rect.left).to.be.at.least(contentLeft);
          expect(
            Math.abs((rect.left + rect.right) / 2 - (contentLeft + win.document.documentElement.clientWidth) / 2)
          ).to.be.lessThan(2);
        });
      });
    });
  });

  describe('when the session check gets no answer', () => {
    it('says so at once, keeps the app while Gladys is down, and does not show an empty home', () => {
      gladysDoesNotAnswer('/api/v1/me').as('me');
      gladysDoesNotAnswer('/api/v1/dashboard').as('dashboards');
      gladysDoesNotAnswer('/api/v1/ping').as('pingRefused');
      cy.visit('/dashboard');
      cy.wait('@me');
      cy.get(notice)
        .should('be.visible')
        .and('have.attr', 'data-state', 'unreachable');
      // a dashboard that could not be loaded is not a home without widget
      cy.wait('@dashboards');
      cy.get('[data-cy=dashboard-load-error]').should('be.visible');
      cy.get('[data-cy=get-started-create-dashboard]').should('not.exist');

      // "Retry" while Gladys still does not answer: the app is kept, and says so
      cy.window().then(win => {
        win.pageBeforeRetry = true;
      });
      cy.get('[data-cy=connection-lost-notice-retry]')
        .i18n('header.connectionNoticeRetry')
        .click();
      cy.get('[data-cy=connection-lost-notice-text]').i18n('header.connectionNoticeStillUnreachable');
      cy.get('[data-cy=connection-lost-notice-retry]').should('have.attr', 'aria-disabled', 'false');
      cy.window()
        .its('pageBeforeRetry')
        .should('eq', true);

      // Gladys answers again: "Retry" reloads the app, which works
      gladysAnswers('/api/v1/me');
      gladysAnswers('/api/v1/dashboard');
      gladysAnswers('/api/v1/ping').as('ping');
      cy.get('[data-cy=connection-lost-notice-retry]').click();
      cy.wait('@ping');
      cy.window()
        .its('pageBeforeRetry')
        .should('not.exist');
      cy.get('[data-cy=sidebar-nav]').should('exist');
      cy.get(notice).should('not.exist');
    });

    it('reloads a dashboard by itself once Gladys answers, and only once', () => {
      cy.window().then(win => win.sessionStorage.removeItem(AUTO_RELOAD_KEY));
      gladysDoesNotAnswer('/api/v1/me').as('me');
      gladysDoesNotAnswer('/api/v1/ping').as('pingRefused');
      cy.visit('/dashboard');
      cy.wait('@me');
      cy.get(notice).should('have.attr', 'data-state', 'unreachable');
      cy.window().then(win => {
        win.pageBeforeReload = true;
      });

      // Gladys answers the next question of the notice: nobody presses anything
      gladysAnswers('/api/v1/ping').as('ping');
      cy.wait('@ping', { timeout: 10000 });
      cy.window()
        .its('pageBeforeReload')
        .should('not.exist');
      cy.window().then(win => {
        expect(win.sessionStorage.getItem(AUTO_RELOAD_KEY)).to.equal('1');
      });

      // the reloaded page still cannot load its session: the notice now offers the reload,
      // and does not reload again by itself
      cy.get(notice, { timeout: 10000 }).should('have.attr', 'data-state', 'interrupted');
      cy.window().then(win => {
        win.pageAfterReload = true;
      });
      // two more questions of the notice (one every 5 seconds)
      cy.wait('@ping', { timeout: 10000 });
      cy.wait('@ping', { timeout: 10000 });
      cy.window()
        .its('pageAfterReload')
        .should('eq', true);

      // the user reloads; the app is healthy again, a next trouble may reload it again
      gladysAnswers('/api/v1/me');
      cy.get('[data-cy=connection-lost-notice-retry]')
        .i18n('header.connectionNoticeReload')
        .click();
      cy.window()
        .its('pageAfterReload')
        .should('not.exist');
      cy.get('[data-cy=sidebar-nav]').should('exist');
      cy.get(notice).should('not.exist');
      cy.waitForWebSocket();
      authenticated();
      cy.window().should(win => {
        expect(win.sessionStorage.getItem(AUTO_RELOAD_KEY)).to.equal(null);
      });
    });

    it('does not reload a page where something may be lost', () => {
      gladysDoesNotAnswer('/api/v1/me').as('me');
      gladysAnswers('/api/v1/ping').as('ping');
      cy.visit('/dashboard/scene');
      cy.wait('@me');
      cy.wait('@ping');
      cy.get(notice).should('have.attr', 'data-state', 'interrupted');
      cy.window().then(win => {
        win.pageBeforeReload = true;
      });
      cy.wait('@ping', { timeout: 10000 });
      cy.wait('@ping', { timeout: 10000 });
      cy.window()
        .its('pageBeforeReload')
        .should('eq', true);
    });

    it('is not shown on the pages of someone who is signed out', () => {
      gladysDoesNotAnswer('/api/v1/me').as('me');
      gladysDoesNotAnswer('/api/v1/ping').as('ping');
      cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/session/*/revoke` }, { forceNetworkError: true }).as(
        'revoke'
      );
      cy.visit('/dashboard/scene');
      cy.wait('@me');
      cy.get(notice).should('be.visible');
      // signing out works while Gladys is down, and the notice does not follow to the sign-in
      cy.get('[data-cy=sidebar-profile]').click();
      cy.get('[data-cy=header-sign-out]').click();
      cy.location('pathname').should('eq', '/login');
      cy.get(notice).should('not.exist');
      forgetTheSessionOfTheRun();
    });

    it('stays out of the way of the top bar on a phone', () => {
      cy.viewport('iphone-x');
      gladysDoesNotAnswer('/api/v1/me').as('me');
      gladysDoesNotAnswer('/api/v1/ping').as('ping');
      cy.visit('/dashboard/scene');
      cy.wait('@me');
      cy.get(notice).should('be.visible');
      // the burger stays reachable: the notice sits below the top bar
      cy.get('[data-cy=sidebar-toggler]').then($toggler => {
        const togglerBottom = $toggler[0].getBoundingClientRect().bottom;
        cy.get(notice).then($notice => {
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
  });

  describe('signing out', () => {
    it('says that it is signing out, ignores a second tap, and signs out even without an answer', () => {
      // a revoke that is never answered
      cy.intercept(
        { method: 'POST', url: `${serverUrl}/api/v1/session/*/revoke` },
        { statusCode: 200, body: {}, delay: 120000 }
      ).as('revoke');
      cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/me` }).as('me');
      cy.visit('/dashboard/scene');
      cy.wait('@me');
      cy.get('[data-cy=sidebar-nav]').should('exist');
      cy.get('[data-cy=sidebar-profile]').click();
      cy.get('[data-cy=header-sign-out]')
        .i18n('header.signOut')
        .click();
      cy.get('[data-cy=header-sign-out]')
        .should('have.attr', 'aria-disabled', 'true')
        .i18n('header.signingOut');
      cy.get('[data-cy=header-sign-out]').click({ force: true });
      cy.get('@revoke.all').should('have.length', 1);
      cy.location('pathname').should('eq', '/dashboard/scene');
      // Gladys does not answer: after 5 seconds the device forgets the session anyway
      cy.location('pathname').should('eq', '/login');
      cy.window().then(win => {
        expect(win.localStorage.getItem('user')).to.equal(null);
      });
      forgetTheSessionOfTheRun();
    });
  });
});
