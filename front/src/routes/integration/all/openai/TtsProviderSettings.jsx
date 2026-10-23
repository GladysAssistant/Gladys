import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

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
  getProviderConfiguration = async () => {
    try {
      const { active, providers } = await this.props.httpClient.get('/api/v1/tts/provider');
      this.setState({ active, providers });
    } catch (e) {
      console.error(e);
    }
  };

  updateProvider = async e => {
    // commit the selection only once the server accepted it: an optimistic
    // update would show a provider that is not actually active on failure
    this.setState({ isUpdatingProvider: true });
    try {
      const { active, providers } = await this.props.httpClient.post('/api/v1/tts/provider', {
        provider: e.target.value
      });
      this.setState({ active, providers });
    } catch (error) {
      console.error(error);
      await this.getProviderConfiguration();
    } finally {
      this.setState({ isUpdatingProvider: false });
    }
  };

  componentDidMount() {
    this.getProviderConfiguration();
  }

  render({ gladysPlusConnected }, { active, providers = [], isUpdatingProvider }) {
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
      <div class="card mt-4">
        <h4 class="card-header">
          <Text id="integration.openai.ttsProvider" />
        </h4>

        <div class="card-body">
          <p>
            <Text id="integration.openai.ttsProviderText" />
          </p>
          <div class="form-group mb-0">
            <label class="form-label" for="tts-provider-select">
              <Text id="integration.openai.ttsProviderSelectLabel" />
            </label>
            <select
              id="tts-provider-select"
              class="form-control"
              value={active}
              onChange={this.updateProvider}
              disabled={!active || isUpdatingProvider}
            >
              {providers.map(({ provider, name }) => (
                <option key={provider} value={provider}>
                  {name || provider}
                </option>
              ))}
              {activeIsUnavailable && (
                <option value={active} disabled>
                  {active}
                </option>
              )}
            </select>
          </div>
          {activeIsGladysPlus && gladysPlusConnected === false && (
            <div class="alert alert-warning mt-3 mb-0">
              <i class="fe fe-alert-triangle mr-1" />
              <Text id="integration.openai.ttsProviderPlusNotConnected" />{' '}
              {/* a direct link rather than "above": the Gladys Plus card of
                  this page is hidden while an external AI provider answers */}
              <Link href="/dashboard/settings/gateway">
                <Text id="integration.openai.ttsProviderPlusSettingsLink" />
              </Link>{' '}
              <Text id="integration.openai.ttsProviderPlusNotConnectedOr" />{' '}
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
