import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import Select from 'react-select';

import { SERVICE_STATUS } from '../../../../../../server/utils/constants';

export const GLADYS_PLUS_PROVIDER = 'gladys-plus';
// an integration provider answers synthesis requests in these statuses only
export const WORKING_STATUSES = [SERVICE_STATUS.RUNNING, SERVICE_STATUS.DEGRADED];

// The voice of the instance: Gladys Plus by default, or any installed TTS
// provider integration (external integrations of type "tts"). Scene
// announcements and the voice assistant speak through the active provider.
// The card says when the selected voice cannot speak — Gladys Plus without
// a subscription, a stopped integration — instead of leaving the failure
// to the server log.
class TtsProviderSettings extends Component {
  // the API provides a display name per provider (the integration's
  // manifest name), so the select matches the Integrations UI
  buildOptions = providers =>
    providers.map(({ provider, name }) => ({
      value: provider,
      label: name || provider
    }));

  getProviderConfiguration = async () => {
    try {
      const { active, providers } = await this.props.httpClient.get('/api/v1/tts/provider');
      const options = this.buildOptions(providers);
      this.setState({
        active,
        providers,
        options,
        selectedProvider: options.find(option => option.value === active) || null
      });
    } catch (e) {
      console.error(e);
    }
  };

  updateProvider = async option => {
    // commit the selection only once the server accepted it: an optimistic
    // update would show a provider that is not actually active on failure
    this.setState({ isUpdatingProvider: true });
    try {
      const { active, providers } = await this.props.httpClient.post('/api/v1/tts/provider', {
        provider: option.value
      });
      this.setState({ active, providers, selectedProvider: option });
    } catch (e) {
      console.error(e);
      await this.getProviderConfiguration();
    } finally {
      this.setState({ isUpdatingProvider: false });
    }
  };

  componentDidMount() {
    this.getProviderConfiguration();
  }

  render({ gladysPlusConnected }, { active, providers = [], options = [], selectedProvider, isUpdatingProvider }) {
    const activeProvider = providers.find(provider => provider.provider === active);
    const activeIsGladysPlus = active === GLADYS_PLUS_PROVIDER;
    // the configuration is loaded and the stored selector matches nothing
    // the server lists any more (the provider lost its tts capability)
    const activeIsUnavailable = Boolean(active) && !activeProvider;
    const activeIsStopped =
      Boolean(activeProvider) &&
      !activeIsGladysPlus &&
      Boolean(activeProvider.status) &&
      !WORKING_STATUSES.includes(activeProvider.status);
    const onlyGladysPlus = providers.length === 1 && activeIsGladysPlus;
    return (
      <div class="card">
        <h4 class="card-header">
          <Text id="integration.openai.ttsProvider" />
        </h4>

        <div class="card-body">
          <p>
            <Text id="integration.openai.ttsProviderText" />
          </p>
          <Select
            options={options}
            onChange={this.updateProvider}
            value={selectedProvider}
            isDisabled={isUpdatingProvider}
            className="react-select-container"
            classNamePrefix="react-select"
          />
          {activeIsGladysPlus && gladysPlusConnected === false && (
            <div class="alert alert-warning mt-3 mb-0">
              <i class="fe fe-alert-triangle mr-1" />
              <Text id="integration.openai.ttsProviderPlusNotConnected" />{' '}
              <Link href="/dashboard/integration/assistants">
                <Text id="integration.openai.ttsProviderBrowseCatalog" />
              </Link>
            </div>
          )}
          {activeIsStopped && (
            <div class="alert alert-warning mt-3 mb-0">
              <i class="fe fe-alert-triangle mr-1" />
              <Text id="integration.openai.ttsProviderNotRunning" fields={{ name: activeProvider.name }} />{' '}
              <Link href={`/dashboard/integration/device/external/${activeProvider.selector}/supervision`}>
                <Text id="integration.openai.ttsProviderOpenIntegration" />
              </Link>
            </div>
          )}
          {activeIsUnavailable && (
            <div class="alert alert-warning mt-3 mb-0">
              <i class="fe fe-alert-triangle mr-1" />
              <Text id="integration.openai.ttsProviderUnavailable" fields={{ provider: active }} />
            </div>
          )}
          {onlyGladysPlus && gladysPlusConnected !== false && (
            <p class="text-muted small mt-3 mb-0">
              <Text id="integration.openai.ttsProviderInstallHint" />{' '}
              <Link href="/dashboard/integration/assistants">
                <Text id="integration.openai.ttsProviderBrowseCatalog" />
              </Link>
            </p>
          )}
        </div>
      </div>
    );
  }
}

export default connect('httpClient', null)(TtsProviderSettings);
