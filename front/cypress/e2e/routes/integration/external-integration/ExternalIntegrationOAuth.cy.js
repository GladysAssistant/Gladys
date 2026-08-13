// Real flow through the configuration screen of an external integration: the
// integration itself is stubbed (it would need an installed Docker container),
// everything else is the real app — routing, session, components, and the
// actual request sent to the server.
const SELECTOR = 'ext-dev-spotify';
const CONFIG_URL = `/dashboard/integration/device/external/${SELECTOR}/config`;
const REDIRECT_URI = 'https://my.gladysassistant.com/redirect/oauth';
const CALLBACK_PATH = `/dashboard/integration/device/external/${SELECTOR}/oauth-callback`;
const INTEGRATION_STATE = 'integration-anti-csrf';

const INTEGRATION = {
  id: '0e0a17d0-cd7b-4f79-b0b7-7f3d0e0b4a01',
  name: 'Spotify',
  selector: SELECTOR,
  type: 'external',
  status: 'RUNNING',
  running: true,
  version: '1.0.0',
  store_slug: 'spotify',
  granted_devices: [],
  connection_status: { connected: false },
  manifest: {
    name: 'Spotify',
    type: 'device',
    version: '1.0.0',
    config_schema: [
      {
        key: 'spotify_account',
        type: 'oauth2',
        label: { en: 'Spotify account', fr: 'Compte Spotify' },
      },
    ],
  },
};

const decodeWrappedState = (wrapped) => {
  const base64 = wrapped.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder('utf-8').decode(bytes));
};

describe('External integration - OAuth2 connection', () => {
  beforeEach(() => {
    cy.login();

    cy.intercept('GET', `**/api/v1/external_integration/${SELECTOR}`, INTEGRATION).as('getIntegration');
    cy.intercept('GET', `**/api/v1/external_integration/${SELECTOR}/config`, {
      config: {},
      configured_secrets: [],
    }).as('getConfig');
    cy.intercept('POST', `**/api/v1/external_integration/${SELECTOR}/oauth/authorize_url`, {
      authorize_url: `https://accounts.spotify.com/authorize?response_type=code&client_id=abc&scope=user-read-playback-state&redirect_uri=${encodeURIComponent(
        REDIRECT_URI,
      )}&state=${INTEGRATION_STATE}`,
    }).as('getAuthorizeUrl');
  });

  it('shows the redirect URI to declare at the provider', () => {
    cy.visit(CONFIG_URL);
    cy.wait('@getIntegration');

    cy.get('.input-group input[readonly]').should('have.value', REDIRECT_URI);
    // the copy button must be there even on a plain-HTTP instance, which is
    // exactly the audience of this flow
    cy.get('.input-group .btn .fe-copy').should('exist');
  });

  it('asks the integration for an authorize URL with the redirect page as redirect_uri', () => {
    cy.visit(CONFIG_URL);
    cy.wait('@getIntegration');

    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen');
    });

    cy.contains('button', 'integration.externalIntegration.config.oauthConnectButton').click();

    cy.wait('@getAuthorizeUrl').then(({ request }) => {
      expect(request.body.key).to.equal('spotify_account');
      expect(request.body.redirect_uri).to.equal(REDIRECT_URI);
    });
  });

  it('opens the provider with the instance address wrapped in the state', () => {
    cy.visit(CONFIG_URL);
    cy.wait('@getIntegration');

    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen');
    });

    cy.contains('button', 'integration.externalIntegration.config.oauthConnectButton').click();
    cy.wait('@getAuthorizeUrl');

    cy.get('@windowOpen').should('have.been.called');
    cy.get('@windowOpen').then((open) => {
      const url = new URL(open.getCall(0).args[0]);

      // nothing of the provider URL may be altered except the state
      expect(url.origin + url.pathname).to.equal('https://accounts.spotify.com/authorize');
      expect(url.searchParams.get('client_id')).to.equal('abc');
      expect(url.searchParams.get('redirect_uri')).to.equal(REDIRECT_URI);

      expect(decodeWrappedState(url.searchParams.get('state'))).to.deep.equal({
        v: 1,
        origin: window.location.origin,
        path: CALLBACK_PATH,
        state: INTEGRATION_STATE,
      });
    });
  });

  it('stores the redirect URI so the token exchange sends back the same one', () => {
    cy.visit(CONFIG_URL);
    cy.wait('@getIntegration');

    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen');
    });

    cy.contains('button', 'integration.externalIntegration.config.oauthConnectButton').click();
    cy.wait('@getAuthorizeUrl');

    // written right after the response is handled: retry instead of asserting
    // on the same tick as the intercept
    cy.window().should((win) => {
      expect(win.localStorage.getItem(`externalIntegrationOAuthKey:${SELECTOR}`)).to.equal('spotify_account');
      expect(win.localStorage.getItem(`externalIntegrationOAuthRedirectUri:${SELECTOR}`)).to.equal(REDIRECT_URI);
    });
  });

  it('refuses an authorize URL without a state instead of dead-ending after consent', () => {
    cy.intercept('POST', `**/api/v1/external_integration/${SELECTOR}/oauth/authorize_url`, {
      authorize_url: 'https://accounts.spotify.com/authorize?response_type=code&client_id=abc',
    }).as('getAuthorizeUrlWithoutState');

    cy.visit(CONFIG_URL);
    cy.wait('@getIntegration');

    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen');
    });

    cy.contains('button', 'integration.externalIntegration.config.oauthConnectButton').click();
    cy.wait('@getAuthorizeUrlWithoutState');

    cy.get('.alert-danger').should('exist').i18n('integration.externalIntegration.config.oauthInvalidStateError');
    cy.get('@windowOpen').should('not.have.been.called');
  });

  it('copies the redirect URI without the clipboard API, as a plain-HTTP instance has to', () => {
    cy.visit(CONFIG_URL);
    cy.wait('@getIntegration');

    cy.window().then((win) => {
      // navigator.clipboard only exists in a secure context: force the legacy
      // path the LAN users of this flow will actually take
      cy.stub(win.navigator.clipboard, 'writeText').rejects(new Error('not allowed'));
      cy.stub(win.document, 'execCommand').returns(true).as('execCommand');
    });

    cy.get('.input-group .btn').click();

    cy.get('@execCommand').should('have.been.calledWith', 'copy');
    cy.contains('integration.externalIntegration.config.oauthRedirectUriCopied').should('exist');
  });
});
