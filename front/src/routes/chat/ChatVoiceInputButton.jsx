import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { normalizeSpeechBlobForStt } from '../../utils/speechAudioForStt';
import { isSpeechRecordingError } from '../../utils/speechMicrophoneAccess';
import { prepareSpeechCommandRecording, preloadSpeechCommandRecorder } from '../../utils/speechCommandRecorder';
import { isRecordUntilSilenceAbortError, recordUntilSilence } from '../../utils/recordUntilSilence';
import style from './style.css';

const STATUS = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing'
};

/**
 * @description Returns true when the error comes from an aborted recording or request.
 * @param {Error} error - Caught error.
 * @returns {boolean} Whether the error is an abort error.
 */
function isAbortError(error) {
  if (isRecordUntilSilenceAbortError(error)) {
    return true;
  }
  if (error && (error.code === 'ERR_CANCELED' || error.name === 'CanceledError')) {
    return true;
  }
  return Boolean(error && error.name === 'AbortError');
}

/**
 * @description Map a recording or STT error to a `chat.voiceInput` i18n key.
 * @param {Error} error - Caught error.
 * @returns {string} i18n key suffix.
 */
function getVoiceInputErrorKey(error) {
  if (isSpeechRecordingError(error)) {
    if (error.code === 'INSECURE_CONTEXT' || error.code === 'NOT_SUPPORTED') {
      return 'errorNotSupported';
    }
    if (error.code === 'PERMISSION_DENIED') {
      return 'errorPermissionDenied';
    }
    if (error.code === 'NO_MICROPHONE') {
      return 'errorNoMicrophone';
    }
    if (error.code === 'MICROPHONE_UNAVAILABLE') {
      return 'errorMicrophoneUnavailable';
    }
    if (error.code === 'NO_SPEECH') {
      return 'errorNoSpeech';
    }
  }
  const serverMessage = error && error.response && error.response.data && error.response.data.message;
  if (serverMessage === 'EMPTY_TRANSCRIPTION') {
    return 'errorNoTranscription';
  }
  return 'error';
}

/**
 * @description Extract the transcription text from the Gladys Plus STT response.
 * @param {object|string} sttResponse - STT API response.
 * @returns {string} Transcription text.
 */
function extractTranscription(sttResponse) {
  if (!sttResponse) {
    return '';
  }
  if (typeof sttResponse === 'string') {
    return sttResponse.trim();
  }
  const text = sttResponse.text || sttResponse.transcription || sttResponse.transcript || '';
  return typeof text === 'string' ? text.trim() : '';
}

/**
 * Microphone button dictating what the user says in the chat message input.
 * The audio is recorded by the browser until the user stops speaking, then
 * transcribed by the Gladys Plus STT API — the same path as the dashboard
 * voice assistant widget. The message is not sent automatically: the
 * transcription fills the input and the user reviews it before pressing send.
 */
class ChatVoiceInputButton extends Component {
  state = {
    status: STATUS.IDLE
  };

  /** Text already in the input when the user started to talk. */
  baseText = '';

  /**
   * Synchronous mirror of `state.status`: Preact does not flush `setState`
   * before the next click can land, so routing decisions read this field
   * instead of `this.state` (a double-click must not start a second session).
   */
  currentStatus = STATUS.IDLE;

  /**
   * Incremented at each new dictation, so a cancelled session cannot update
   * the input or the state of the session which replaced it.
   */
  sessionGeneration = 0;

  activeAbortController = null;

  /** Last locked state reported to the parent, which freezes the input while true. */
  reportedBusy = false;

  _isMounted = false;

  componentDidMount() {
    this._isMounted = true;
    this.preloadRecorder();
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.cancelListening();
  }

  /**
   * @description Warm up the audio worklet so the first click starts recording faster.
   */
  preloadRecorder = async () => {
    try {
      await preloadSpeechCommandRecorder();
    } catch (e) {}
  };

  isSessionActive = generation => generation === this.sessionGeneration;

  setStatus = (status, generation) => {
    if (generation !== undefined && !this.isSessionActive(generation)) {
      return;
    }
    this.currentStatus = status;
    if (this._isMounted) {
      // Always enqueue the update: `this.state` is not flushed synchronously,
      // so comparing against it can skip a change that must still land.
      this.setState({ status });
    }
    const busy = status !== STATUS.IDLE;
    if (this.reportedBusy !== busy) {
      this.reportedBusy = busy;
      if (this.props.onListeningChange) {
        this.props.onListeningChange(busy);
      }
    }
  };

  /**
   * @description Pre-open the microphone stream on pointer down, so the click
   * starts recording without waiting for getUserMedia (only when the
   * permission is already granted, so no prompt is shown early).
   */
  prepareRecording = async () => {
    if (this.currentStatus !== STATUS.IDLE) {
      return;
    }
    try {
      await prepareSpeechCommandRecording();
    } catch (e) {}
  };

  /**
   * @description Record until silence, send the audio to the Gladys Plus STT
   * API and append the transcription to the message input.
   */
  startListening = async () => {
    this.props.onError(null);
    // A previous session may still hold the microphone: abort it before
    // opening a new one.
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
    this.baseText = this.props.currentText || '';
    this.sessionGeneration += 1;
    const generation = this.sessionGeneration;
    const abortController = new AbortController();
    this.activeAbortController = abortController;
    this.setStatus(STATUS.LISTENING, generation);

    try {
      const recordedBlob = await recordUntilSilence({ signal: abortController.signal });
      if (!this.isSessionActive(generation)) {
        return;
      }
      this.setStatus(STATUS.PROCESSING, generation);

      const audioBlob = await normalizeSpeechBlobForStt(recordedBlob);
      if (!this.isSessionActive(generation)) {
        return;
      }

      const sttResponse = await this.props.httpClient.postBinary(
        '/api/v1/gateway/stt',
        audioBlob,
        audioBlob.type || 'audio/wav',
        { signal: abortController.signal }
      );
      if (!this.isSessionActive(generation)) {
        return;
      }

      const transcription = extractTranscription(sttResponse);
      if (!transcription) {
        this.props.onError('errorNoTranscription');
        this.setStatus(STATUS.IDLE, generation);
        return;
      }

      const separator = this.baseText.length > 0 && !/\s$/.test(this.baseText) ? ' ' : '';
      this.props.onTranscript(`${this.baseText}${separator}${transcription}`);
      this.setStatus(STATUS.IDLE, generation);
    } catch (e) {
      if (!this.isSessionActive(generation)) {
        return;
      }
      this.setStatus(STATUS.IDLE, generation);
      if (isAbortError(e)) {
        return;
      }
      console.error(e);
      this.props.onError(getVoiceInputErrorKey(e));
    } finally {
      if (this.activeAbortController === abortController) {
        this.activeAbortController = null;
      }
    }
  };

  /**
   * @description Cancel the running dictation and drop the recorded audio.
   * Also called by the parent when the message is sent, so a late
   * transcription does not refill the input the user just emptied.
   */
  cancelListening = () => {
    this.sessionGeneration += 1;
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
    this.setStatus(STATUS.IDLE);
  };

  handleClick = () => {
    if (this.currentStatus === STATUS.IDLE) {
      this.startListening();
    } else {
      this.cancelListening();
    }
  };

  render(props, { status }) {
    const labelKey = status === STATUS.IDLE ? 'chat.voiceInput.startListening' : 'chat.voiceInput.stopListening';

    return (
      <Localizer>
        <button
          type="button"
          class={cx('btn', style.voiceInputButton, {
            [style.voiceInputButtonListening]: status === STATUS.LISTENING,
            [style.voiceInputButtonProcessing]: status === STATUS.PROCESSING
          })}
          onPointerDown={this.prepareRecording}
          onClick={this.handleClick}
          title={<Text id={labelKey} />}
          aria-label={<Text id={labelKey} />}
          aria-pressed={status !== STATUS.IDLE ? 'true' : 'false'}
        >
          <i
            class={cx('fe', {
              'fe-mic': status === STATUS.IDLE,
              'fe-square': status === STATUS.LISTENING,
              'fe-loader': status === STATUS.PROCESSING,
              [style.voiceInputSpinner]: status === STATUS.PROCESSING
            })}
            aria-hidden="true"
          />
        </button>
      </Localizer>
    );
  }
}

export default ChatVoiceInputButton;
