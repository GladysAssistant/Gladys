import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../server/utils/constants';
import MobileToast from '../mobile/MobileToast';

const TOAST_DURATION_MS = 6000;

/**
 * @description Tells the user that a value they asked for could not be set on a device, on
 * whatever page they are, and puts every widget back on the state Gladys really holds.
 *
 * A widget shows the value as soon as it is asked for, and the request is answered before the
 * device is driven: without this, a light which did not answer stays "on" on the screen. The
 * failure comes as a `device.set-value-error` message — from the server when the device could
 * not be driven, or dispatched locally by a widget when the request itself could not be sent.
 * It carries the real state of the feature, which is handed to the widgets as a state update
 * flagged `rollback`: they all know how to display a state, none has to know about failures.
 */
class DeviceCommandError extends Component {
  state = {
    failure: null,
    toastKey: 0
  };

  onSetValueError = payload => {
    const { dispatcher } = this.props.session;
    if (payload.device_feature_selector) {
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
    }
    this.setState(({ toastKey }) => ({
      failure: { name: payload.device_name || payload.device_feature_name || null },
      toastKey: toastKey + 1
    }));
  };

  closeToast = () => this.setState({ failure: null });

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

  render(props, { failure, toastKey }) {
    let message = null;
    if (failure) {
      message = failure.name ? (
        <Text id="device.setValueError" fields={{ name: failure.name }} />
      ) : (
        <Text id="device.setValueErrorUnknownDevice" />
      );
    }
    return (
      <MobileToast
        message={message}
        toastKey={toastKey}
        duration={TOAST_DURATION_MS}
        onClose={this.closeToast}
        dataCy="device-command-error"
      />
    );
  }
}

export default connect('session', {})(DeviceCommandError);
