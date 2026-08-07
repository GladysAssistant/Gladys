import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';

// The voice of the instance: Gladys Plus by default, or any installed TTS
// provider integration (external integrations of type "tts"). Scene
// announcements and the voice assistant speak through the active provider.
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
      await this.props.httpClient.post('/api/v1/tts/provider', {
        provider: option.value
      });
      this.setState({ selectedProvider: option });
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

  render({}, { options = [], selectedProvider, isUpdatingProvider }) {
    return (
      <div class="card">
        <h4 class="card-header">
          <Text id="integration.openai.ttsProvider" />
        </h4>

        <div class="card-body">
          <form className="">
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
          </form>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', null)(TtsProviderSettings);
