import { Component, createRef } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import style from './style.css';

import { MUSIC, WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';

class MusicPlayerComponent extends Component {
  playRef = createRef();
  stopyRef = createRef();
  muteRef = createRef();
  nextRef = createRef();
  previousRef = createRef();
  randomRef = createRef();
  volumeRef = createRef();

  htmlForPause =
    '<path stroke="none" d="M0 0h24v24H0z" fill="none" /><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" />';
  htmlForPlay = '<path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 4v16l13 -8z" />';

  htmlForUnmute =
    '<path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 8a5 5 0 0 1 0 8" /><path d="M17.7 5a9 9 0 0 1 0 14" /><path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a0.8 .8 0 0 1 1.5 .5v14a0.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />';
  htmlForMute =
    '<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a0.8 .8 0 0 1 1.5 .5v14a0.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" /><path d="M16 10l4 4m0 -4l-4 4" />';

  playing = false;
  mutting = false;
  previousVolumeLevel;
  capabilities = {};

  next = async () => {
    await this.props.httpClient.get(`/api/v1/service/${this.state.selectedProvider.value}/next/default`);
  };
  previous = async () => {
    await this.props.httpClient.get(`/api/v1/service/${this.state.selectedProvider.value}/previous/default`);
  };
  stop = async () => {
    await this.props.httpClient.get(`/api/v1/music/stop/${this.state.selectedProvider.value}/default`);
    this.playRef.current.innerHTML = this.htmlForPlay;
    this.playing = false;
    this.setState({ musicCover: this.state.defaultMusicCover, currentMetadata: '' });
  };
  mute = async () => {
    if (!this.mutting) {
      await this.props.httpClient.get(`/api/v1/music/mute/${this.state.selectedProvider.value}/default`);
      this.muteRef.current.innerHTML = this.htmlForMute;
      this.mutting = true;
      this.previousVolumeLevel = this.volumeRef.value;
      this.volumeRef.current.value = 0;
    } else {
      await this.props.httpClient.get(`/api/v1/music/mute/${this.state.selectedProvider.value}/default`);
      this.muteRef.current.innerHTML = this.htmlForUnmute;
      this.mutting = false;
      this.volumeRef.current.value = this.previousVolumeLevel;
    }
  };
  random = async () => {
    await this.props.httpClient.get(`/api/v1/service/${this.state.selectedProvider.value}/random/default`);
  };
  volumeChange = async e => {
    await this.props.httpClient.get(
      `/api/v1/music/volume/${this.state.selectedProvider.value}/default/${e.target.value}`
    );
    if (e.target.value > 0.0) {
      this.mutting = false;
      this.muteRef.current.innerHTML = this.htmlForUnmute;
    }
    if (e.target.value == 0) {
      this.mutting = true;
      this.muteRef.current.innerHTML = this.htmlForMute;
    }
  };
  play = async () => {
    if (!this.playing) {
      await this.props.httpClient.get(
        `/api/v1/service/${this.state.selectedProvider.value}/play/default/${this.state.selectedPlaylist.value}/${this.volumeRef.current.value}`
      );
      this.playRef.current.innerHTML = this.htmlForPause;
      this.playing = true;
      this.updateMetadata();
    } else {
      await this.props.httpClient.get(`/api/v1/music/pause/${this.state.selectedProvider.value}/default`);
      this.playRef.current.innerHTML = this.htmlForPlay;
      this.playing = false;
    }
  };

  async getCapabilities() {
    this.capabilities = await this.props.httpClient.get(
      `/api/v1/service/${this.state.selectedProvider.value}/capabilities`
    );

    if (this.capabilities.random === MUSIC.PROVIDER.STATUS.ENABLED) {
      this.randomRef.current.style.visibility = 'visible';
    } else {
      this.randomRef.current.style.visibility = 'hidden';
    }
    if (this.capabilities.previous === MUSIC.PROVIDER.STATUS.ENABLED) {
      this.previousRef.current.style.visibility = 'visible';
    } else {
      this.previousRef.current.style.visibility = 'hidden';
    }
    if (this.capabilities.next === MUSIC.PROVIDER.STATUS.ENABLED) {
      this.nextRef.current.style.visibility = 'visible';
    } else {
      this.nextRef.current.style.visibility = 'hidden';
    }
  }
  async getSpeakerStatus() {
    const speakerStatus = await this.props.httpClient.get(`/api/v1/speaker/default/status`);
    if (speakerStatus && speakerStatus.provider === this.state.selectedProvider.value) {
      if (speakerStatus.play) {
        this.playRef.current.innerHTML = this.htmlForPause;
        this.playing = true;
      } else {
        this.playRef.current.innerHTML = this.htmlForPlay;
        this.playing = false;
      }

      if (speakerStatus.volumeLevel >= 0) {
        this.volumeRef.current.value = speakerStatus.volumeLevel;
        if (speakerStatus.volumeLevel > 0.0) {
          this.mutting = false;
          this.muteRef.current.innerHTML = this.htmlForUnmute;
        }
        if (speakerStatus.volumeLevel == 0) {
          this.mutting = true;
          this.muteRef.current.innerHTML = this.htmlForMute;
        }
      }
    } else {
      this.playRef.current.innerHTML = this.htmlForPlay;
      this.playing = false;
      this.volumeRef.current.value = 0.8;
      this.mutting = false;
      this.muteRef.current.innerHTML = this.htmlForUnmute;
    }
  }

  toggleDropdownProvider = () => {
    this.setState({
      dropdownProvider: !this.state.dropdownProvider
    });
  };
  toggleDropdownPlaylist = () => {
    this.setState({
      dropdownPlaylist: !this.state.dropdownPlaylist
    });
  };

  updateBoxAtFinish = () => {
    this.playRef.current.innerHTML = this.htmlForPlay;
    this.playing = false;
    this.getSpeakerStatus();
  };
  updateMetadata = payload => {
    let musicCover = this.state.defaultMusicCover;
    if (this.state.selectedPlaylist.cover) {
      musicCover = this.state.selectedPlaylist.cover;
    }

    let currentMetadata = '';
    if (payload && payload.provider === this.state.selectedProvider.value) {
      if (payload.cover) {
        const b64encoded = btoa(String.fromCharCode.apply(null, payload.cover.data.data));
        musicCover = `data:image/jpg;base64,${b64encoded}`;
      }

      if (payload.title) {
        currentMetadata += payload.title;
      }
      if (payload.artist) {
        if (currentMetadata.length > 0) {
          currentMetadata += ' - ';
        }
        currentMetadata += payload.artist;
      }
      if (payload.album) {
        if (currentMetadata.length > 0) {
          currentMetadata += ' - ';
        }
        currentMetadata += payload.album;
      }
    }

    this.setState({ musicCover, currentMetadata });
  };
  refreshOptions = () => {
    if (this.state.providers) {
      const providersOptions = this.state.providers.map(provider => {
        return {
          label: provider,
          value: provider
        };
      });
      if (this.state.playlists) {
        let selectedPlaylist;
        if (this.state.selectedProvider) {
          const playlistOptions = this.state.playlists.map((playlist, index) => {
            if (index === 0 || this.state.selectedPlaylist.value === playlist.value) {
              selectedPlaylist = this.buildSelectedPlaylist(playlist);
            }
            return {
              label: playlist.label,
              value: playlist.value
            };
          });

          this.setState({ selectedPlaylist, playlistOptions });
          if (selectedPlaylist && selectedPlaylist.cover) {
            this.setState({ musicCover: selectedPlaylist.cover });
          }
        }
      }
      this.setState({ providersOptions });
    }
  };

  getProviders = async () => {
    try {
      const response = await this.props.httpClient.get(`/api/v1/music/providers`);
      const providers = response ? response.providers : [];
      await this.setState({
        providers,
        error: false
      });
      this.refreshOptions();
    } catch (e) {
      this.setState({
        error: true
      });
    }
  };
  switchProvider = async e => {
    e.preventDefault();
    this.stop();
    const newProviderIndex = e.target.attributes['value'].value;
    const selectedProvider = this.state.providersOptions[newProviderIndex];
    await this.setState({
      selectedProvider,
      dropdownProvider: false,
      defaultMusicCover: `/assets/integrations/cover/${selectedProvider.value}.jpg`
    });
    await this.getPlaylists();
    await this.getCapabilities();
  };

  getPlaylists = async () => {
    try {
      if (this.state.selectedProvider.value) {
        const response = await this.props.httpClient.get(
          `/api/v1/service/${this.state.selectedProvider.value}/playlists`
        );
        const playlists = response ? response.playlists : [];
        await this.setState({
          playlists,
          error: false
        });
        this.refreshOptions();
      }
    } catch (e) {
      this.setState({
        error: true
      });
    }
  };
  buildSelectedPlaylist(playlist) {
    let selectedPlaylistLabel = playlist.label;
    if (selectedPlaylistLabel.length > 25) {
      selectedPlaylistLabel = `${selectedPlaylistLabel.slice(0, 22)} ...`;
    }
    let musicCover = this.state.defaultMusicCover;
    if (playlist.cover) {
      musicCover = playlist.cover;
    }
    return {
      label: selectedPlaylistLabel,
      value: playlist.value,
      cover: musicCover
    };
  }
  switchPlaylist = async e => {
    e.preventDefault();
    this.stop();
    const newPlaylistIndex = e.target.attributes['value'].value;
    await this.setState({
      selectedPlaylist: this.state.playlistOptions[newPlaylistIndex],
      dropdownPlaylist: false
    });
    this.refreshOptions();
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      musicCover: `/assets/integrations/cover/${this.props.box.provider}.jpg`,
      defaultMusicCover: `/assets/integrations/cover/${this.props.box.provider}.jpg`,
      selectedProvider: {
        label: this.props.box.provider,
        value: this.props.box.provider
      },
      providersOptions: [],
      selectedPlaylist: {
        label: '',
        value: this.props.box.playlist
      },
      playlistOptions: []
    };
  }

  componentDidMount() {
    this.getProviders();
    this.getPlaylists();
    this.getCapabilities();
    this.getSpeakerStatus();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.MUSIC.FINISH, this.updateBoxAtFinish);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.MUSIC.METADATA, this.updateMetadata);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.MUSIC.FINISH, this.updateBoxAtFinish);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.MUSIC.METADATA, this.updateMetadata);
  }

  render(
    props,
    {
      dropdownProvider,
      dropdownPlaylist,
      selectedProvider,
      providersOptions,
      selectedPlaylist,
      playlistOptions,
      musicCover,
      currentMetadata
    }
  ) {
    return (
      <div class="card">
        <div class={cx(style.metadataBox)}>
          {selectedProvider && (
            <img
              class={`card-img-top ${cx(style.imgMusic)}`}
              src={`${musicCover}`}
              alt={<Text id="global.logoAlt" />}
            />
          )}
          <div class={`p-2 input-group ${cx(style.metadataMusic)}`}>{currentMetadata}</div>
        </div>
        <div>
          <div class={`dropdown ${cx(style.dropdownSelectProvider)}`}>
            <a class="dropdown-toggle text-muted" onClick={this.toggleDropdownProvider}>
              {selectedProvider && (
                <img
                  src={`/assets/integrations/icons/${selectedProvider.label}.jpg`}
                  alt={<Text id="global.logoAlt" />}
                />
              )}
            </a>
            <div
              class={cx(style.dropdownProvider, {
                [style.show]: dropdownProvider
              })}
            >
              {providersOptions &&
                providersOptions.map((element, index) => {
                  return (
                    <a
                      class={cx(style.dropdownItemProvider, {
                        [style.active]: element.label === selectedProvider.label
                      })}
                      onClick={this.switchProvider}
                    >
                      <img src={`/assets/integrations/icons/${element.label}.jpg`} value={index} />
                    </a>
                  );
                })}
            </div>
          </div>
          <div class={`dropdown ${cx(style.dropdownSelectPlaylist)}`}>
            <a class={`dropdown-toggle text-muted ${cx(style.dropdownText)}`} onClick={this.toggleDropdownPlaylist}>
              {selectedPlaylist && selectedPlaylist.label}
            </a>
            <div
              class={cx(style.dropdownPlaylist, {
                [style.show]: dropdownPlaylist
              })}
            >
              {playlistOptions &&
                playlistOptions.map((element, index) => {
                  return (
                    <a
                      class={cx(style.dropdownItemPlaylist, {
                        [style.active]: element.label === selectedPlaylist.label
                      })}
                      onClick={this.switchPlaylist}
                      value={index}
                    >
                      {element.label}
                    </a>
                  );
                })}
            </div>
          </div>
        </div>

        <div class={`p-2 input-group ${cx(style.buttonBar)}`}>
          <div class="d-flex align-items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              ref={this.randomRef}
              onClick={this.random}
              class="icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
              visibility="hidden"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <circle cx="5" cy="18" r="2" />
              <circle cx="19" cy="6" r="2" />
              <path d="M19 8v5a5 5 0 0 1 -5 5h-3l3 -3m0 6l-3 -3" />
              <path d="M5 16v-5a5 5 0 0 1 5 -5h3l-3 -3m0 6l3 -3" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              ref={this.stopRef}
              onClick={this.stop}
              class="icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
          </div>
          <div class="d-flex align-items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              ref={this.previousRef}
              onClick={this.previous}
              class="icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
              visibility="hidden"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M20 5v14l-12 -7z" />
              <line x1="4" y1="5" x2="4" y2="19" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              ref={this.playRef}
              onClick={this.play}
              class="icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              ref={this.nextRef}
              onClick={this.next}
              class="icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
              visibility="hidden"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M4 5v14l12 -7z" />
              <line x1="20" y1="5" x2="20" y2="19" />
            </svg>
          </div>
          <div class="d-flex align-items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              ref={this.muteRef}
              onClick={this.mute}
              class="icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <input
              ref={this.volumeRef}
              type="range"
              class="custom-range"
              min={0}
              max={1}
              step={0.05}
              onChange={this.volumeChange}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient, session', {})(MusicPlayerComponent);
