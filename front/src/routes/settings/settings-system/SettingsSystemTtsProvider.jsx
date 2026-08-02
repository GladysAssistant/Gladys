import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';

const GLADYS_PLUS_PROVIDER = 'gladys-plus';

// The voice of the instance: Gladys Plus by default, or any installed TTS
// provider integration (external integrations of type "tts"). Scene
// announcements and the voice assistant speak through the active provider.
class SettingsSystemTtsProvider extends Component {
  buildOptions = providers =>
    providers.map(({ provider }) => ({
      value: provider,
      label: provider === GLADYS_PLUS_PROVIDER ? 'Gladys Plus' : provider
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
    this.setState({
      selectedProvider: option
    });
    try {
      await this.props.httpClient.post('/api/v1/tts/provider', {
        provider: option.value
      });
    } catch (e) {
      console.error(e);
    }
  };

  componentDidMount() {
    this.getProviderConfiguration();
  }

  render({}, { options = [], selectedProvider }) {
    return (
      <div class="card">
        <h4 class="card-header">
          <Text id="systemSettings.ttsProvider" />
        </h4>

        <div class="card-body">
          <form className="">
            <p>
              <Text id="systemSettings.ttsProviderText" />
            </p>
            <Select
              options={options}
              onChange={this.updateProvider}
              value={selectedProvider}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </form>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', null)(SettingsSystemTtsProvider);
