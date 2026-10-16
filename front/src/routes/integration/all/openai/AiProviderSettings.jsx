import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { Link } from 'preact-router/match';
import { SERVICE_STATUS } from '../../../../../../server/utils/constants';

// The AI provider of the instance: Gladys Plus by default, or any installed
// external integration of manifest type "ai" (Claude, DeepSeek, OpenAI, a
// local LLM... the integration adapts to its provider, the core stays
// provider-agnostic). Saving is immediate, like the other settings cards.
const GLADYS_PLUS_VALUE = 'gladys-plus';

class AiProviderSettings extends Component {
  state = {
    loaded: false,
    loadError: false,
    saveError: false,
    saving: false,
    selector: null,
    providers: []
  };

  getAiProvider = async () => {
    this.setState({ loaded: false, loadError: false });
    try {
      const { selector, providers } = await this.props.httpClient.get('/api/v1/ai_provider');
      this.setState({ loaded: true, selector, providers: providers || [] });
    } catch (e) {
      console.error(e);
      this.setState({ loadError: true });
    }
  };

  updateProvider = async e => {
    const newSelector = e.target.value === GLADYS_PLUS_VALUE ? null : e.target.value;
    const previousSelector = this.state.selector;
    this.setState({ saving: true, saveError: false, selector: newSelector });
    try {
      const { selector, providers } = await this.props.httpClient.post('/api/v1/ai_provider', {
        selector: newSelector
      });
      this.setState({ selector, providers: providers || [] });
      // let the parent page refresh its Plus upsell/rate-limit messaging
      if (this.props.onProviderChange) {
        this.props.onProviderChange(selector);
      }
    } catch (error) {
      console.error(error);
      this.setState({ selector: previousSelector, saveError: true });
    }
    this.setState({ saving: false });
  };

  componentDidMount() {
    this.getAiProvider();
  }

  render({}, { loaded, loadError, saveError, saving, selector, providers }) {
    const selectedProvider = providers.find(provider => provider.selector === selector);
    return (
      <div class="card mt-4">
        <h4 class="card-header">
          <Text id="integration.openai.aiProvider.title" />
        </h4>
        <div class="card-body">
          <p>
            <Text id="integration.openai.aiProvider.description" />
          </p>
          {loadError && (
            <div class="alert alert-danger" role="alert">
              <Text id="integration.openai.aiProvider.loadError" />
              <button type="button" class="btn btn-sm btn-outline-danger ml-3" onClick={this.getAiProvider}>
                <Text id="integration.openai.aiProvider.retry" />
              </button>
            </div>
          )}
          {saveError && (
            <div class="alert alert-danger" role="alert">
              <Text id="integration.openai.aiProvider.saveError" />
            </div>
          )}
          <div class="form-group">
            <label class="form-label" for="ai-provider-select">
              <Text id="integration.openai.aiProvider.selectLabel" />
            </label>
            <select
              id="ai-provider-select"
              class="form-control"
              value={selector || GLADYS_PLUS_VALUE}
              onChange={this.updateProvider}
              disabled={!loaded || loadError || saving}
            >
              <option value={GLADYS_PLUS_VALUE}>
                <Text id="integration.openai.aiProvider.gladysPlusOption" />
              </option>
              {providers.map(provider => (
                <option key={provider.selector} value={provider.selector}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>
          {loaded && providers.length === 0 && (
            <p class="text-muted small mb-0">
              <Text id="integration.openai.aiProvider.noProvider" />
            </p>
          )}
          {selector && (
            <div class="alert alert-warning" role="alert">
              <i class="fe fe-alert-triangle mr-1" />
              <Text id="integration.openai.aiProvider.trustWarning" />
            </div>
          )}
          {selectedProvider && selectedProvider.status !== SERVICE_STATUS.RUNNING && (
            <div class="alert alert-warning mb-0" role="alert">
              <i class="fe fe-alert-triangle mr-1" />
              <Text id="integration.openai.aiProvider.providerNotRunning" />{' '}
              <Link href={`/dashboard/integration/device/external/${selectedProvider.selector}/config`}>
                <Text id="integration.openai.aiProvider.providerNotRunningLink" />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(AiProviderSettings);
