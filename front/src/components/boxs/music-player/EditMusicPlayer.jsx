import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';
import BaseEditBox from '../baseEditBox';

class EditMusicPlayer extends Component {
  updateBoxProvider = provider => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      provider: provider.value
    });
    this.props.box.provider = provider.value;
    this.getPlaylists();
  };
  updateBoxPlaylist = playlist => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      playlist: playlist.value
    });
  };

  refreshOptions = () => {
    if (this.state.providers) {
      let selectedProvider;
      const providersOptions = this.state.providers.map(provider => {
        if (this.props.box.provider === provider) {
          selectedProvider = {
            label: provider,
            value: provider
          };
        }
        return {
          label: provider,
          value: provider
        };
      });
      if (this.state.playlists) {
        let selectedPlaylist;
        if (selectedProvider) {
          const playlistOptions = this.state.playlists.map(playlist => {
            if (this.props.box.playlist === playlist.value) {
              selectedPlaylist = {
                label: playlist.label,
                value: playlist.value
              };
            }
            return {
              label: playlist.label,
              value: playlist.value
            };
          });

          this.setState({ selectedPlaylist, playlistOptions });
        }
      }

      this.setState({ providersOptions, selectedProvider });
    }
  };

  getProviders = async () => {
    try {
      await this.setState({ loading: true });
      const response = await this.props.httpClient.get(`/api/v1/music/providers`);
      const providers = response ? response.providers : [];
      await this.setState({
        providers,
        loading: false,
        error: false
      });
      this.refreshOptions();
    } catch (e) {
      this.setState({
        loading: false,
        error: true
      });
    }
  };

  getPlaylists = async () => {
    try {
      if (this.props.box.provider) {
        await this.setState({ loading: true });
        const response = await this.props.httpClient.get(`/api/v1/service/${this.props.box.provider}/playlists`);
        const playlists = response ? response.playlists : [];
        await this.setState({
          playlists,
          loading: false,
          error: false
        });
        this.refreshOptions();
      }
    } catch (e) {
      this.setState({
        loading: false,
        error: true
      });
    }
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      users: [],
      selectedUsers: [],
      loading: false
    };
  }

  componentDidMount = () => {
    this.getProviders();
    this.getPlaylists();
  };

  componentWillReceiveProps() {
    this.refreshOptions();
  }

  render(props, { selectedProvider, providersOptions, selectedPlaylist, playlistOptions, loading }) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.music-player">
        <div class={loading ? 'dimmer active' : 'dimmer'}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.musicPlayer.editProviderLabel" />
              </label>
              <Select value={selectedProvider} options={providersOptions} onChange={this.updateBoxProvider} />
            </div>
            {providersOptions && props.box.provider && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.musicPlayer.editPlaylistLabel" />
                </label>
                <Select value={selectedPlaylist} onChange={this.updateBoxPlaylist} options={playlistOptions} />
              </div>
            )}
          </div>
        </div>
      </BaseEditBox>
    );
  }
}

export default connect('httpClient', {})(EditMusicPlayer);
