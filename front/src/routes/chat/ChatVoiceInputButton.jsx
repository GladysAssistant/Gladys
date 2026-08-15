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

  /**
   * Incremented at each new session, so a session which is ending cannot reset
   * the state of the session which just started.
   */
  recognitionGeneration = 0;

  /** True when the user asked to listen again while the previous session was still ending. */
  restartWhenEnded = false;

  componentWillUnmount() {
    this.recognitionGeneration += 1;
    this.restartWhenEnded = false;
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
  }

  setListening = listening => {
    if (this.state.listening === listening) {
      return;
    }
    this.setState({ listening });
    if (this.props.onListeningChange) {
      this.props.onListeningChange(listening);
    }
  };

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

  handleEnd = generation => {
    if (generation !== this.recognitionGeneration) {
      // An older session ended after a new one started: it must not stop it.
      return;
    }
    this.recognition = null;
    if (this.restartWhenEnded) {
      this.restartWhenEnded = false;
      this.startRecognition();
      return;
    }
    this.setListening(false);
  };

  /**
   * @description Create and start a new recognition session.
   */
  startRecognition = () => {
    this.baseText = this.props.currentText || '';
    this.recognitionGeneration += 1;
    const generation = this.recognitionGeneration;
    const isCurrentSession = () => generation === this.recognitionGeneration;
    const recognition = createSpeechRecognition({
      language: this.props.language,
      onTranscript: transcript => {
        if (isCurrentSession()) {
          this.handleTranscript(transcript);
        }
      },
      onError: errorKey => {
        if (isCurrentSession()) {
          this.handleError(errorKey);
        }
      },
      onEnd: () => this.handleEnd(generation)
    });
    if (!recognition) {
      this.props.onError('errorNotSupported');
      this.setListening(false);
      return;
    }
    this.recognition = recognition;
    this.setListening(true);
    if (!recognition.start()) {
      // The browser refused to start: don't leave a button saying we listen.
      this.recognition = null;
      this.setListening(false);
      this.props.onError('error');
    }
  };

  startListening = () => {
    this.props.onError(null);
    if (this.recognition) {
      // The previous session has not ended yet, starting a new one now would
      // throw: it is started when the browser tells us that one ended.
      this.restartWhenEnded = true;
      this.setListening(true);
      return;
    }
    this.startRecognition();
  };

  /**
   * @description Stop listening, keeping what was already transcribed in the input.
   */
  stopListening = () => {
    this.restartWhenEnded = false;
    if (this.recognition) {
      // The session is kept until the browser tells us it ended, so the next
      // one is not started while this one is still running.
      this.recognition.stop();
    }
    this.setListening(false);
  };

  /**
   * @description Stop listening and drop the words still being transcribed.
   * Called when the message is sent, so a late transcription does not refill
   * the input the user just emptied.
   */
  cancelListening = () => {
    this.restartWhenEnded = false;
    this.recognitionGeneration += 1;
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
    this.setListening(false);
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
