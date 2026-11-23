import { Component, Fragment } from 'preact';
import { connect } from 'unistore/preact';
import { Localizer, Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../server/utils/constants';
import { MAX_TTS_TEXT_LENGTH } from '../../../../../../server/lib/external-integration/constants';
import { COMMAND_CLIENT_ID } from '../../../../utils/deviceCommand';
import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import BottomSheet from '../../../sheet/BottomSheet';
import MobileField, { fieldClass } from '../../../mobile/MobileField';
import { BigButton } from '../../../mobile/MobileBottomBar';
import MobileToast from '../../../mobile/MobileToast';
import style from './style.css';

const SENT_TOAST_DURATION_MS = 3000;
// the texts on their way that a failure can still give back, the oldest forgotten first
const MAX_TEXTS_ON_THEIR_WAY = 10;

// A phone shows its keyboard only for a field focused during the tap itself, and the field of the
// sheet is not there yet: a stand-in field takes the focus at the tap, and hands the keyboard over
// to the real one as soon as it is there (the focus going from field to field keeps it up).
const holdKeyboard = () => {
  const standIn = document.createElement('input');
  standIn.setAttribute('aria-hidden', 'true');
  standIn.setAttribute('tabindex', '-1');
  standIn.setAttribute('autocapitalize', 'sentences');
  standIn.setAttribute('enterkeyhint', 'send');
  // fixed and transparent: nothing moves and nothing shows; 16px: iOS does not zoom in on it
  standIn.style.cssText =
    'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0;';
  standIn.setAttribute('data-cy', 'speak-keyboard-stand-in');
  document.body.appendChild(standIn);
  standIn.focus({ preventScroll: true });
  return standIn;
};

// A text the device reads out loud with the voice of Gladys: an announcement. The row only has the
// button, the text is typed in a sheet: no name is long enough to leave it no room. Nothing is
// kept once it is sent: the sheet closes and is emptied as the text leaves, and gets it back if it
// could not be said. The text is a command, not a state: the feature never shows it.
class MusicPlayNotificationDeviceFeature extends Component {
  state = { open: false, text: '', sent: false, toastKey: 0 };

  textsOnTheirWay = [];

  setTextRef = element => {
    this.textField = element;
  };

  openSheet = () => {
    // with a mouse, the button that opened the sheet gets the focus back when it closes
    const hasMouse = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (!hasMouse) {
      this.dropStandIn();
      this.standIn = holdKeyboard();
    }
    this.setState({ open: true });
  };

  dropStandIn = () => {
    if (this.standIn) {
      this.standIn.remove();
      this.standIn = null;
    }
  };

  closeSheet = () => this.setState({ open: false });

  updateText = e => this.setState({ text: e.currentTarget.value });

  // A text to say has no lines: Enter sends it, unless it validates a word being composed (Safari
  // gives that Enter the key code 229, with isComposing false)
  onKeyDown = e => {
    if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
      this.speak(e);
    }
  };

  speak = async e => {
    e.preventDefault();
    const text = this.state.text.trim();
    if (text === '') {
      return;
    }
    this.textsOnTheirWay = [...this.textsOnTheirWay.slice(1 - MAX_TEXTS_ON_THEIR_WAY), text];
    this.setState({ open: false, text: '', sent: false });
    const sent = await this.props.updateValue(this.props.deviceFeature, text, { speak: true });
    // the failure can be known already: Gladys Plus refuses at once
    if (sent === true && this.textsOnTheirWay.includes(text)) {
      this.setState(({ toastKey }) => ({ sent: true, toastKey: toastKey + 1 }));
    }
  };

  // A text this page sent from this widget could not be said (DeviceCommandError.jsx tells why):
  // the text comes back, unless another one was typed meanwhile
  onSetValueError = payload => {
    if (
      payload.client_id !== COMMAND_CLIENT_ID ||
      payload.device_feature_selector !== this.props.deviceFeature.selector
    ) {
      return;
    }
    const index = this.textsOnTheirWay.indexOf(payload.value);
    if (index === -1) {
      return;
    }
    this.textsOnTheirWay.splice(index, 1);
    this.setState(({ text }) => ({ sent: false, text: text === '' ? payload.value : text }));
  };

  closeToast = () => this.setState({ sent: false });

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

  componentDidUpdate(previousProps, previousState) {
    if (previousProps.session !== this.props.session) {
      this.stopListening(previousProps.session);
      this.listen(this.props.session);
    }
    // the sheet is there: its field is ready to type into, the keyboard of a phone included. Done
    // before the sheet gives itself the focus (BottomSheet.jsx), which it then leaves to the field.
    if (this.state.open && !previousState.open) {
      if (this.textField) {
        this.textField.focus({ preventScroll: true });
      }
      this.dropStandIn();
    }
  }

  componentWillUnmount() {
    this.stopListening(this.props.session);
    this.dropStandIn();
  }

  render({ device, deviceFeature, rowName }, { open, text, sent, toastKey }) {
    // the device says the text: its name, as in the toast of a failure. The name of the row is
    // the editor's "Device (Feature)" unless the user changed it.
    const name = (device && device.name) || deviceFeature.new_label || rowName;

    return (
      <Fragment>
        <tr>
          <td>
            <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${deviceFeature.category}.${deviceFeature.type}`)}`} />
          </td>
          <td>{rowName}</td>
          <td class="text-right">
            <button
              type="button"
              onClick={this.openSheet}
              class="btn btn-outline-success btn-sm"
              aria-haspopup="dialog"
              data-cy="speak-button"
            >
              <Text id="dashboard.boxes.devicesInRoom.speakButton" />
            </button>
          </td>
        </tr>
        <Localizer>
          <BottomSheet
            open={open}
            title={<Text id="dashboard.boxes.devicesInRoom.speakSheetTitle" fields={{ name }} />}
            onClose={this.closeSheet}
            aboveKeyboard
            dataCy="speak-sheet"
          >
            <form onSubmit={this.speak}>
              <MobileField>
                <Localizer>
                  <textarea
                    ref={this.setTextRef}
                    class={cx(fieldClass.textarea, style.speakText)}
                    rows="3"
                    maxLength={MAX_TTS_TEXT_LENGTH}
                    value={text}
                    onInput={this.updateText}
                    onKeyDown={this.onKeyDown}
                    aria-label={<Text id="dashboard.boxes.devicesInRoom.speakPlaceholder" />}
                    placeholder={<Text id="dashboard.boxes.devicesInRoom.speakPlaceholder" />}
                    autocomplete="off"
                    autocapitalize="sentences"
                    enterkeyhint="send"
                    data-cy="speak-text"
                  />
                </Localizer>
              </MobileField>
              <BigButton variant="primary" type="submit" icon="send" disabled={text.trim() === ''} data-cy="speak-send">
                <Text id="dashboard.boxes.devicesInRoom.speakSendButton" />
              </BigButton>
            </form>
          </BottomSheet>
        </Localizer>
        <MobileToast
          message={sent ? <Text id="dashboard.boxes.devicesInRoom.speakSent" fields={{ name }} /> : null}
          toastKey={toastKey}
          duration={SENT_TOAST_DURATION_MS}
          onClose={this.closeToast}
          role="status"
          aboveDock
          dismissable
          dataCy="speak-sent"
        />
      </Fragment>
    );
  }
}

export default connect('session', {})(MusicPlayNotificationDeviceFeature);
