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
 * displays its value before the request leaves. It is the state displayed before the command,
 * unless Gladys sends a newer one while the request is on its way (another screen, the device
 * itself): that one is the truth. One entry per request, so two requests on the same feature
 * never share or take each other's state.
 * @example
 * const command = statesToGoBackTo.start('lamp-binary', { last_value: 0 });
 * statesToGoBackTo.keepStateFromGladys('lamp-binary', { last_value: 1 });
 * statesToGoBackTo.finish(command); // { last_value: 1 }
 */
export class StatesToGoBackTo {
  commands = new Set();

  start(selector, state) {
    const command = { selector, state: { ...state } };
    this.commands.add(command);
    return command;
  }

  keepStateFromGladys(selector, state) {
    this.commands.forEach(command => {
      if (command.selector === selector) {
        command.state = { ...command.state, ...state };
      }
    });
  }

  // the request has settled: the state to go back to if it failed
  finish(command) {
    this.commands.delete(command);
    return command.state;
  }
}
