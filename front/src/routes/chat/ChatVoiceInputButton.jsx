import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { createSpeechRecognition } from '../../utils/speechRecognition';
import style from './style.css';

/**
 * Microphone button dictating what the user says in the chat message input.
 * Everything is handled by the browser with the Web Speech API: Gladys never
 * records or uploads any audio. The message is not sent automatically, the
 * user reviews the transcription and presses send.
 */
class ChatVoiceInputButton extends Component {
  state = {
    listening: false
  };

  /** Text already in the input when the user started to talk. */
  baseText = '';

  recognition = null;

  componentWillUnmount() {
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
  }

  handleTranscript = transcript => {
    const trimmedTranscript = transcript.trim();
    if (trimmedTranscript.length === 0) {
      this.props.onTranscript(this.baseText);
      return;
    }
    const separator = this.baseText.length > 0 && !/\s$/.test(this.baseText) ? ' ' : '';
    this.props.onTranscript(`${this.baseText}${separator}${trimmedTranscript}`);
  };

  handleError = errorKey => {
    this.props.onError(errorKey);
  };

  handleEnd = () => {
    this.recognition = null;
    this.setState({ listening: false });
  };

  startListening = () => {
    this.props.onError(null);
    this.baseText = this.props.currentText || '';
    const recognition = createSpeechRecognition({
      language: this.props.language,
      onTranscript: this.handleTranscript,
      onError: this.handleError,
      onEnd: this.handleEnd
    });
    if (!recognition) {
      this.props.onError('errorNotSupported');
      return;
    }
    this.recognition = recognition;
    this.setState({ listening: true });
    recognition.start();
  };

  /**
   * @description Stop listening, keeping what was already transcribed in the input.
   */
  stopListening = () => {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.setState({ listening: false });
  };

  /**
   * @description Stop listening and drop the words still being transcribed.
   * Called when the message is sent, so a late transcription does not refill
   * the input the user just emptied.
   */
  cancelListening = () => {
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
    if (this.state.listening) {
      this.setState({ listening: false });
    }
  };

  handleClick = () => {
    if (this.state.listening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  };

  render(props, { listening }) {
    const labelKey = listening ? 'chat.voiceInput.stopListening' : 'chat.voiceInput.startListening';

    return (
      <Localizer>
        <button
          type="button"
          class={cx('btn', style.voiceInputButton, {
            [style.voiceInputButtonListening]: listening
          })}
          onClick={this.handleClick}
          title={<Text id={labelKey} />}
          aria-label={<Text id={labelKey} />}
          aria-pressed={listening ? 'true' : 'false'}
        >
          <i class={cx('fe', listening ? 'fe-square' : 'fe-mic')} aria-hidden="true" />
        </button>
      </Localizer>
    );
  }
}

export default ChatVoiceInputButton;
