import { Component, createRef } from 'preact';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import { Text } from 'preact-i18n';
import Hls from 'hls.js';

import config from '../../../config';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import get from 'get-value';

const SEGMENT_DURATIONS_PER_LATENCY = {
  'ultra-low': 1,
  low: 2,
  medium: 3,
  standard: 6
};

class CameraBoxComponent extends Component {
  videoRef = createRef();

  refreshData = async () => {
    try {
      const image = await this.props.httpClient.get(`/api/v1/camera/${this.props.box.camera}/image`);
      this.setState({ image, error: false });
    } catch (e) {
      console.error(e);
      this.setState({ error: true });
    }
  };

  updateDeviceStateWebsocket = payload => {
    if (this.props.box.camera === payload.device) {
      this.setState({
        image: payload.last_value_string
      });
    }
  };

  startStreaming = async () => {
    if (!Hls.isSupported()) {
      return;
    }
    await this.setState({ streaming: true, loading: true });
    const isGladysPlus = this.props.session.gatewayClient !== undefined;

    const segmentationDuration = this.props.box.camera_latency
      ? SEGMENT_DURATIONS_PER_LATENCY[this.props.box.camera_latency]
      : SEGMENT_DURATIONS_PER_LATENCY.low;

    const streamingParams = await this.props.httpClient.post(
      `/api/v1/service/rtsp-camera/camera/${this.props.box.camera}/streaming/start`,
      {
        origin: isGladysPlus ? config.gladysGatewayApiUrl : config.localApiUrl,
        is_gladys_gateway: isGladysPlus,
        segment_duration: segmentationDuration
      }
    );

    this.hls = new Hls({
      xhrSetup: xhr => {
        // We set the correct access token
        const accessToken = isGladysPlus
          ? this.props.session.gatewayClient.accessToken
          : this.props.session.getAccessToken();
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      },
      loader: class CustomLoader extends Hls.DefaultConfig.loader {
        load(context, config, callbacks) {
          let { url } = context;

          console.log(`Loading URL = ${url}`);

          // For the encryption key, we hot replace the key with the data
          // Coming from Gladys to ensure End-to-End Encryption
          // When using with Gladys Plus
          if (url && url.endsWith('index.m3u8.key')) {
            const onSuccess = callbacks.onSuccess;
            callbacks.onSuccess = function(response, stats, context) {
              const enc = new TextEncoder();
              // Encryption key is replaced here:
              response.data = enc.encode(streamingParams.encryption_key);

              onSuccess(response, stats, context);
            };
          }
          super.load(context, config, callbacks);
        }
      }
    });
    this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      console.log('video and hls.js are now bound together !');
    });
    this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      console.log(`manifest loaded, found ${data.levels.length} quality level`);
    });
    this.hls.on(Hls.Events.ERROR, (event, data) => {
      console.log(event, data);
      const errorType = data.type;
      const errorDetails = data.details;
      const errorFatal = data.fatal;
      console.log(errorType);
      console.log(errorDetails);
      console.log(errorFatal);
      if (errorType === 'networkError') {
        //  this.stopStreaming();
      }
    });
    if (isGladysPlus) {
      this.hls.loadSource(`${config.gladysGatewayApiUrl}/cameras/${streamingParams.camera_folder}/index.m3u8`);
    } else {
      this.hls.loadSource(
        `${config.localApiUrl}/api/v1/service/rtsp-camera/camera/streaming/${streamingParams.camera_folder}/index.m3u8`
      );
    }

    // bind them together
    this.hls.attachMedia(this.videoRef.current);
    await this.setState({ loading: false });
  };

  stopStreaming = async () => {
    await this.setState({ loading: true });
    try {
      await this.props.httpClient.post(`/api/v1/service/rtsp-camera/camera/${this.props.box.camera}/streaming/stop`);
    } catch (e) {
      console.error(e);
    }

    if (this.hls) {
      this.hls.stopLoad();
      this.hls.detachMedia();
      this.hls.destroy();
      delete this.hls;
    }

    this.setState({ streaming: false, loading: false });
  };

  componentDidMount() {
    this.refreshData();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STRING_STATE,
      this.updateDeviceStateWebsocket
    );
  }

  componentDidUpdate(previousProps) {
    const cameraChanged = get(previousProps, 'box.camera') !== get(this.props, 'box.camera');
    const nameChanged = get(previousProps, 'box.name') !== get(this.props, 'box.name');
    if (cameraChanged || nameChanged) {
      this.refreshData();
    }
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STRING_STATE,
      this.updateDeviceStateWebsocket
    );
    if (this.state.streaming) {
      this.stopStreaming();
    }
  }

  render(props, { image, error, streaming, loading }) {
    if (streaming) {
      return (
        <div class="card">
          <div
            class={cx('dimmer card-img-top', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <video style={{ width: '100%' }} ref={this.videoRef} controls autoPlay muted />
            </div>
          </div>
          <div class="card-header">
            <h3 class="card-title">{props.box && props.box.name}</h3>
            <div class="card-options">
              <button class="btn btn-primary btn-sm" onClick={this.stopStreaming}>
                <i class="fe fe-pause" />
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div class="card">
        {image && <img class="card-img-top" src={`data:${image}`} alt={props.roomName} />}
        {error && (
          <div>
            <p class="alert alert-danger">
              <i class="fe fe-bell" />
              <span class="pl-2">
                <Text id="dashboard.boxes.camera.noImageToShow" />
              </span>
            </p>
          </div>
        )}
        {!image && loading && (
          <div class="dimmer active">
            <div class="dimmer-content" style={{ height: '100px' }} />
            <div class="loader" />
          </div>
        )}
        <div class="card-header">
          <h3 class="card-title">{props.box && props.box.name}</h3>
          <div class="card-options">
            <button class="btn btn-secondary btn-sm" onClick={this.startStreaming}>
              <i class="fe fe-airplay" />
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,session', {})(CameraBoxComponent);
