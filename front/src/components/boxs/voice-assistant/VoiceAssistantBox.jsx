import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import GladysPlusUpsell from '../../gateway/GladysPlusUpsell';
import { recordUntilSilence, blobToBase64 } from '../../../utils/recordUntilSilence';
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

  componentDidMount() {
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
      this.setState({ transcription: '', response: '' });
    }, MESSAGES_CLEAR_DELAY_MS);
  };

  fetchGatewayStatus = async () => {
    try {
      const status = await this.props.httpClient.get('/api/v1/gateway/status');
      this.setState({ gatewayConnected: status.configured === true });
    } catch (e) {
      this.setState({ gatewayConnected: false });
    }
  };

  onTranscriptionWebsocket = payload => {
    if (payload && payload.text) {
      this.setState({ transcription: payload.text });
    }
  };

  onResponseWebsocket = payload => {
    if (payload && payload.text) {
      this.setState({ response: payload.text });
    }
  };

  onProcessingWebsocket = payload => {
    if (!payload) {
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
    this.clearMessagesClearTimeout();
    this.setState({
      uiState: STATE.ERROR,
      error: (payload && payload.message) || 'unknown'
    });
  };

  playTts = async ttsUrl => {
    if (!ttsUrl) {
      this.setState({ uiState: STATE.IDLE });
      this.scheduleMessagesClear();
      return;
    }
    this.setState({ uiState: STATE.SPEAKING });
    try {
      if (this.audioPlayer) {
        this.audioPlayer.pause();
      }
      this.audioPlayer = new Audio(ttsUrl);
      this.audioPlayer.onended = () => {
        this.setState({ uiState: STATE.IDLE });
        this.scheduleMessagesClear();
      };
      await this.audioPlayer.play();
    } catch (e) {
      console.error(e);
      this.setState({ uiState: STATE.IDLE });
      this.scheduleMessagesClear();
    }
  };

  handleSpeakClick = async () => {
    const { uiState } = this.state;
    if (uiState !== STATE.IDLE && uiState !== STATE.ERROR) {
      return;
    }

    this.clearMessagesClearTimeout();
    this.setState({
      uiState: STATE.LISTENING,
      transcription: '',
      response: '',
      error: null
    });

    try {
      const audioBlob = await recordUntilSilence();
      this.setState({ uiState: STATE.PROCESSING });
      const audioBase64 = await blobToBase64(audioBlob);

      const result = await this.props.httpClient.post('/api/v1/gateway/voice', {
        audio: audioBase64
      });

      if (result.transcription) {
        this.setState({ transcription: result.transcription });
      }
      if (result.answer) {
        this.setState({ response: result.answer });
      }

      await this.playTts(result.ttsUrl);
    } catch (e) {
      console.error(e);
      this.clearMessagesClearTimeout();
      this.setState({
        uiState: STATE.ERROR,
        error: getHttpErrorMessage(e)
      });
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
