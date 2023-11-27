import { Component } from 'preact';
import { connect } from 'unistore/preact';

import {
  WEBSOCKET_MESSAGE_TYPES,
  DEVICE_FEATURE_TYPES,
  MUSIC_PLAYBACK_STATE
} from '../../../../../server/utils/constants';

class MusicComponent extends Component {
  state = {
    isPlaying: null
  };
  getDevice = async () => {
    try {
      await this.setState({
        error: false
      });
      const musicDevice = await this.props.httpClient.get(`/api/v1/device/${this.props.box.device}`, {});
      const playFeature = musicDevice.features.find(f => f.type === DEVICE_FEATURE_TYPES.MUSIC.PLAY);
      const pauseFeature = musicDevice.features.find(f => f.type === DEVICE_FEATURE_TYPES.MUSIC.PAUSE);
      const previousFeature = musicDevice.features.find(f => f.type === DEVICE_FEATURE_TYPES.MUSIC.PREVIOUS);
      const nextFeature = musicDevice.features.find(f => f.type === DEVICE_FEATURE_TYPES.MUSIC.NEXT);
      const volumeFeature = musicDevice.features.find(f => f.type === DEVICE_FEATURE_TYPES.MUSIC.VOLUME);
      const playBackStateFeature = musicDevice.features.find(f => f.type === DEVICE_FEATURE_TYPES.MUSIC.PLAYBACK_STATE);
      const isPlaying = playBackStateFeature.last_value === MUSIC_PLAYBACK_STATE.PLAYING;
      this.setState({
        musicDevice,
        playFeature,
        pauseFeature,
        previousFeature,
        nextFeature,
        volumeFeature,
        playBackStateFeature,
        isPlaying
      });
    } catch (e) {
      console.error(e);
      this.setState({
        error: true
      });
    }
  };

  setValueDevice = async (deviceFeature, value) => {
    try {
      await this.setState({ error: false });
      await this.props.httpClient.post(`/api/v1/device_feature/${deviceFeature.selector}/value`, {
        value
      });
    } catch (e) {
      console.error(e);
      this.setState({ error: true });
    }
  };

  play = async () => {
    await this.setState({ isPlaying: true });
    await this.setValueDevice(this.state.playFeature, 1);
  };
  pause = async () => {
    await this.setState({ isPlaying: false });
    await this.setValueDevice(this.state.pauseFeature, 1);
  };
  next = async () => {
    await this.setValueDevice(this.state.nextFeature, 1);
  };
  previous = async () => {
    await this.setValueDevice(this.state.previousFeature, 1);
  };
  changeVolume = async e => {
    const volume = parseInt(e.target.value, 10);
    const newVolumeFeature = { ...this.state.volumeFeature, last_value: volume };
    await this.setState({ volumeFeature: newVolumeFeature });
    await this.setValueDevice(this.state.volumeFeature, volume, 10);
  };

  updateDeviceStateWebsocket = payload => {
    if (payload.device_feature_selector === this.state.playBackStateFeature.selector) {
      const isPlaying = payload.last_value === MUSIC_PLAYBACK_STATE.PLAYING;
      this.setState({ isPlaying });
    }
    if (payload.device_feature_selector === this.state.volumeFeature.selector) {
      const newVolumeFeature = { ...this.state.volumeFeature, last_value: payload.last_value };
      this.setState({ volumeFeature: newVolumeFeature });
    }
  };

  componentDidMount() {
    this.getDevice();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
  }

  render(props, { isPlaying, musicDevice, previousFeature, nextFeature, volumeFeature }) {
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{musicDevice && musicDevice.name}</h3>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col">
              {previousFeature && (
                <button class="btn btn-block btn-secondary" onClick={this.previous}>
                  <i class="fe fe-skip-back" />
                </button>
              )}
            </div>
            <div class="col">
              {!isPlaying && (
                <button class="btn btn-block btn-secondary" onClick={this.play}>
                  <i class="fe fe-play" />
                </button>
              )}
              {isPlaying && (
                <button class="btn btn-block btn-secondary" onClick={this.pause}>
                  <i class="fe fe-pause" />
                </button>
              )}
            </div>
            <div class="col">
              {nextFeature && (
                <button class="btn btn-block btn-secondary" onClick={this.next}>
                  <i class="fe fe-skip-forward" />
                </button>
              )}
            </div>
          </div>
          {volumeFeature && (
            <div class="row mt-4">
              <div class="col">
                <input
                  type="range"
                  value={volumeFeature.last_value}
                  onChange={this.changeVolume}
                  class="form-control"
                  step="1"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default connect('httpClient,session', {})(MusicComponent);
