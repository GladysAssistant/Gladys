import { Component, Fragment } from 'preact';
import get from 'get-value';
import { Localizer, Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import BottomSheet from '../../../sheet/BottomSheet';
import MobileField, { fieldClass } from '../../../mobile/MobileField';
import { BigButton } from '../../../mobile/MobileBottomBar';

// A text the device reads out loud with the voice of Gladys: a written intercom. The row only has
// the button, the text is typed in a sheet: no name is long enough to leave it no room. Nothing is
// kept once it is said: the sheet closes and is emptied as the text leaves, and gets it back if it
// could not be said.
class MusicPlayNotificationDeviceFeature extends Component {
  state = { open: false, text: '' };

  sentText = null;

  setTextRef = element => {
    this.textField = element;
  };

  openSheet = () => {
    this.setState({ open: true });
    // with a mouse the field is ready to type into; not on a touch screen, where the keyboard only
    // comes up once the field is touched (as in MediaBrowser.jsx)
    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
      setTimeout(() => {
        if (this.textField) {
          this.textField.focus();
        }
      }, 50);
    }
  };

  closeSheet = () => this.setState({ open: false });

  updateText = e => this.setState({ text: e.currentTarget.value });

  // A text to say has no lines: Enter sends it, unless it validates a word being composed
  onKeyDown = e => {
    if (e.key === 'Enter' && !e.isComposing) {
      this.speak(e);
    }
  };

  speak = e => {
    e.preventDefault();
    const text = this.state.text.trim();
    if (text === '') {
      return;
    }
    this.sentText = text;
    this.setState({ open: false, text: '' });
    this.props.updateValue(this.props.deviceFeature, text);
  };

  componentWillReceiveProps(nextProps) {
    // The widget holds the sent text as the value of the feature, and only goes back to the
    // previous one when the command failed (DeviceCommandError.jsx)
    const failed =
      this.sentText !== null &&
      this.props.deviceFeature.last_value === this.sentText &&
      nextProps.deviceFeature.last_value !== this.sentText;
    if (failed) {
      const unsaidText = this.sentText;
      this.sentText = null;
      // a text typed meanwhile is not overwritten
      this.setState(({ text }) => ({ text: text === '' ? unsaidText : text }));
    }
  }

  render({ deviceFeature, rowName }, { open, text }) {
    const { category, type } = deviceFeature;

    return (
      <Fragment>
        <tr>
          <td>
            <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'bell' })}`} />
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
              <i class="fe fe-volume-2 mr-1" aria-hidden="true" />
              <Text id="dashboard.boxes.devicesInRoom.speakButton" />
            </button>
          </td>
        </tr>
        <BottomSheet open={open} title={rowName} onClose={this.closeSheet} aboveKeyboard dataCy="speak-sheet">
          <form onSubmit={this.speak}>
            <MobileField>
              <Localizer>
                <textarea
                  ref={this.setTextRef}
                  class={fieldClass.textarea}
                  rows="3"
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
      </Fragment>
    );
  }
}

export default MusicPlayNotificationDeviceFeature;
