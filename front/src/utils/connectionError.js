import get from 'get-value';
import config from '../config';

// Tells a request that failed because Gladys could not be reached from one Gladys answered
// with a refusal. The first one is nobody's fault on the page: it is announced by the
// "Gladys is unreachable" notice (components/header/ConnectionLostNotice.jsx) or, on the
// sign-in page, by its own sentence — never as "wrong email/password".

// What a reverse proxy answers in place of a Gladys that is stopped or restarting
const GATEWAY_STATUSES = [502, 503, 504];

// How a call made through Gladys Plus ends when the connection of the browser to Gladys Plus
// is lost (GatewayHttpClient). NO_CONNECTED_TO_THE_INTERNET is not one of them: it is the
// instance saying that it cannot reach Gladys Plus, and the pages that can get it have their
// own sentence for it.
const GLADYS_PLUS_CONNECTION_ERRORS = [
  'GATEWAY_CONNECTION_LOST',
  'GATEWAY_CONNECTION_TIMEOUT',
  'GATEWAY_REQUEST_TIMEOUT'
];

// How long Gladys is given to answer the question "are you there?"
const REACHABLE_TIMEOUT_MS = 5 * 1000;

// The HTTP status of the answer, if there was one. The Gladys Plus client wraps every
// failure as { response: { status, data } }, where data is the original error and status
// is undefined when no answer came back: a response without a number is not an answer.
const getStatus = e => {
  const status = get(e, 'response.status');
  return typeof status === 'number' ? status : undefined;
};

// Every error Gladys writes is a JSON object with a `code` (server/utils/httpErrors.js).
// Anything else under an error status was written by something in front of Gladys: the
// 404 of a reverse proxy whose route went away with the container, the HTML page of a
// tunnel whose origin is down...
const isWrittenByGladys = e => typeof get(e, 'response.data.code') === 'string';

// True when the request never got an answer from Gladys: the browser could not connect, the
// request timed out, something else answered in its place, or the Gladys Plus connection
// was lost. An error thrown by the page itself (no request involved) is not one.
export const isUnreachableError = e => {
  if (!e) {
    return false;
  }
  // Gladys Plus: the error itself, or the one wrapped by GatewayHttpClient
  if ([e.message, get(e, 'response.data.message')].some(message => GLADYS_PLUS_CONNECTION_ERRORS.includes(message))) {
    return true;
  }
  const status = getStatus(e);
  if (status !== undefined) {
    if (GATEWAY_STATUSES.includes(status)) {
      return true;
    }
    // "Too many requests" is the one answer of Gladys that has no code (rate limiter).
    // Through Gladys Plus the answers have other shapes: only the statuses above tell.
    return !config.gatewayMode && status !== 429 && !isWrittenByGladys(e);
  }
  if (e.response) {
    // Gladys Plus: a failure that is not a lost connection
    return false;
  }
  // axios: the request left (or tried to) and no response came back
  return e.isAxiosError === true || e.request !== undefined;
};

// True when Gladys answered, with an error of its own (5xx)
export const isServerError = e => {
  const status = getStatus(e);
  return status !== undefined && status >= 500 && !isUnreachableError(e);
};

export const isTooManyRequestsError = e => getStatus(e) === 429;

// A request that gives up: on a host that is powered off behind a routed path, packets are
// dropped rather than refused, and the browser would wait for minutes. The deadline also
// covers `read`, which reads the answer: headers can come back and the body never follow.
const fetchWithTimeout = async (url, options, read) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REACHABLE_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, cache: 'no-store', signal: controller.signal });
    return await read(response);
  } finally {
    clearTimeout(timeout);
  }
};

// Resolves with whether Gladys answers right now — which is also whether reloading the page
// will bring the app back: in production the front is served by Gladys itself, and
// reloading while it is down would trade the app for the error page of the browser, from
// which a wall-mounted tablet never comes back. Never rejects, never waits more than a few
// seconds.
export const isGladysReachable = async () => {
  try {
    if (config.gatewayMode) {
      // The Gladys Plus front is a hosted site: what a reload needs is that site. The
      // connection to the instance is restored by the reloaded app.
      if (navigator.onLine === false) {
        return false;
      }
      // a site that answers with an error would be reloaded into that error
      return await fetchWithTimeout(`${window.location.origin}/`, { method: 'HEAD' }, response => response.ok);
    }
    return await fetchWithTimeout(`${config.localApiUrl}/api/v1/ping`, { method: 'GET' }, async response => {
      if (!response.ok) {
        return false;
      }
      // the maintenance page of a proxy answers 200 too: only Gladys answers this
      const body = await response.json();
      return body.status === 200;
    });
  } catch (e) {
    return false;
  }
};
