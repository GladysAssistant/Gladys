import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import GladysPlusUpsell from '../../gateway/GladysPlusUpsell';
import { isRecordUntilSilenceAbortError, recordUntilSilence } from '../../../utils/recordUntilSilence';
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

class VoiceAssistantBox extends Component {
  state = {
    uiState: STATE.IDLE,
    transcription: '',
    response: '',
    error: null,
    gatewayConnected: null
  };

  audioPlayer = null;

  messagesClearTimeout = null;

  _isMounted = false;

  voiceSessionGeneration = 0;

  activeVoiceAbortController = null;

  componentDidMount() {
    this._isMounted = true;
    this.fetchGatewayStatus();
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
      if (this.audioPlayer) {
        this.audioPlayer.onended = null;
        this.audioPlayer.pause();
      }
      this.audioPlayer = new Audio(ttsUrl);
      this.audioPlayer.onended = () => {
        if (!this.isVoiceSessionActive(voiceSessionGeneration)) {
          return;
        }
        this.safeSetState({ uiState: STATE.IDLE }, voiceSessionGeneration);
        this.scheduleMessagesClear();
      };
      await this.audioPlayer.play();
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
    this.safeSetState(
      {
        uiState: STATE.LISTENING,
        transcription: '',
        response: '',
        error: null
      },
      voiceSessionGeneration
    );

    try {
      const audioBlob = await recordUntilSilence({ signal: abortController.signal });
      if (!this.isVoiceSessionActive(voiceSessionGeneration)) {
        return;
      }

      this.safeSetState({ uiState: STATE.PROCESSING }, voiceSessionGeneration);

      const result = await this.props.httpClient.postBinary(
        '/api/v1/gateway/voice',
        audioBlob,
        audioBlob.type || 'application/octet-stream',
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
      this.safeSetState(
        {
          uiState: STATE.ERROR,
          error: getHttpErrorMessage(e)
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
    const { uiState, transcription, response, error, gatewayConnected } = state;
    const boxTitle = props.box.name;
    const isBusy = uiState === STATE.LISTENING || uiState === STATE.PROCESSING || uiState === STATE.SPEAKING;
    const isDark = this.isDarkTheme();

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
          </div>
        )}
        <div class={cx('card-body', style.cardBody)}>
          {gatewayConnected === false && (
            <div class={style.upsellWrap}>
              <GladysPlusUpsell
                httpClient={props.httpClient}
                utmCampaign="dashboard_voice_assistant"
                titleKey="dashboard.boxes.voice-assistant.upsellTitle"
                descriptionKey="dashboard.boxes.voice-assistant.upsellDescription"
                featureKeys={[
                  'dashboard.boxes.voice-assistant.upsellFeature1',
                  'dashboard.boxes.voice-assistant.upsellFeature2',
                  'dashboard.boxes.voice-assistant.upsellFeature3'
                ]}
              />
            </div>
          )}

          <div class={style.box}>
            <div class={style.orbStage}>
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
                  disabled={isBusy || gatewayConnected === false}
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

            {error && (
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
