import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import GladysPlusUpsellCard from '../../gateway/GladysPlusUpsellCard';
import { normalizeSpeechBlobForStt } from '../../../utils/speechAudioForStt';
import {
  getSpeechRecordingUnavailableReason,
  isSpeechRecordingError,
  isSpeechRecordingSupported,
  probeMicrophoneAvailability
} from '../../../utils/speechMicrophoneAccess';
import { prepareSpeechCommandRecording, preloadSpeechCommandRecorder } from '../../../utils/speechCommandRecorder';
import { isRecordUntilSilenceAbortError, recordUntilSilence } from '../../../utils/recordUntilSilence';
import { playSpeechTtsUrl, unlockSpeechTtsPlayback } from '../../../utils/speechTtsPlayback';
import style from './style.css';

const STATE = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ERROR: 'error'
};

/** Delay after a completed turn before hiding transcription and response. */
const MESSAGES_CLEAR_DELAY_MS = 6000;

const VOICE_ASSISTANT_UPSELL_PROPS = {
  compact: true,
  icon: 'fe-mic',
  utmCampaign: 'dashboard_voice_assistant',
  titleKey: 'gladysPlusUpsell.voiceAssistant.title',
  descriptionKey: 'gladysPlusUpsell.voiceAssistant.compactDescription'
};

/** Download the audio instead of calling /api/v1/gateway/voice. */
const DEBUG_DOWNLOAD_RECORDING = false;

/**
 * @description Trigger a browser download of a recorded audio blob (local debug).
 * @param {Blob} blob - Audio blob to save.
 */
function downloadRecordedAudioForDebug(blob) {
  const type = (blob.type || 'audio/wav').toLowerCase();
  const extension = type.includes('wav') ? 'wav' : type.includes('webm') ? 'webm' : 'audio';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `voice-assistant-debug-${Date.now()}.${extension}`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * @description Extract a readable error message from an HTTP client error.
 * @param {Error} error - Axios or generic error.
 * @returns {string} Error message.
 */
/**
 * @description Returns true when the error is from an aborted fetch/recording.
 * @param {Error} error - Error to check.
 * @returns {boolean} Whether the error is an abort error.
 */
function isAbortError(error) {
  if (isRecordUntilSilenceAbortError(error)) {
    return true;
  }
  if (error && error.code === 'ERR_CANCELED') {
    return true;
  }
  if (error && error.name === 'CanceledError') {
    return true;
  }
  return Boolean(error && error.name === 'AbortError');
}

function getHttpErrorMessage(error) {
  if (error && error.response && error.response.data) {
    if (error.response.data.message) {
      return error.response.data.message;
    }
    if (error.response.data.error) {
      return String(error.response.data.error);
    }
  }
  if (error && error.message) {
    return error.message;
  }
  return null;
}

/**
 * @description Map known server error messages to UI error types.
 * @param {string|null} message - HTTP error message.
 * @returns {{ errorType: string, errorMessage: string|null }|null} UI error fields or null.
 */
function getHttpVoiceErrorState(message) {
  if (!message) {
    return null;
  }
  if (message === 'EMPTY_TRANSCRIPTION') {
    return { errorType: 'no_transcription', errorMessage: null };
  }
  return { errorType: 'http', errorMessage: message };
}

/**
 * @description Map recording / HTTP errors to UI error state.
 * @param {Error} error - Caught error.
 * @returns {{ errorType: string, errorMessage: string|null }} UI error fields.
 */
function getVoiceErrorState(error) {
  if (isSpeechRecordingError(error)) {
    if (error.code === 'INSECURE_CONTEXT') {
      return { errorType: 'insecure', errorMessage: null };
    }
    if (error.code === 'PERMISSION_DENIED') {
      return { errorType: 'permission', errorMessage: null };
    }
    if (error.code === 'NOT_SUPPORTED') {
      return { errorType: 'unsupported', errorMessage: null };
    }
    if (error.code === 'NO_MICROPHONE') {
      return { errorType: 'no_microphone', errorMessage: null };
    }
    if (error.code === 'MICROPHONE_UNAVAILABLE') {
      return { errorType: 'microphone_unavailable', errorMessage: null };
    }
    if (error.code === 'NO_SPEECH') {
      return { errorType: 'no_speech', errorMessage: null };
    }
  }
  const httpErrorState = getHttpVoiceErrorState(getHttpErrorMessage(error));
  if (httpErrorState) {
    return httpErrorState;
  }
  return { errorType: 'http', errorMessage: getHttpErrorMessage(error) };
}

class VoiceAssistantBox extends Component {
  state = {
    uiState: STATE.IDLE,
    transcription: '',
    response: '',
    errorType: null,
    errorMessage: null,
    gatewayConnected: null,
    microphoneAvailable: typeof window !== 'undefined' ? isSpeechRecordingSupported() : true,
    microphoneUnavailableReason: typeof window !== 'undefined' ? getSpeechRecordingUnavailableReason() : null
  };

  audioPlayer = null;

  messagesClearTimeout = null;

  _isMounted = false;

  voiceSessionGeneration = 0;

  activeVoiceAbortController = null;

  probeMicrophone = async () => {
    const reason = await probeMicrophoneAvailability();
    if (!this._isMounted) {
      return;
    }
    this.setState({
      microphoneAvailable: reason === null,
      microphoneUnavailableReason: reason
    });
  };

  preloadVoiceRecorder = async () => {
    try {
      await preloadSpeechCommandRecorder();
    } catch (e) {}
  };

  prepareVoiceRecording = async () => {
    const { uiState } = this.state;
    if (uiState !== STATE.IDLE && uiState !== STATE.ERROR) {
      return;
    }
    if (!isSpeechRecordingSupported()) {
      return;
    }
    try {
      await prepareSpeechCommandRecording();
    } catch (e) {}
  };

  componentDidMount() {
    this._isMounted = true;
    this.fetchGatewayStatus();
    if (isSpeechRecordingSupported()) {
      this.preloadVoiceRecorder();
      this.probeMicrophone();
    }
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.TRANSCRIPTION,
      this.onTranscriptionWebsocket
    );
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.RESPONSE,
      this.onResponseWebsocket
    );
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.PROCESSING,
      this.onProcessingWebsocket
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.ERROR, this.onErrorWebsocket);
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.cancelActiveVoiceSession();
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.TRANSCRIPTION,
      this.onTranscriptionWebsocket
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.RESPONSE,
      this.onResponseWebsocket
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.PROCESSING,
      this.onProcessingWebsocket
    );
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.ERROR, this.onErrorWebsocket);
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer = null;
    }
    this.clearMessagesClearTimeout();
  }

  isVoiceSessionActive = generation => generation === this.voiceSessionGeneration;

  cancelActiveVoiceSession = () => {
    this.voiceSessionGeneration += 1;
    if (this.activeVoiceAbortController) {
      this.activeVoiceAbortController.abort();
      this.activeVoiceAbortController = null;
    }
    if (this.audioPlayer) {
      this.audioPlayer.onended = null;
      this.audioPlayer.pause();
      this.audioPlayer = null;
    }
  };

  safeSetState = (stateOrUpdater, voiceSessionGeneration) => {
    if (!this._isMounted) {
      return;
    }
    if (voiceSessionGeneration !== undefined && !this.isVoiceSessionActive(voiceSessionGeneration)) {
      return;
    }
    this.setState(stateOrUpdater);
  };

  clearMessagesClearTimeout = () => {
    if (this.messagesClearTimeout) {
      clearTimeout(this.messagesClearTimeout);
      this.messagesClearTimeout = null;
    }
  };

  scheduleMessagesClear = () => {
    this.clearMessagesClearTimeout();
    this.messagesClearTimeout = setTimeout(() => {
      this.messagesClearTimeout = null;
      if (this._isMounted) {
        this.setState({ transcription: '', response: '' });
      }
    }, MESSAGES_CLEAR_DELAY_MS);
  };

  fetchGatewayStatus = async () => {
    try {
      const status = await this.props.httpClient.get('/api/v1/gateway/status');
      if (this._isMounted) {
        this.setState({ gatewayConnected: status.configured === true });
      }
    } catch (e) {
      if (this._isMounted) {
        this.setState({ gatewayConnected: false });
      }
    }
  };

  onTranscriptionWebsocket = payload => {
    if (!this._isMounted || !payload || !payload.text) {
      return;
    }
    this.setState({ transcription: payload.text });
  };

  onResponseWebsocket = payload => {
    if (!this._isMounted || !payload || !payload.text) {
      return;
    }
    this.setState({ response: payload.text });
  };

  onProcessingWebsocket = payload => {
    if (!this._isMounted || !payload) {
      return;
    }
    if (payload.processing) {
      this.setState(prev => {
        if (prev.uiState === STATE.ERROR || prev.uiState === STATE.SPEAKING) {
          return null;
        }
        return { uiState: STATE.PROCESSING };
      });
      return;
    }
    this.setState(prev => {
      if (prev.uiState === STATE.PROCESSING) {
        return { uiState: STATE.IDLE };
      }
      return null;
    });
  };

  onErrorWebsocket = payload => {
    if (!this._isMounted) {
      return;
    }
    this.clearMessagesClearTimeout();
    const message = (payload && payload.message) || null;
    const httpErrorState = getHttpVoiceErrorState(message);
    this.setState({
      uiState: STATE.ERROR,
      errorType: httpErrorState ? httpErrorState.errorType : 'http',
      errorMessage: httpErrorState ? httpErrorState.errorMessage : message
    });
  };

  playTts = async (ttsUrl, voiceSessionGeneration) => {
    if (!this.isVoiceSessionActive(voiceSessionGeneration)) {
      return;
    }
    if (!ttsUrl) {
      this.safeSetState({ uiState: STATE.IDLE }, voiceSessionGeneration);
      this.scheduleMessagesClear();
      return;
    }
    this.safeSetState({ uiState: STATE.SPEAKING }, voiceSessionGeneration);
    try {
      if (!this.audioPlayer) {
        this.audioPlayer = new Audio();
      }
      this.audioPlayer.onended = null;
      this.audioPlayer.pause();
      await playSpeechTtsUrl(this.audioPlayer, ttsUrl, () => {
        if (!this.isVoiceSessionActive(voiceSessionGeneration)) {
          return;
        }
        this.safeSetState({ uiState: STATE.IDLE }, voiceSessionGeneration);
        this.scheduleMessagesClear();
      });
    } catch (e) {
      if (!this.isVoiceSessionActive(voiceSessionGeneration)) {
        return;
      }
      console.error(e);
      this.safeSetState({ uiState: STATE.IDLE }, voiceSessionGeneration);
      this.scheduleMessagesClear();
    }
  };

  handleSpeakClick = async () => {
    const { uiState } = this.state;
    if (uiState === STATE.LISTENING || uiState === STATE.PROCESSING || uiState === STATE.SPEAKING) {
      this.cancelActiveVoiceSession();
      this.setState({
        uiState: STATE.IDLE,
        errorType: null,
        errorMessage: null
      });
      return;
    }
    if (uiState !== STATE.IDLE && uiState !== STATE.ERROR) {
      return;
    }

    this.cancelActiveVoiceSession();
    const voiceSessionGeneration = this.voiceSessionGeneration;
    const abortController = new AbortController();
    this.activeVoiceAbortController = abortController;

    this.clearMessagesClearTimeout();
    if (!isSpeechRecordingSupported()) {
      const reason = getSpeechRecordingUnavailableReason();
      this.safeSetState(
        {
          uiState: STATE.ERROR,
          errorType: reason === 'INSECURE_CONTEXT' ? 'insecure' : 'unsupported',
          errorMessage: null
        },
        voiceSessionGeneration
      );
      return;
    }

    if (!this.audioPlayer) {
      this.audioPlayer = new Audio();
    }
    unlockSpeechTtsPlayback(this.audioPlayer);

    this.safeSetState(
      {
        uiState: STATE.PROCESSING,
        transcription: '',
        response: '',
        errorType: null,
        errorMessage: null
      },
      voiceSessionGeneration
    );

    try {
      const recordedBlob = await recordUntilSilence({
        signal: abortController.signal,
        onReady: () => {
          this.safeSetState({ uiState: STATE.LISTENING }, voiceSessionGeneration);
        }
      });
      if (!this.isVoiceSessionActive(voiceSessionGeneration)) {
        return;
      }

      const audioBlob = await normalizeSpeechBlobForStt(recordedBlob);
      if (!this.isVoiceSessionActive(voiceSessionGeneration)) {
        return;
      }

      if (DEBUG_DOWNLOAD_RECORDING) {
        downloadRecordedAudioForDebug(audioBlob);
        this.safeSetState(
          {
            uiState: STATE.IDLE,
            transcription: `Debug: téléchargé (${audioBlob.size} octets, ${audioBlob.type || 'audio/wav'})`
          },
          voiceSessionGeneration
        );
        return;
      }

      this.safeSetState({ uiState: STATE.PROCESSING }, voiceSessionGeneration);

      const result = await this.props.httpClient.postBinary(
        '/api/v1/gateway/voice',
        audioBlob,
        audioBlob.type || 'audio/wav',
        { signal: abortController.signal }
      );

      if (!this.isVoiceSessionActive(voiceSessionGeneration)) {
        return;
      }

      if (result.transcription) {
        this.safeSetState({ transcription: result.transcription }, voiceSessionGeneration);
      }
      if (result.answer) {
        this.safeSetState({ response: result.answer }, voiceSessionGeneration);
      }

      await this.playTts(result.ttsUrl, voiceSessionGeneration);
    } catch (e) {
      if (isAbortError(e)) {
        if (this.isVoiceSessionActive(voiceSessionGeneration)) {
          this.safeSetState(
            {
              uiState: STATE.IDLE,
              errorType: null,
              errorMessage: null
            },
            voiceSessionGeneration
          );
        }
        return;
      }
      if (!this.isVoiceSessionActive(voiceSessionGeneration)) {
        return;
      }
      console.error(e);
      this.clearMessagesClearTimeout();
      const { errorType, errorMessage } = getVoiceErrorState(e);
      const microphoneState =
        errorType === 'no_microphone'
          ? { microphoneAvailable: false, microphoneUnavailableReason: 'NO_MICROPHONE' }
          : null;
      this.safeSetState(
        {
          uiState: STATE.ERROR,
          errorType,
          errorMessage,
          ...microphoneState
        },
        voiceSessionGeneration
      );
    } finally {
      if (this.activeVoiceAbortController === abortController) {
        this.activeVoiceAbortController = null;
      }
    }
  };

  getButtonLabelKey = () => {
    const { uiState } = this.state;
    if (uiState === STATE.LISTENING || uiState === STATE.PROCESSING || uiState === STATE.SPEAKING) {
      return 'dashboard.boxes.voice-assistant.stop';
    }
    return 'dashboard.boxes.voice-assistant.speak';
  };

  isDarkTheme = () => {
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark-mode')) {
      return true;
    }
    return Boolean(this.props.darkMode);
  };

  render(props, state) {
    const {
      uiState,
      transcription,
      response,
      errorType,
      errorMessage,
      gatewayConnected,
      microphoneAvailable,
      microphoneUnavailableReason
    } = state;
    const boxTitle = props.box.name;
    const isBusy = uiState === STATE.LISTENING || uiState === STATE.PROCESSING || uiState === STATE.SPEAKING;
    const isDark = this.isDarkTheme();
    const needsGladysPlus = gatewayConnected !== true;
    const micBlocked = microphoneAvailable === false;

    return (
      <div
        class={cx(
          'card',
          'dark-mode-no-invert',
          'voice-assistant-card',
          style.card,
          isDark ? style.cardDark : style.cardLight
        )}
      >
        {boxTitle && (
          <div class={cx('card-header', style.cardHeader)}>
            <h3 class={cx('card-title', style.cardTitle)}>{boxTitle}</h3>
            {gatewayConnected === true && (
              <span class={cx('badge badge-info', style.plusBadge)}>
                <i class="fe fe-zap mr-1" />
                <Text id="integration.tags.gladysPlus" />
              </span>
            )}
          </div>
        )}
        <div class={cx('card-body', style.cardBody)}>
          {gatewayConnected === false && (
            <div class={style.upsellWrap}>
              <GladysPlusUpsellCard {...VOICE_ASSISTANT_UPSELL_PROPS} />
            </div>
          )}

          <div class={style.box}>
            <div class={cx(style.orbStage, (needsGladysPlus || micBlocked) && style.orbStageMuted)}>
              <div
                class={cx(style.orb, {
                  [style.orbIdle]: uiState === STATE.IDLE || uiState === STATE.ERROR,
                  [style.orbListening]: uiState === STATE.LISTENING,
                  [style.orbProcessing]: uiState === STATE.PROCESSING,
                  [style.orbSpeaking]: uiState === STATE.SPEAKING
                })}
              >
                <span class={style.ring1} aria-hidden="true" />
                <span class={style.ring2} aria-hidden="true" />
                <span class={style.ring3} aria-hidden="true" />
                <button
                  type="button"
                  class={style.orbButton}
                  onPointerDown={this.prepareVoiceRecording}
                  onClick={this.handleSpeakClick}
                  disabled={needsGladysPlus || micBlocked}
                  aria-live="polite"
                >
                  {uiState === STATE.LISTENING && (
                    <div class={style.visualizer} aria-hidden="true">
                      <span class={style.bar} />
                      <span class={style.bar} />
                      <span class={style.bar} />
                      <span class={style.bar} />
                      <span class={style.bar} />
                      <span class={style.bar} />
                      <span class={style.bar} />
                    </div>
                  )}
                  {uiState !== STATE.LISTENING && (
                    <i
                      class={cx(
                        'fe',
                        isBusy ? 'fe-square' : 'fe-mic',
                        'dark-mode-fe-none-filter',
                        style.micIcon,
                        isBusy && style.stopIcon
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <span class={style.orbLabel}>
                    <Text id={this.getButtonLabelKey()} />
                  </span>
                </button>
              </div>
              {uiState === STATE.LISTENING && (
                <p class={style.status}>
                  <Text id="dashboard.boxes.voice-assistant.listeningHint" />
                </p>
              )}
              {uiState === STATE.PROCESSING && (
                <p class={style.status}>
                  <Text id="dashboard.boxes.voice-assistant.processing" />
                </p>
              )}
              {uiState === STATE.SPEAKING && (
                <p class={style.status}>
                  <Text id="dashboard.boxes.voice-assistant.speaking" />
                </p>
              )}
            </div>
            {gatewayConnected === false && (
              <p class={style.plusRequiredHint}>
                <Text id="dashboard.boxes.voice-assistant.plusRequiredHint" />
              </p>
            )}
            {micBlocked && microphoneUnavailableReason === 'INSECURE_CONTEXT' && (
              <p class={style.plusRequiredHint}>
                <MarkupText id="dashboard.boxes.voice-assistant.errorInsecureContext" />
              </p>
            )}
            {micBlocked && microphoneUnavailableReason === 'NO_MICROPHONE' && (
              <p class={style.plusRequiredHint}>
                <Text id="dashboard.boxes.voice-assistant.errorNoMicrophone" />
              </p>
            )}
            {micBlocked &&
              microphoneUnavailableReason !== 'INSECURE_CONTEXT' &&
              microphoneUnavailableReason !== 'NO_MICROPHONE' && (
                <p class={style.plusRequiredHint}>
                  <Text id="dashboard.boxes.voice-assistant.errorNotSupported" />
                </p>
              )}

            {errorType === 'insecure' && (
              <p class={style.error}>
                <MarkupText id="dashboard.boxes.voice-assistant.errorInsecureContext" />
              </p>
            )}
            {errorType === 'permission' && (
              <p class={style.error}>
                <Text id="dashboard.boxes.voice-assistant.errorPermissionDenied" />
              </p>
            )}
            {errorType === 'unsupported' && (
              <p class={style.error}>
                <Text id="dashboard.boxes.voice-assistant.errorNotSupported" />
              </p>
            )}
            {errorType === 'no_microphone' && (
              <p class={style.error}>
                <Text id="dashboard.boxes.voice-assistant.errorNoMicrophone" />
              </p>
            )}
            {errorType === 'microphone_unavailable' && (
              <p class={style.error}>
                <Text id="dashboard.boxes.voice-assistant.errorMicrophoneUnavailable" />
              </p>
            )}
            {errorType === 'no_speech' && (
              <p class={style.error}>
                <Text id="dashboard.boxes.voice-assistant.errorNoSpeech" />
              </p>
            )}
            {errorType === 'no_transcription' && (
              <p class={style.error}>
                <Text id="dashboard.boxes.voice-assistant.errorNoTranscription" />
              </p>
            )}
            {errorType === 'http' && errorMessage && <p class={style.error}>{errorMessage}</p>}
            {errorType === 'http' && !errorMessage && (
              <p class={style.error}>
                <Text id="dashboard.boxes.voice-assistant.error" />
              </p>
            )}

            <div class={style.messages}>
              {transcription && (
                <div class={style.messageTranscription}>
                  <div class={style.messageLabel}>
                    <Text id="dashboard.boxes.voice-assistant.transcriptionLabel" />
                  </div>
                  {transcription}
                </div>
              )}
              {response && (
                <div class={style.messageResponse}>
                  <div class={style.messageLabel}>
                    <Text id="dashboard.boxes.voice-assistant.responseLabel" />
                  </div>
                  {response}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('user,session,httpClient,darkMode', {})(VoiceAssistantBox);
