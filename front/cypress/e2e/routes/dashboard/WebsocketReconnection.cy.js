// The live connection of the session (utils/Session.js) in local mode: a websocket that
// closes, or that cannot be opened, is tried again until Gladys is back; a refused access token
// is renewed; a refused renewal takes the user where they have to go; a session that was closed
// keeps nothing running.
//
// The websocket is a fake one: the test decides when a socket opens, what it receives and when
// it closes. Time is the one of the test too wherever a delay is checked.
describe('Websocket reconnection', () => {
  const serverUrl = Cypress.env('serverUrl');
  const websocketUrl = Cypress.env('websocketUrl');
  const dashboardSelector = 'websocket-reconnection';

  // Replaces the websocket of the page: every socket the session opens is kept in
  // win.gladysSockets, with what was sent on it and whether the session closed it. While the
  // page loads, Gladys accepts every socket by itself (the load may take longer than the
  // session waits for a socket to open); from then on the test decides.
  const installFakeWebSocket = win => {
    const PreviousWebSocket = win.WebSocket;
    win.gladysSockets = [];
    win.gladysAcceptsSockets = true;
    win.WebSocket = function FakeWebSocket(url, protocols) {
      // the websocket of the dev server of the front, if any, is left alone
      if (!String(url).startsWith(websocketUrl)) {
        return new PreviousWebSocket(url, protocols);
      }
      const socket = {
        url,
        sent: [],
        closed: false,
        send(data) {
          this.sent.push(JSON.parse(data));
        },
        close() {
          this.closed = true;
        }
      };
      win.gladysSockets.push(socket);
      if (win.gladysAcceptsSockets) {
        // once the session has set its handlers
        Promise.resolve().then(() => {
          socket.onopen();
          socket.onmessage({ data: JSON.stringify({ type: 'authentication.connected', payload: {} }) });
        });
      }
      return socket;
    };
  };

  const sockets = () => cy.window().its('gladysSockets');
  const socketAt = index => sockets().its(index);
  const socketCountShouldBe = count => sockets().should('have.length', count);

  // Gladys accepts the socket: it opens, the session sends its access token, Gladys answers
  const openAndAuthenticate = index => {
    socketAt(index).then(socket => {
      socket.onopen();
      expect(socket.sent[0].type).to.equal('authenticate.request');
      socket.onmessage({ data: JSON.stringify({ type: 'authentication.connected', payload: {} }) });
    });
  };

  const closeSocket = (index, event = { code: 1006, reason: '' }) => {
    socketAt(index).then(socket => socket.onclose(event));
  };

  const visitDashboard = () => {
    cy.visit(`/dashboard/${dashboardSelector}`, { onBeforeLoad: installFakeWebSocket });
    cy.get('[data-cy=sidebar-nav]').should('exist');
    socketCountShouldBe(1);
    socketAt(0)
      .its('sent.0.type')
      .should('eq', 'authenticate.request');
    cy.window().then(win => {
      win.gladysAcceptsSockets = false;
    });
  };

  // No spread on the delays: with 0.5 the jitter is exactly zero
  const freezeTimeAndJitter = () => {
    cy.clock();
    cy.window().then(win => {
      cy.stub(win.Math, 'random').returns(0.5);
    });
  };

  beforeEach(() => {
    cy.login();
    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/dashboard`,
      body: {
        name: 'Websocket reconnection',
        type: 'test',
        selector: dashboardSelector,
        visibility: 'private',
        boxes: [[{ type: 'user-presence', users: ['tony'] }]]
      }
    });
  });

  afterEach(() => {
    // The page is left before the next test signs in: with a token Gladys does not know, the
    // app of this test would end up closing its session, and clear the storage of the next one
    cy.window().then(win => {
      win.location.href = 'about:blank';
    });
    cy.request({
      method: 'DELETE',
      url: `${serverUrl}/api/v1/dashboard/${dashboardSelector}`
    });
  });

  it('tries again with a growing delay until Gladys is back, then reloads what is displayed', () => {
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/user*` }).as('usersPresence');
    visitDashboard();
    cy.wait('@usersPresence');
    freezeTimeAndJitter();

    // Gladys stops: the socket closes
    closeSocket(0);
    socketAt(0)
      .its('closed')
      .should('eq', true);
    socketCountShouldBe(1);

    // 1 second, then 2, 4, 8 and every 10 seconds: each attempt fails, the next one is later
    [1000, 2000, 4000, 8000, 10000, 10000].forEach((delay, attempt) => {
      cy.tick(delay - 1);
      socketCountShouldBe(attempt + 1);
      cy.tick(1);
      socketCountShouldBe(attempt + 2);
      if (attempt < 5) {
        // Gladys is still down: the socket never opens
        closeSocket(attempt + 1);
      }
    });

    // Gladys is back: the 7th socket opens and is accepted
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/user*` }).as('usersPresenceReloaded');
    openAndAuthenticate(6);
    // the widget asks again for what it missed
    cy.wait('@usersPresenceReloaded');
    // one live socket, the six others were let go of
    sockets().then(all => {
      expect(all.map(socket => socket.closed)).to.deep.equal([true, true, true, true, true, true, false]);
    });
    // and nothing else is planned
    cy.tick(60 * 1000);
    socketCountShouldBe(7);
  });

  it('gives up an attempt that never opens, and tries again at once when the network is back', () => {
    visitDashboard();
    freezeTimeAndJitter();
    closeSocket(0);
    cy.tick(1000);
    socketCountShouldBe(2);

    // the machine is rebooting: nothing answers, the socket neither opens nor closes
    cy.tick(10 * 1000 - 1);
    socketCountShouldBe(2);
    cy.tick(1);
    socketAt(1)
      .its('closed')
      .should('eq', true);
    // given up like a closed socket: the next attempt comes after the next delay
    cy.tick(2000);
    socketCountShouldBe(3);

    // the browser is back on the network while this attempt is still waiting: a new one starts
    // on that network, without waiting for the 10 seconds
    cy.window().then(win => win.dispatchEvent(new win.Event('online')));
    socketCountShouldBe(4);
    socketAt(2)
      .its('closed')
      .should('eq', true);

    // and while a delay is running, the page coming back on screen cuts it short
    closeSocket(3);
    socketCountShouldBe(4);
    cy.window().then(win => win.document.dispatchEvent(new win.Event('visibilitychange')));
    socketCountShouldBe(5);
    openAndAuthenticate(4);
    cy.tick(60 * 1000);
    socketCountShouldBe(5);
  });

  it('renews a refused access token once, and connects again', () => {
    let renewals = 0;
    // the page has finished loading: a request sent while the token is being renewed would
    // ask for a renewal of its own
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/user*` }).as('usersPresence');
    visitDashboard();
    cy.wait('@usersPresence');
    // the token Gladys gives back is the one of the test session: everything the page asks for
    // afterwards is accepted, and a second renewal could only come from the reconnection
    cy.task('loadVariable', 'tony').then(tony => {
      cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/access_token` }, req => {
        renewals += 1;
        expect(req.body.refresh_token).to.equal(tony.refresh_token);
        req.reply({ access_token: tony.access_token });
      }).as('renewal');

      // Gladys restarted and no longer knows the token. The reason of the close is lost on
      // the way (a reverse proxy): the code is enough
      closeSocket(0, { code: 4000, reason: '' });
      cy.wait('@renewal');
      socketCountShouldBe(2);
      cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/user*` }).as('usersPresenceReloaded');
      socketAt(1).then(socket => {
        socket.onopen();
        expect(socket.sent[0]).to.deep.equal({
          type: 'authenticate.request',
          payload: { accessToken: tony.access_token }
        });
        socket.onmessage({ data: JSON.stringify({ type: 'authentication.connected', payload: {} }) });
      });
      cy.wait('@usersPresenceReloaded');
      cy.then(() => {
        expect(renewals).to.equal(1);
      });
      socketCountShouldBe(2);
    });
  });

  it('renews the access token when the socket closes right after it sent it, whatever the close says', () => {
    visitDashboard();
    cy.intercept(
      { method: 'POST', url: `${serverUrl}/api/v1/access_token` },
      { access_token: 'renewed-access-token' }
    ).as('renewal');
    // a first loss, then a socket that opens, sends the token and is closed without a word
    closeSocket(0);
    socketCountShouldBe(2);
    socketAt(1).then(socket => {
      socket.onopen();
      socket.onclose({ code: 1006, reason: '' });
    });
    cy.wait('@renewal');
    socketCountShouldBe(3);
    socketAt(2).then(socket => {
      socket.onopen();
      expect(socket.sent[0].payload.accessToken).to.equal('renewed-access-token');
    });
  });

  it('sends the user to the sign-in page when Gladys refuses to renew the token', () => {
    visitDashboard();
    // the session was revoked (password changed on another device, session revoked from the
    // sessions page): Gladys refuses the token, then its renewal
    cy.intercept(
      { method: 'POST', url: `${serverUrl}/api/v1/access_token` },
      { statusCode: 401, body: { status: 401, code: 'UNAUTHORIZED', message: 'Session was revoked' } }
    ).as('renewal');
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/me` }).as('sessionCheck');
    freezeTimeAndJitter();
    closeSocket(0, { code: 4000, reason: 'INVALID_ACCESS_TOKEN' });
    // a refused token is renewed at once
    cy.tick(1);
    cy.wait('@renewal');
    // the app checks the session again, which is refused too
    cy.wait('@sessionCheck');
    cy.location('pathname').should('eq', '/login');
    cy.location('search').should('contain', encodeURIComponent(`/dashboard/${dashboardSelector}`));
    // the session is closed: nothing is kept, and nothing tries again
    cy.window().then(win => {
      expect(win.localStorage.getItem('user')).to.equal(null);
    });
    socketCountShouldBe(1);
    cy.get('@renewal.all').then(renewals => {
      cy.tick(5 * 60 * 1000);
      socketCountShouldBe(1);
      cy.get('@renewal.all').should('have.length', renewals.length);
    });
  });

  it('sends a tablet locked in the meantime to the keypad, which connects it again', () => {
    visitDashboard();
    // the alarm was armed while the tablet was away: Gladys only gives it a token for the keypad
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/access_token` }, req => {
      if (req.body.scope.includes('alarm:write')) {
        req.reply({ access_token: 'keypad-access-token' });
      } else {
        req.reply({ statusCode: 401, body: { status: 401, code: 'UNAUTHORIZED', message: 'TABLET_IS_LOCKED' } });
      }
    }).as('renewal');
    closeSocket(0, { code: 4000, reason: 'INVALID_ACCESS_TOKEN' });
    cy.location('pathname').should('eq', '/locked');
    // the keypad asks for its own token, and the session connects again with it: the keypad
    // hears that the alarm was disarmed
    socketCountShouldBe(2);
    socketAt(1).then(socket => {
      socket.onopen();
      expect(socket.sent[0].payload.accessToken).to.equal('keypad-access-token');
    });
  });

  describe('once signed out', () => {
    // signing out for real would revoke the session every other spec uses
    const stubRevoke = () => {
      cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/session/*/revoke` }, { success: true }).as('revoke');
    };
    const signOut = () => {
      cy.contains('a.dropdown-item', 'header.signOut').click({ force: true });
      cy.wait('@revoke');
      cy.location('pathname').should('eq', '/login');
    };

    it('closes the socket, and none comes back', () => {
      stubRevoke();
      visitDashboard();
      freezeTimeAndJitter();
      signOut();
      socketAt(0)
        .its('closed')
        .should('eq', true);
      cy.window().then(win => {
        expect(win.localStorage.getItem('user')).to.equal(null);
        // what used to wake the connection up no longer does
        win.dispatchEvent(new win.Event('online'));
        win.document.dispatchEvent(new win.Event('visibilitychange'));
        // and the socket that was closed starts nothing when its closing is told
        win.gladysSockets[0].onclose({ code: 1006, reason: '' });
      });
      cy.tick(5 * 60 * 1000);
      socketCountShouldBe(1);
    });

    it('keeps nothing of a renewal of the token answered after the sign-out', () => {
      let answerRenewal;
      stubRevoke();
      visitDashboard();
      // the renewal is asked, and Gladys takes its time
      cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/access_token` }, req => {
        return new Promise(resolve => {
          answerRenewal = () => {
            req.reply({ access_token: 'late-access-token' });
            resolve();
          };
        });
      }).as('renewal');
      freezeTimeAndJitter();
      closeSocket(0, { code: 4000, reason: 'INVALID_ACCESS_TOKEN' });
      cy.tick(1);
      cy.wrap(null).should(() => {
        expect(answerRenewal).to.be.a('function');
      });
      signOut();
      // the answer comes now, for a session that no longer exists
      cy.then(() => answerRenewal());
      cy.wait('@renewal');
      cy.location('pathname').should('eq', '/login');
      cy.window().then(win => {
        expect(win.localStorage.getItem('user')).to.equal(null);
      });
      socketCountShouldBe(1);
      cy.tick(5 * 60 * 1000);
      socketCountShouldBe(1);
    });
  });
});
