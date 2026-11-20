import uuid from 'uuid';

import { DEVICE_SET_VALUE_ERROR_CAUSES } from '../../../server/utils/constants';

// One id per open page (a tab, a wall tablet, the app on a phone), sent with every device
// command. When the device cannot be driven, Gladys tells every screen of the user so they all
// go back to the real state, and this id comes back with it: only the page which sent the
// command says that it failed (components/device/DeviceCommandError.jsx). A command sent
// without it (a script, an API key) shows a message nowhere.
export const COMMAND_CLIENT_ID = uuid.v4();

// The one cause only the front can tell: no answer came from Gladys. The command may not have
// been sent — or it was, and only the answer was lost (the route answers before the device is
// driven, a proxy can time out after Gladys took the request): the toast says "may not", never
// "was not". The other causes come from the server (DEVICE_SET_VALUE_ERROR_CAUSES).
export const GLADYS_UNREACHABLE_CAUSE = 'gladys-unreachable';

const UNREACHABLE_STATUSES = [502, 503, 504];

// No answer at all (Gladys stopped or restarting, network gone), the answer of a reverse proxy
// whose backend is down, or the Gladys Plus client giving up on its connection (it wraps every
// failure in a `response` whose status is then undefined).
export const getCommandNotSentCause = error => {
  const status = error && error.response ? error.response.status : undefined;
  if (typeof status !== 'number' || UNREACHABLE_STATUSES.includes(status)) {
    return GLADYS_UNREACHABLE_CAUSE;
  }
  // Gladys answered, and refused the request
  return DEVICE_SET_VALUE_ERROR_CAUSES.REFUSED;
};

// The one way the front sends a value to a device feature
export const sendDeviceFeatureValue = (httpClient, deviceFeatureSelector, value) =>
  httpClient.post(`/api/v1/device_feature/${deviceFeatureSelector}/value`, {
    value,
    client_id: COMMAND_CLIENT_ID
  });

/**
 * @description The state to go back to when a command cannot be sent, for a widget which
 * displays its value before the request leaves. It is kept per feature, while requests for it
 * are on their way: the state displayed before the first of them (never the optimistic value of
 * another one: two controls can drive the same feature), unless Gladys sends a newer one
 * meanwhile (another screen, the device itself), which is the truth. Each request has its own
 * token, and the state is dropped once the last of them has settled.
 * @example
 * const command = statesToGoBackTo.start('lamp-binary', { last_value: 0 });
 * statesToGoBackTo.keepStateFromGladys('lamp-binary', { last_value: 1 });
 * statesToGoBackTo.finish(command); // { last_value: 1 }
 */
export class StatesToGoBackTo {
  features = new Map();

  start(selector, displayedState) {
    let feature = this.features.get(selector);
    if (!feature) {
      feature = { state: { ...displayedState }, requests: 0 };
      this.features.set(selector, feature);
    }
    feature.requests += 1;
    return { selector };
  }

  keepStateFromGladys(selector, state) {
    const feature = this.features.get(selector);
    if (feature) {
      feature.state = { ...feature.state, ...state };
    }
  }

  // the request has settled: the state to go back to if it failed
  finish(command) {
    const feature = this.features.get(command.selector);
    feature.requests -= 1;
    if (feature.requests === 0) {
      this.features.delete(command.selector);
    }
    return feature.state;
  }
}
