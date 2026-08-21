import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { createSpeechRecognition } from '../../utils/speechRecognition';
import style from './style.css';

/** How long the input stays locked when a stopped session never fires `onend`. */
const STOPPING_TIMEOUT_MS = 5000;

/**
 * Microphone button dictating what the user says in the chat message input.
 * Everything is handled by the browser with the Web Speech API: Gladys never
 * records or uploads any audio. The message is not sent automatically, the
 * user reviews the transcription and presses send.
 */
class ChatVoiceInputButton extends Component {
  state = {
    listening: false,
    // True between the moment the user asked to stop and the moment the browser
    // says the session ended: `stop()` still delivers a final result before
    // `onend`, so the input must stay locked until then.
    stopping: false
  };

  /** Text already in the input when the user started to talk. */
  baseText = '';

  recognition = null;

  /** Previous session which was asked to end and has not fired `onend` yet. */
  endingRecognition = null;

  /**
   * Incremented at each new session, so a session which is ending cannot reset
   * the state of the session which just started.
   */
  recognitionGeneration = 0;

  /** True when the browser refused to start while the previous session was still running. */
  startWhenPreviousEnded = false;

  /** Last state reported to the parent, which locks the input while it is true. */
  reportedListening = false;

  /** Safety net, in case a browser never fires `onend` after a `stop()`. */
  stoppingTimeout = null;

  componentWillUnmount() {
    this.recognitionGeneration += 1;
    this.startWhenPreviousEnded = false;
    this.clearStoppingTimeout();
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
    if (this.endingRecognition) {
      this.endingRecognition.abort();
      this.endingRecognition = null;
    }
  }

  clearStoppingTimeout = () => {
    if (this.stoppingTimeout) {
      clearTimeout(this.stoppingTimeout);
      this.stoppingTimeout = null;
    }
  };

  /**
   * @description Update the button state, and tell the parent whether the input
   * must stay locked. It stays locked while a session is stopping, because a
   * final result can still arrive and rewrite what the user typed meanwhile.
   * @param {boolean} listening - True while a session is running.
   * @param {boolean} stopping - True while a stopped session has not ended yet.
   */
  setListening = (listening, stopping = false) => {
    if (!stopping) {
      this.clearStoppingTimeout();
    }
    if (this.state.listening !== listening || this.state.stopping !== stopping) {
      this.setState({ listening, stopping });
    }
    const shouldLock = listening || stopping;
    if (this.reportedListening === shouldLock) {
      return;
    }
    this.reportedListening = shouldLock;
    if (this.props.onListeningChange) {
      this.props.onListeningChange(shouldLock);
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
      // An older session ended after a new one started: it must not stop it. It
      // can only unblock it, when the browser refused to start while it was
      // still running.
      this.endingRecognition = null;
      if (this.startWhenPreviousEnded) {
        this.startWhenPreviousEnded = false;
        this.startRecognition();
      }
      return;
    }
    this.recognition = null;
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
    if (recognition.start()) {
      return;
    }
    this.recognition = null;
    if (this.endingRecognition) {
      // Chromium refuses a new session while the previous one is still running:
      // it is started again as soon as the browser tells us that one ended.
      this.startWhenPreviousEnded = true;
      return;
    }
    // The browser refused to start: don't leave a button saying we listen.
    this.setListening(false);
    this.props.onError('error');
  };

  startListening = () => {
    this.props.onError(null);
    if (this.recognition) {
      // The previous session was stopped and has not ended yet. The new one is
      // still started right away, in the same click: Safari (especially on iOS)
      // refuses `start()` outside of the gesture which granted the microphone,
      // so waiting for `onend` to start would break dictating there. Browsers
      // which refuse a second session instead (Chromium) go through the
      // `startWhenPreviousEnded` path, which does not need a gesture.
      this.endingRecognition = this.recognition;
      this.recognition = null;
    }
    this.startRecognition();
  };

  /**
   * @description Stop listening, keeping what was already transcribed in the input.
   */
  stopListening = () => {
    this.startWhenPreviousEnded = false;
    if (!this.recognition) {
      this.setListening(false);
      return;
    }
    // The session is kept until the browser tells us it ended, so the next
    // one is not started while this one is still running.
    this.recognition.stop();
    // The button goes back to its idle look right away, but the input stays
    // locked until `onend`: `stop()` still delivers the final result of what
    // was said, which would otherwise overwrite an edit made in between.
    this.setListening(false, true);
    this.clearStoppingTimeout();
    this.stoppingTimeout = setTimeout(() => {
      this.stoppingTimeout = null;
      if (this.state.stopping) {
        // A browser which never fired `onend` must not leave a locked input.
        this.setListening(false);
      }
    }, STOPPING_TIMEOUT_MS);
  };

  /**
   * @description Stop listening and drop the words still being transcribed.
   * Called when the message is sent, so a late transcription does not refill
   * the input the user just emptied.
   */
  cancelListening = () => {
    this.startWhenPreviousEnded = false;
    this.recognitionGeneration += 1;
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
    if (this.endingRecognition) {
      this.endingRecognition.abort();
      this.endingRecognition = null;
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
