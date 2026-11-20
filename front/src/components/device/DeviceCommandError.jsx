import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import { WEBSOCKET_MESSAGE_TYPES, DEVICE_SET_VALUE_ERROR_CAUSES } from '../../../../server/utils/constants';
import { COMMAND_CLIENT_ID, GLADYS_UNREACHABLE_CAUSE } from '../../utils/deviceCommand';
import MobileToast from '../mobile/MobileToast';

const TOAST_DURATION_MS = 6000;

// The sentence of each cause, when the toast is about one device
const SENTENCE_BY_CAUSE = {
  [DEVICE_SET_VALUE_ERROR_CAUSES.UNREACHABLE]: 'unreachable',
  [DEVICE_SET_VALUE_ERROR_CAUSES.NOT_CONFIGURED]: 'notConfigured',
  [DEVICE_SET_VALUE_ERROR_CAUSES.NOT_FOUND]: 'notFound',
  [DEVICE_SET_VALUE_ERROR_CAUSES.REFUSED]: 'refused',
  [GLADYS_UNREACHABLE_CAUSE]: 'gladysUnreachable'
};
// The sentences which name no device: a device which no longer exists has no name to give, and
// Gladys being unreachable is not about the device
const SENTENCES_WITHOUT_NAME = ['notFound', 'gladysUnreachable'];

/**
 * @description Tells the user that a value they asked for could not be set on a device, on
 * whatever page they are, and puts every widget back on the state Gladys really holds.
 *
 * A widget shows the value as soon as it is asked for, and the request is answered before the
 * device is driven: without this, a light which did not answer stays "on" on the screen. The
 * failure comes as a `device.set-value-error` message — from the server when the device could
 * not be driven, or dispatched locally by a widget when the request itself could not be sent.
 *
 * - The state: the message carries the real state of the feature, which is handed to the
 *   widgets as a state update flagged `rollback`. They all know how to display a state, none
 *   has to know about failures. Every screen of the user does this.
 * - The message: only the page which sent the command shows it (`client_id`, see
 *   utils/deviceCommand.js) — not the wall tablet signed in with the same account, and no
 *   screen at all for a command sent by a script. It says why (`cause`), and counts the devices
 *   when several commands fail together (every light of a room).
 */
class DeviceCommandError extends Component {
  state = {
    // the failures the toast on screen is about, one per device
    failures: [],
    toastKey: 0
  };

  rollback = payload => {
    const { dispatcher } = this.props.session;
    if (!payload.device_feature_selector) {
      return;
    }
    // A feature holds a number or a text. `null` is a state too — the feature never had
    // any — unlike `undefined`: the sender does not know the state to go back to.
    const hasTextState = typeof payload.last_value_string === 'string';
    if (typeof payload.last_value === 'number' || (payload.last_value === null && !hasTextState)) {
      dispatcher.dispatch(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE, {
        device_feature_selector: payload.device_feature_selector,
        last_value: payload.last_value,
        last_value_changed: payload.last_value_changed,
        rollback: true
      });
    }
    if (hasTextState) {
      dispatcher.dispatch(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STRING_STATE, {
        device_feature: payload.device_feature_selector,
        last_value_string: payload.last_value_string,
        last_value_changed: payload.last_value_changed,
        rollback: true
      });
    }
  };

  onSetValueError = payload => {
    this.rollback(payload);
    if (payload.client_id !== COMMAND_CLIENT_ID) {
      return;
    }
    const failure = {
      // two failed commands on the same device are one failure to tell
      device: payload.device_selector || payload.device_name || payload.device_feature_selector,
      name: payload.device_name || payload.device_feature_name || null,
      sentence: SENTENCE_BY_CAUSE[payload.cause] || 'unreachable'
    };
    this.setState(({ failures, toastKey }) => ({
      failures: [...failures.filter(({ device }) => device !== failure.device), failure],
      toastKey: toastKey + 1
    }));
  };

  closeToast = () => this.setState({ failures: [] });

  listen = session => {
    if (session && session.dispatcher) {
      session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.SET_VALUE_ERROR, this.onSetValueError);
    }
  };

  stopListening = session => {
    if (session && session.dispatcher) {
      session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.SET_VALUE_ERROR, this.onSetValueError);
    }
  };

  componentDidMount() {
    this.listen(this.props.session);
  }

  componentDidUpdate(previousProps) {
    if (previousProps.session !== this.props.session) {
      this.stopListening(previousProps.session);
      this.listen(this.props.session);
    }
  }

  componentWillUnmount() {
    this.stopListening(this.props.session);
  }

  getMessage = failures => {
    if (failures.length === 0) {
      return null;
    }
    const [{ name, sentence }] = failures;
    const sameCause = failures.every(failure => failure.sentence === sentence);
    if (failures.length > 1) {
      // Gladys unreachable is one cause for all of them; anything else is told by its number
      return sameCause && sentence === 'gladysUnreachable' ? (
        <Text id="device.setValueError.gladysUnreachableSeveral" />
      ) : (
        <Text id="device.setValueError.several" fields={{ count: failures.length }} />
      );
    }
    if (!name && !SENTENCES_WITHOUT_NAME.includes(sentence)) {
      return <Text id="device.setValueError.unknownDevice" />;
    }
    return <Text id={`device.setValueError.${sentence}`} fields={{ name }} />;
  };

  render(props, { failures, toastKey }) {
    return (
      <MobileToast
        message={this.getMessage(failures)}
        toastKey={toastKey}
        duration={TOAST_DURATION_MS}
        onClose={this.closeToast}
        role="alert"
        aboveDock
        dismissable
        dataCy="device-command-error"
      />
    );
  }
}

export default connect('session', {})(DeviceCommandError);
