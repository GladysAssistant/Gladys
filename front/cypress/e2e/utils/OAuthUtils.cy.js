import {
  OAUTH_REDIRECT_URI,
  getAuthorizeUrlState,
  getOAuthCallbackPath,
  wrapAuthorizeUrl,
  wrapOAuthState,
} from '../../../src/utils/oauth';

// The authorize URL an integration would return for a Spotify account.
const authorizeUrl = (state = 'integration-anti-csrf') =>
  `https://accounts.spotify.com/authorize?response_type=code&client_id=abc&scope=user-read-playback-state&redirect_uri=${encodeURIComponent(
    OAUTH_REDIRECT_URI,
  )}&state=${encodeURIComponent(state)}`;

const decodeWrappedState = (wrapped) => {
  const base64 = wrapped.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder('utf-8').decode(bytes));
};

describe('OAuth2 redirect utils', () => {
  it('points at the HTTPS redirect page', () => {
    // this exact string is registered by users in their developer application:
    // changing it breaks every existing configuration
    expect(OAUTH_REDIRECT_URI).to.equal('https://my.gladysassistant.com/redirect/oauth');
  });

  it('builds the callback path of an integration', () => {
    expect(getOAuthCallbackPath('ext-dev-spotify')).to.equal(
      '/dashboard/integration/device/external/ext-dev-spotify/oauth-callback',
    );
  });

  it('wraps the state with the address to come back to', () => {
    const wrapped = wrapOAuthState({
      origin: 'http://192.168.1.50:1443',
      path: getOAuthCallbackPath('ext-dev-spotify'),
      state: 'integration-anti-csrf',
    });

    expect(decodeWrappedState(wrapped)).to.deep.equal({
      v: 1,
      origin: 'http://192.168.1.50:1443',
      path: '/dashboard/integration/device/external/ext-dev-spotify/oauth-callback',
      state: 'integration-anti-csrf',
    });
  });

  it('keeps a unicode state intact', () => {
    const wrapped = wrapOAuthState({ origin: 'http://192.168.1.50', path: '/callback', state: 'état-privé-🎵' });

    expect(decodeWrappedState(wrapped).state).to.equal('état-privé-🎵');
  });

  it('leaves every other parameter of the authorize URL untouched', () => {
    const url = new URL(
      wrapAuthorizeUrl(authorizeUrl(), {
        origin: 'http://192.168.1.50:1443',
        path: getOAuthCallbackPath('ext-dev-spotify'),
      }),
    );

    expect(url.origin + url.pathname).to.equal('https://accounts.spotify.com/authorize');
    expect(url.searchParams.get('client_id')).to.equal('abc');
    expect(url.searchParams.get('scope')).to.equal('user-read-playback-state');
    expect(url.searchParams.get('response_type')).to.equal('code');
    // the provider must keep seeing the redirect page, not the instance
    expect(url.searchParams.get('redirect_uri')).to.equal(OAUTH_REDIRECT_URI);
  });

  it('carries the instance address in the state of the authorize URL', () => {
    const url = new URL(
      wrapAuthorizeUrl(authorizeUrl(), {
        origin: 'http://192.168.1.50:1443',
        path: getOAuthCallbackPath('ext-dev-spotify'),
      }),
    );

    expect(decodeWrappedState(url.searchParams.get('state'))).to.deep.equal({
      v: 1,
      origin: 'http://192.168.1.50:1443',
      path: '/dashboard/integration/device/external/ext-dev-spotify/oauth-callback',
      state: 'integration-anti-csrf',
    });
  });

  it('reads the state of an authorize URL', () => {
    expect(getAuthorizeUrlState(authorizeUrl('abc'))).to.equal('abc');
  });

  it('refuses an authorize URL without a state', () => {
    // no state means no way back from the redirect page, and no anti-CSRF
    // protection either: fail on "Connect", not after the user consented
    expect(() => getAuthorizeUrlState('https://accounts.spotify.com/authorize?client_id=abc')).to.throw(
      'EXTERNAL_INTEGRATION_OAUTH_INVALID_STATE',
    );
  });

  it('refuses a state the redirect page would reject', () => {
    const tooLong = 's'.repeat(1025);

    expect(() => getAuthorizeUrlState(authorizeUrl(tooLong))).to.throw('EXTERNAL_INTEGRATION_OAUTH_INVALID_STATE');
    expect(() =>
      wrapAuthorizeUrl(authorizeUrl(tooLong), { origin: 'http://192.168.1.50:1443', path: '/callback' }),
    ).to.throw('EXTERNAL_INTEGRATION_OAUTH_INVALID_STATE');
  });
});
