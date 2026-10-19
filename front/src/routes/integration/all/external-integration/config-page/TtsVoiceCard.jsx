import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

import { WORKING_STATUSES } from '../../openai/TtsProviderSettings';

// Shown on the Configuration screen of a "tts" integration (spec:
// external-integrations/capabilities/tts-type.md): installing a
// text-to-speech provider does not make it the voice of the instance, the
// admin has to select it on the Artificial Intelligence page. This card
// says whether this integration is the active voice and links to the
// setting, which would otherwise be hard to discover from here. Being the
// active voice while stopped is a failure state (every announcement fails
// until the integration restarts), shown as a warning like on the AI page.
class TtsVoiceCard extends Component {
  getProviderConfiguration = async () => {
    try {
      const { active, providers } = await this.props.httpClient.get('/api/v1/tts/provider');
      const activeProvider = providers.find(provider => provider.provider === active) || null;
      this.setState({
        active,
        activeName: activeProvider ? activeProvider.name : active,
        activeStatus: activeProvider ? activeProvider.status : null
      });
    } catch (e) {
      console.error(e);
    }
  };

  componentDidMount() {
    this.getProviderConfiguration();
  }

  render({ serviceName }, { active, activeName, activeStatus }) {
    if (!active) {
      return null;
    }
    const isActiveVoice = active === serviceName;
    const isActiveButStopped = isActiveVoice && Boolean(activeStatus) && !WORKING_STATUSES.includes(activeStatus);
    // the stopped state uses the same alert box as the Voice card of the
    // Artificial Intelligence page (plain yellow text reads poorly on a card)
    let containerClass = 'text-muted';
    let icon = 'fe-volume-x';
    let textId = 'integration.externalIntegration.config.ttsVoiceInactive';
    if (isActiveButStopped) {
      containerClass = 'alert alert-warning mb-0';
      icon = 'fe-alert-triangle';
      textId = 'integration.externalIntegration.config.ttsVoiceActiveNotRunning';
    } else if (isActiveVoice) {
      containerClass = 'text-success';
      icon = 'fe-check-circle';
      textId = 'integration.externalIntegration.config.ttsVoiceActive';
    }
    return (
      <div class="card">
        <div class="card-body">
          <div class={containerClass}>
            <i class={`fe ${icon} mr-1`} />
            <Text id={textId} fields={{ name: activeName }} />
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
