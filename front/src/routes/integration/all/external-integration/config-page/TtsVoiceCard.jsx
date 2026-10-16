import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

// Shown on the Configuration screen of a "tts" integration (spec:
// external-integrations/capabilities/tts-type.md): installing a
// text-to-speech provider does not make it the voice of the instance, the
// admin has to select it on the Artificial Intelligence page. This card
// says whether this integration is the active voice and links to the
// setting, which would otherwise be hard to discover from here.
class TtsVoiceCard extends Component {
  getProviderConfiguration = async () => {
    try {
      const { active, providers } = await this.props.httpClient.get('/api/v1/tts/provider');
      const activeProvider = providers.find(provider => provider.provider === active) || null;
      this.setState({ active, activeName: activeProvider ? activeProvider.name : active });
    } catch (e) {
      console.error(e);
    }
  };

  componentDidMount() {
    this.getProviderConfiguration();
  }

  render({ serviceName }, { active, activeName }) {
    if (!active) {
      return null;
    }
    const isActiveVoice = active === serviceName;
    return (
      <div class="card">
        <div class="card-body">
          <div class={isActiveVoice ? 'text-success' : 'text-muted'}>
            <i class={`fe ${isActiveVoice ? 'fe-check-circle' : 'fe-volume-x'} mr-1`} />
            {isActiveVoice ? (
              <Text id="integration.externalIntegration.config.ttsVoiceActive" />
            ) : (
              <Text id="integration.externalIntegration.config.ttsVoiceInactive" fields={{ name: activeName }} />
            )}
          </div>
          <Link href="/dashboard/integration/communication/openai" class="btn btn-outline-primary btn-sm mt-3">
            <i class="fe fe-mic mr-1" />
            <Text id="integration.externalIntegration.config.ttsVoiceChangeLink" />
          </Link>
        </div>
      </div>
    );
  }
}

export default TtsVoiceCard;
