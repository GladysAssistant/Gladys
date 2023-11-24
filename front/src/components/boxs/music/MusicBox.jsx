import { Component } from 'preact';
import { connect } from 'unistore/preact';

import { DEVICE_FEATURE_TYPES, MUSIC_PLAYBACK_STATE } from '../../../../../server/utils/constants';

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
      const isPlaying = playBackStateFeature.value === MUSIC_PLAYBACK_STATE.PLAYING;
      this.setState({
        musicDevice,
        playFeature,
        pauseFeature,
        previousFeature,
        nextFeature,
        volumeFeature,
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
    await this.setValueDevice(this.state.playFeature, 1);
  };
  pause = async () => {
    await this.setValueDevice(this.state.pauseFeature, 1);
  };
  next = async () => {
    await this.setValueDevice(this.state.nextFeature, 1);
  };
  previous = async () => {
    await this.setValueDevice(this.state.previousFeature, 1);
  };
  changeVolume = async e => {
    const volume = e.target.value;
    await this.setValueDevice(this.state.volumeFeature, parseInt(volume, 10));
  };

  componentDidMount() {
    this.getDevice();
  }

  render(props, { isPlaying }) {
    return (
      <div class="card p-4">
        <div class="row">
          <div class="col">
            <button class="btn btn-block btn-secondary">
              <i class="fe fe-skip-back" />
            </button>
          </div>
          <div class="col">
            <button class="btn btn-block btn-secondary">
              {!isPlaying && <i class="fe fe-play" />}
              {isPlaying && <i class="fe fe-pause" />}
            </button>
          </div>
          <div class="col">
            <button class="btn btn-block btn-secondary">
              <i class="fe fe-skip-forward" />
            </button>
          </div>
        </div>
        <div class="row">
          <div class="col">
            <input
              type="range"
              value={this.state.volume}
              onChange={this.handleVolumeChange}
              class="form-control custom-range"
              step="1"
              min="0"
              max="100"
            />
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(MusicComponent);
