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
  isSpeechRecordingSupported
} from '../../../utils/speechMicrophoneAccess';
import { preloadSpeechCommandRecorder } from '../../../utils/speechCommandRecorder';
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
  return 'unknown';
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
    microphoneAvailable: typeof window !== 'undefined' ? isSpeechRecordingSupported() : true
  };

  audioPlayer = null;

  messagesClearTimeout = null;

  _isMounted = false;

  voiceSessionGeneration = 0;

  activeVoiceAbortController = null;

  preloadVoiceRecorder = async () => {
    try {
      await preloadSpeechCommandRecorder();
    } catch (e) {}
  };

  componentDidMount() {
    this._isMounted = true;
    this.fetchGatewayStatus();
    if (isSpeechRecordingSupported()) {
      this.preloadVoiceRecorder();
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
    this.setState({
      uiState: STATE.ERROR,
      error: (payload && payload.message) || 'unknown'
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
      if (isAbortError(e) || !this.isVoiceSessionActive(voiceSessionGeneration)) {
        return;
      }
      console.error(e);
      this.clearMessagesClearTimeout();
      const { errorType, errorMessage } = getVoiceErrorState(e);
      this.safeSetState(
        {
          uiState: STATE.ERROR,
          errorType,
          errorMessage
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
    if (uiState === STATE.LISTENING) {
      return 'dashboard.boxes.voice-assistant.listening';
    }
    if (uiState === STATE.PROCESSING) {
      return 'dashboard.boxes.voice-assistant.processing';
    }
    if (uiState === STATE.SPEAKING) {
      return 'dashboard.boxes.voice-assistant.speaking';
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
    const { uiState, transcription, response, errorType, errorMessage, gatewayConnected, microphoneAvailable } = state;
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
                  onClick={this.handleSpeakClick}
                  disabled={isBusy || needsGladysPlus || micBlocked}
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
                    <i class={cx('fe', 'fe-mic', 'dark-mode-fe-none-filter', style.micIcon)} aria-hidden="true" />
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
            </div>
            {gatewayConnected === false && (
              <p class={style.plusRequiredHint}>
                <Text id="dashboard.boxes.voice-assistant.plusRequiredHint" />
              </p>
            )}
            {micBlocked &&
              (getSpeechRecordingUnavailableReason() === 'INSECURE_CONTEXT' ? (
                <p class={style.plusRequiredHint}>
                  <MarkupText id="dashboard.boxes.voice-assistant.errorInsecureContext" />
                </p>
              ) : (
                <p class={style.plusRequiredHint}>
                  <Text id="dashboard.boxes.voice-assistant.errorNotSupported" />
                </p>
              ))}

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
