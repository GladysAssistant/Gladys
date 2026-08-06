import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';

import {
  WEBSOCKET_MESSAGE_TYPES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_CATEGORIES
} from '../../../../../server/utils/constants';

const getVolumePercent = volumeFeature => {
  if (!volumeFeature || volumeFeature.last_value === null || volumeFeature.last_value === undefined) {
    return 0;
  }
  const min = volumeFeature.min ?? 0;
  const max = volumeFeature.max ?? 100;
  if (max === min) {
    return 0;
  }
  return Math.round(((volumeFeature.last_value - min) / (max - min)) * 100);
};

class TelevisionBoxComponent extends Component {
  state = {
    isPlaying: false,
    showRemote: false
  };

  getDevice = async () => {
    try {
      await this.setState({
        error: false
      });
      const televisionDevice = await this.props.httpClient.get(`/api/v1/device/${this.props.box.device}`, {});
      const features = televisionDevice.features;

      this.setState({
        televisionDevice,
        playFeature: features.find(f => f.type === DEVICE_FEATURE_TYPES.TELEVISION.PLAY),
        pauseFeature: features.find(f => f.type === DEVICE_FEATURE_TYPES.TELEVISION.PAUSE),
        stopFeature: features.find(f => f.type === DEVICE_FEATURE_TYPES.TELEVISION.STOP),
        previousFeature: features.find(f => f.type === DEVICE_FEATURE_TYPES.TELEVISION.PREVIOUS),
        nextFeature: features.find(f => f.type === DEVICE_FEATURE_TYPES.TELEVISION.NEXT),
        volumeFeature: features.find(f => f.type === DEVICE_FEATURE_TYPES.TELEVISION.VOLUME),
        powerFeature: features.find(
          f =>
            f.category === DEVICE_FEATURE_CATEGORIES.SWITCH && f.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY
        ),
        upFeature: features.find(f => f.type === DEVICE_FEATURE_TYPES.TELEVISION.UP),
        downFeature: features.find(f => f.type === DEVICE_FEATURE_TYPES.TELEVISION.DOWN),
        leftFeature: features.find(f => f.type === DEVICE_FEATURE_TYPES.TELEVISION.LEFT),
        rightFeature: features.find(f => f.type === DEVICE_FEATURE_TYPES.TELEVISION.RIGHT),
        enterFeature: features.find(f => f.type === DEVICE_FEATURE_TYPES.TELEVISION.ENTER),
        returnFeature: features.find(f => f.type === DEVICE_FEATURE_TYPES.TELEVISION.RETURN)
      });
    } catch (e) {
      console.error(e);
      this.setState({
        error: true
      });
    }
  };

  setValueDevice = async (deviceFeature, value) => {
    if (!deviceFeature) {
      return;
    }
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

  stop = async () => {
    await this.setState({ isPlaying: false });
    await this.setValueDevice(this.state.stopFeature, 1);
  };

  previous = async () => {
    await this.setValueDevice(this.state.previousFeature, 1);
  };

  next = async () => {
    await this.setValueDevice(this.state.nextFeature, 1);
  };

  sendKey = async deviceFeature => {
    await this.setValueDevice(deviceFeature, 1);
  };

  togglePower = async () => {
    const { powerFeature } = this.state;
    if (!powerFeature) {
      return;
    }
    const newValue = powerFeature.last_value === 1 ? 0 : 1;
    const newPowerFeature = { ...powerFeature, last_value: newValue };
    await this.setState({ powerFeature: newPowerFeature });
    await this.setValueDevice(powerFeature, newValue);
  };

  changeVolume = async e => {
    const volume = parseInt(e.target.value, 10);
    const newVolumeFeature = { ...this.state.volumeFeature, last_value: volume };
    await this.setState({ volumeFeature: newVolumeFeature });
    await this.setValueDevice(this.state.volumeFeature, volume);
  };

  toggleRemote = () => {
    this.setState(prevState => ({ showRemote: !prevState.showRemote }));
  };

  updateDeviceStateWebsocket = payload => {
    const { volumeFeature, powerFeature } = this.state;
    if (volumeFeature && payload.device_feature_selector === volumeFeature.selector) {
      const newVolumeFeature = { ...volumeFeature, last_value: payload.last_value };
      this.setState({ volumeFeature: newVolumeFeature });
    }
    if (powerFeature && payload.device_feature_selector === powerFeature.selector) {
      const newPowerFeature = { ...powerFeature, last_value: payload.last_value };
      this.setState({ powerFeature: newPowerFeature });
    }
  };

  handleWebsocketConnected = ({ connected }) => {
    if (!connected) {
      this.wasDisconnected = true;
    } else if (this.wasDisconnected) {
      this.getDevice();
      this.wasDisconnected = false;
    }
  };

  componentDidMount() {
    this.getDevice();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
    this.props.session.dispatcher.addListener('websocket.connected', this.handleWebsocketConnected);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
    this.props.session.dispatcher.removeListener('websocket.connected', this.handleWebsocketConnected);
  }

  render(
    props,
    {
      isPlaying,
      showRemote,
      televisionDevice,
      playFeature,
      pauseFeature,
      stopFeature,
      previousFeature,
      nextFeature,
      volumeFeature,
      powerFeature,
      upFeature,
      downFeature,
      leftFeature,
      rightFeature,
      enterFeature,
      returnFeature
    }
  ) {
    const hasPlayback = playFeature || pauseFeature || stopFeature;
    const hasKeypad = upFeature || downFeature || leftFeature || rightFeature || enterFeature || returnFeature;
    const volumePercent = getVolumePercent(volumeFeature);

    return (
      <div class="card">
        <div class="card-header d-flex align-items-center justify-content-between">
          <h3 class="card-title mb-0">{televisionDevice && televisionDevice.name}</h3>
          {powerFeature && (
            <button type="button" class="btn btn-sm btn-outline-secondary" onClick={this.togglePower}>
              <i class={`fe fe-power${powerFeature.last_value === 1 ? '' : ' text-muted'}`} />
            </button>
          )}
        </div>
        <div class="card-body">
          {hasPlayback && (
            <div class="row">
              {previousFeature && (
                <div class="col">
                  <button type="button" class="btn btn-block btn-secondary" onClick={this.previous}>
                    <i class="fe fe-skip-back" />
                  </button>
                </div>
              )}
              {playFeature && !isPlaying && (
                <div class="col">
                  <button type="button" class="btn btn-block btn-secondary" onClick={this.play}>
                    <i class="fe fe-play" />
                  </button>
                </div>
              )}
              {pauseFeature && isPlaying && (
                <div class="col">
                  <button type="button" class="btn btn-block btn-secondary" onClick={this.pause}>
                    <i class="fe fe-pause" />
                  </button>
                </div>
              )}
              {stopFeature && (
                <div class="col">
                  <button type="button" class="btn btn-block btn-secondary" onClick={this.stop}>
                    <i class="fe fe-square" />
                  </button>
                </div>
              )}
              {nextFeature && (
                <div class="col">
                  <button type="button" class="btn btn-block btn-secondary" onClick={this.next}>
                    <i class="fe fe-skip-forward" />
                  </button>
                </div>
              )}
            </div>
          )}

          {volumeFeature && (
            <div class="row mt-4 align-items-center">
              <div class="col-auto">
                <i class="fe fe-volume-2" />
              </div>
              <div class="col">
                <input
                  type="range"
                  value={volumeFeature.last_value ?? volumeFeature.min ?? 0}
                  onChange={this.changeVolume}
                  class="form-control"
                  step="1"
                  min={volumeFeature.min ?? 0}
                  max={volumeFeature.max ?? 100}
                />
              </div>
              <div class="col-auto">
                <span>{volumePercent}%</span>
              </div>
            </div>
          )}

          {hasKeypad && (
            <div class="mt-4">
              <button type="button" class="btn btn-sm btn-secondary btn-block" onClick={this.toggleRemote}>
                <i class={`fe fe-chevron-${showRemote ? 'up' : 'down'}`} />{' '}
                <Text id="dashboard.boxes.television.remoteToggle" />
              </button>
              {showRemote && (
                <div class="mt-3">
                  <div class="row">
                    <div class="col-4 offset-4">
                      {upFeature && (
                        <button type="button" class="btn btn-block btn-secondary btn-sm" onClick={() => this.sendKey(upFeature)}>
                          <i class="fe fe-chevron-up" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div class="row mt-2">
                    <div class="col-4">
                      {leftFeature && (
                        <button type="button" class="btn btn-block btn-secondary btn-sm" onClick={() => this.sendKey(leftFeature)}>
                          <i class="fe fe-chevron-left" />
                        </button>
                      )}
                    </div>
                    <div class="col-4">
                      {enterFeature && (
                        <button type="button" class="btn btn-block btn-secondary btn-sm" onClick={() => this.sendKey(enterFeature)}>
                          <i class="fe fe-corner-down-left" />
                        </button>
                      )}
                    </div>
                    <div class="col-4">
                      {rightFeature && (
                        <button type="button" class="btn btn-block btn-secondary btn-sm" onClick={() => this.sendKey(rightFeature)}>
                          <i class="fe fe-chevron-right" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div class="row mt-2">
                    <div class="col-4 offset-4">
                      {downFeature && (
                        <button type="button" class="btn btn-block btn-secondary btn-sm" onClick={() => this.sendKey(downFeature)}>
                          <i class="fe fe-chevron-down" />
                        </button>
                      )}
                    </div>
                  </div>
                  {returnFeature && (
                    <div class="row mt-2">
                      <div class="col-6 offset-3">
                        <button type="button" class="btn btn-block btn-secondary btn-sm" onClick={() => this.sendKey(returnFeature)}>
                          <i class="fe fe-rotate-ccw" /> <Text id="dashboard.boxes.television.returnButton" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default connect('httpClient,session', {})(TelevisionBoxComponent);
