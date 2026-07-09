import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { connect } from 'unistore/preact';

const languageToFlag = {
  en: '🇬🇧',
  fr: '🇫🇷',
  de: '🇩🇪',
  es: '🇪🇸',
  pt: '🇵🇹'
};

class VoiceBox extends Component {
  componentWillMount() {
    this.setState({
      voice: this.props.voice
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      voice: nextProps.voice
    });
  }

  render({ voiceSelected, updateVoice }, { voice }) {
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            {voice.name} {languageToFlag[voice.language]}
            <div class="page-options d-flex">
              <button
                onClick={updateVoice}
                data-voice-id={voice.id}
                class={cx('btn', { 'btn-outline-primary': !voiceSelected }, { 'btn-primary': voiceSelected }, 'ml-2')}
                disabled={voiceSelected}
              >
                <Text id={`integration.gradium.${voiceSelected ? 'voiceUsed' : 'voiceUseIt'}`} />
              </button>
            </div>
          </div>
          <div class="dimmer">
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.gradium.voiceDescriptionLabel" />
                  </label>
                  <Text id={`name_${voice.id}`}>{voice.description}</Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(VoiceBox);
