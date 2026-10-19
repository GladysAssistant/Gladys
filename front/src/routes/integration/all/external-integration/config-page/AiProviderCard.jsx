import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

// The "next step" of an AI provider integration (capabilities/ai-type.md):
// installing it is not enough, an administrator has to select it as the AI
// provider of the instance. This card says whether it is the active provider
// and offers the selection right here, the install lands on this screen.
class AiProviderCard extends Component {
  state = {
    loaded: false,
    error: false,
    saving: false,
    activeSelector: null
  };

  load = async () => {
    this.setState({ loaded: false, error: false });
    try {
      const { selector } = await this.props.httpClient.get('/api/v1/ai_provider');
      this.setState({ loaded: true, activeSelector: selector });
    } catch (e) {
      console.error(e);
      this.setState({ error: true });
    }
  };

  useAsProvider = async () => {
    this.setState({ saving: true, error: false });
    try {
      const { selector } = await this.props.httpClient.post('/api/v1/ai_provider', {
        selector: this.props.integration.selector
      });
      this.setState({ activeSelector: selector, loaded: true });
    } catch (e) {
      console.error(e);
      this.setState({ error: true });
    }
    this.setState({ saving: false });
  };

  componentDidMount() {
    this.load();
  }

  render({ integration }, { loaded, error, saving, activeSelector }) {
    if (!loaded) {
      // the active / unused sentence is only known once the selection is
      // read: until then the card says it is checking, and on a failed read
      // it says so (with a retry) rather than "unused"
      if (error) {
        return (
          <div class="alert alert-warning">
            <i class="fe fe-alert-triangle mr-1" />
            <Text id="integration.externalIntegration.config.aiProviderLoadError" />{' '}
            <button type="button" class="btn btn-link p-0 align-baseline" onClick={this.load}>
              <Text id="integration.openai.aiProvider.retry" />
            </button>
          </div>
        );
      }
      return (
        <div class="alert alert-info">
          <i class="fe fe-loader mr-1" />
          <Text id="integration.externalIntegration.config.aiProviderChecking" />
        </div>
      );
    }
    const isActive = activeSelector === integration.selector;
    return (
      <div class={isActive ? 'alert alert-success' : 'alert alert-info'}>
        <i class={isActive ? 'fe fe-check mr-1' : 'fe fe-cpu mr-1'} />
        {isActive ? (
          <Text id="integration.externalIntegration.config.aiProviderActive" />
        ) : (
          <Text id="integration.externalIntegration.config.aiProviderInactive" />
        )}{' '}
        <Link href="/dashboard/integration/communication/openai">
          <Text id="integration.externalIntegration.config.aiProviderSettingsLink" />
        </Link>
        {error && (
          <p class="mb-0 mt-2 text-danger">
            <Text id="integration.externalIntegration.config.aiProviderError" />
          </p>
        )}
        {!isActive && (
          <div class="mt-2">
            <button type="button" class="btn btn-primary btn-sm" onClick={this.useAsProvider} disabled={saving}>
              <Text id="integration.externalIntegration.config.aiProviderUseButton" />
            </button>
          </div>
        )}
      </div>
    );
  }
}

export default AiProviderCard;
