import config from '../config';

// Tells a request that failed because Gladys could not be reached from one Gladys answered
// with a refusal. The first one is nobody's fault on the page: it is announced by the
// "Gladys is unreachable" notice (components/header/ConnectionLostNotice.jsx) or, on the
// sign-in page, by its own sentence — never as "wrong email/password".

// What a reverse proxy answers in place of a Gladys that is stopped or restarting
const GATEWAY_STATUSES = [502, 503, 504];

// How a call made through Gladys Plus ends when the connection is lost (GatewayHttpClient)
const GLADYS_PLUS_CONNECTION_ERRORS = [
  'GATEWAY_CONNECTION_LOST',
  'GATEWAY_CONNECTION_TIMEOUT',
  'GATEWAY_REQUEST_TIMEOUT',
  'NO_CONNECTED_TO_THE_INTERNET'
];

const getStatus = e => (e && e.response ? e.response.status : undefined);

// True when the request never got an answer from Gladys: the browser could not connect, the
// request timed out, a proxy answered for a Gladys that is down, or the Gladys Plus
// connection was lost. An error thrown by the page itself (no request involved) is not one.
export const isUnreachableError = e => {
  if (!e) {
    return false;
  }
  const status = getStatus(e);
  if (status !== undefined) {
    return GATEWAY_STATUSES.includes(status);
  }
  if (GLADYS_PLUS_CONNECTION_ERRORS.includes(e.message)) {
    return true;
  }
  // axios: the request left (or tried to) and no response came back
  return e.isAxiosError === true || e.request !== undefined;
};

// True when Gladys answered, with an error of its own (5xx)
export const isServerError = e => {
  const status = getStatus(e);
  return status !== undefined && status >= 500 && !GATEWAY_STATUSES.includes(status);
};

export const isTooManyRequestsError = e => getStatus(e) === 429;

// "Retry" of the notice: resolves with whether reloading the page will bring the app back.
// Reloading while Gladys is still down would trade the app for the error page of the
// browser — in production the front is served by Gladys itself — and a wall-mounted tablet
// would never come back from it. Never rejects.
export const canReloadApp = async httpClient => {
  try {
    if (config.gatewayMode) {
      // The Gladys Plus front is a hosted site: what a reload needs is that site. The
      // connection to the instance is restored by the reloaded app.
      if (navigator.onLine === false) {
        return false;
      }
      await fetch(`${window.location.origin}/`, { method: 'HEAD', cache: 'no-store' });
      return true;
    }
    await httpClient.get('/api/v1/ping');
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};
