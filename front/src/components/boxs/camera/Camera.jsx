import { Component, createRef } from 'preact';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import { Text } from 'preact-i18n';
import Hls from 'hls.js';

import config from '../../../config';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import get from 'get-value';
import style from './style.css';

const SEGMENT_DURATIONS_PER_LATENCY = {
  'ultra-low': 1,
  low: 2,
  medium: 3,
  standard: 6
};

class CameraBoxComponent extends Component {
  videoRef = createRef();
  state = {
    cameraStreamingErrorCount: 0
  };

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

  newNetworkError = () => {
    this.setState(prevState => {
      const { cameraStreamingErrorCount } = prevState;
      return {
        ...prevState,
        cameraStreamingErrorCount: cameraStreamingErrorCount + 1
      };
    });
  };

  startStreaming = async () => {
    if (!Hls.isSupported()) {
      this.setState({ liveNotSupportedBrowser: true });
      return;
    }
    await this.setState({
      streaming: true,
      loading: true,
      liveStartError: false,
      upgradeGladysPlusPlanRequired: false
    });
    try {
      const isGladysPlus = this.props.session.gatewayClient !== undefined;

      const segmentationDuration = this.props.box.camera_latency
        ? SEGMENT_DURATIONS_PER_LATENCY[this.props.box.camera_latency]
        : SEGMENT_DURATIONS_PER_LATENCY.low;

      const [streamingParams, gatewayStreaming] = await Promise.all([
        this.props.httpClient.post(`/api/v1/service/rtsp-camera/camera/${this.props.box.camera}/streaming/start`, {
          origin: isGladysPlus ? config.gladysGatewayApiUrl : config.localApiUrl,
          is_gladys_gateway: isGladysPlus,
          segment_duration: segmentationDuration
        }),
        isGladysPlus ? this.props.session.gatewayClient.cameraStartStreaming() : null
      ]);
      const { localApiUrl } = config;
      const cameraComponent = this;

      this.hls = new Hls({
        liveMaxLatencyDurationCount: 3,
        liveSyncDurationCount: 2,
        maxLiveSyncPlaybackRate: 1.5,
        liveDurationInfinity: true,
        xhrSetup: xhr => {
          // We set the correct access token (locally only)
          // On Gladys Plus, authentication is done with a temporary
          // token in the URL to avoid preflight requests
          if (!isGladysPlus) {
            const accessToken = this.props.session.getAccessToken();
            xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
          }
        },
        loader: class CustomLoader extends Hls.DefaultConfig.loader {
          load(context, config, callbacks) {
            let { url } = context;

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

            if (url && url.endsWith('index.m3u8')) {
              const onSuccess = callbacks.onSuccess;
              callbacks.onSuccess = function(response, stats, context) {
                cameraComponent.setState({ cameraStreamingErrorCount: 0 });

                if (!isGladysPlus) {
                  // In the index.m3u8, we replace the backend URL with the local API file
                  // This is useful for local streaming only
                  response.data = response.data.replace('BACKEND_URL_TO_REPLACE', localApiUrl);
                } else {
                  // We add the stream access key to the URL for authentication
                  response.data = response.data.replace(
                    '/index.m3u8.key',
                    `/${gatewayStreaming.stream_access_key}/index.m3u8.key`
                  );
                }

                onSuccess(response, stats, context);
              };
            }

            super.load(context, config, callbacks);
          }
        }
      });
      this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {});
      this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log(`manifest loaded, found ${data.levels.length} quality level`);
      });
      this.hls.on(Hls.Events.ERROR, (event, data) => {
        console.error(event, data);
        const errorType = data.type;
        const errorDetails = data.details;
        const errorFatal = data.fatal;
        const response = data.response;
        console.error(errorType);
        console.error(errorDetails);
        console.error(errorFatal);
        if (errorType === 'networkError') {
          this.newNetworkError();
        }
        if (response && response.code === 429) {
          this.setState({ liveTooManyRequestsError: true });
          this.stopStreaming();
        }
      });
      if (isGladysPlus) {
        this.hls.loadSource(
          `${config.gladysGatewayApiUrl}/cameras/${streamingParams.camera_folder}/${gatewayStreaming.stream_access_key}/index.m3u8`
        );
      } else {
        this.hls.loadSource(
          `${config.localApiUrl}/api/v1/service/rtsp-camera/camera/streaming/${streamingParams.camera_folder}/index.m3u8`
        );
      }

      if (this.liveActiveInterval) {
        clearInterval(this.liveActiveInterval);
      }

      // Every 3 seconds, sends a ping to Gladys to tell Gladys the live is still active
      this.liveActiveInterval = setInterval(this.liveActivePing, 3000);

      // bind them together
      this.hls.attachMedia(this.videoRef.current);
    } catch (e) {
      const status = get(e, 'response.status');
      if (status === 402) {
        this.setState({ upgradeGladysPlusPlanRequired: true });
      } else {
        this.setState({ liveStartError: true });
      }

      console.error(e);
      await this.stopStreaming();
    }
    await this.setState({ loading: false });
  };

  stopStreaming = async () => {
    await this.setState({ loading: true });

    // We clear the live active interval
    // The streaming will be automatically stopped
    // After some time
    if (this.liveActiveInterval) {
      clearInterval(this.liveActiveInterval);
    }

    if (this.hls) {
      this.hls.stopLoad();
      this.hls.detachMedia();
      this.hls.destroy();
      delete this.hls;
    }

    await this.setState({ streaming: false, loading: false });
  };

  liveActivePing = async () => {
    try {
      await this.props.httpClient.post(`/api/v1/service/rtsp-camera/camera/${this.props.box.camera}/streaming/ping`);
    } catch (e) {
      console.error(e);
      // If the ping fails, it means the stream ended. We stop the stream.
      this.stopStreaming();
    }
  };

  componentDidMount() {
    this.refreshData();
    if (this.props.box.camera_live_auto_start === true) {
      this.startStreaming();
    }
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

  render(
    props,
    {
      image,
      error,
      streaming,
      loading,
      liveStartError,
      liveNotSupportedBrowser,
      liveTooManyRequestsError,
      upgradeGladysPlusPlanRequired
    }
  ) {
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
              <video class="w-100" ref={this.videoRef} controls autoPlay muted />
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
            <p class={style.noImageToShowError}>
              <span class="pl-2">
                <Text id="dashboard.boxes.camera.noImageToShow" />
              </span>
            </p>
          </div>
        )}
        {!image && loading && (
          <div class="dimmer active">
            <div class="dimmer-content my-5 py-5" />
            <div class="loader" />
          </div>
        )}
        {liveStartError && (
          <div>
            <p class="alert alert-danger">
              <i class="fe fe-bell" />
              <span class="pl-2">
                <Text id="dashboard.boxes.camera.liveStartError" />
              </span>
            </p>
          </div>
        )}
        {upgradeGladysPlusPlanRequired && (
          <div>
            <p class="alert alert-warning">
              <i class="fe fe-bell" />
              <span class="pl-2">
                <Text id="dashboard.boxes.camera.upgradeGladysPlusPlanError" />
              </span>
            </p>
          </div>
        )}
        {liveNotSupportedBrowser && (
          <div>
            <p class="alert alert-warning">
              <i class="fe fe-compass" />
              <span class="pl-2">
                <Text id="dashboard.boxes.camera.notNotSupportedBrowser" />
              </span>
            </p>
          </div>
        )}
        {liveTooManyRequestsError && (
          <div>
            <p class="alert alert-warning">
              <i class="fe fe-alert-triangle" />
              <span class="pl-2">
                <Text id="dashboard.boxes.camera.tooManyRequests" />
              </span>
            </p>
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
