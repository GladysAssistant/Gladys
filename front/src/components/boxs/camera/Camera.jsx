import { Component, createRef } from 'preact';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import { Text } from 'preact-i18n';
import Hls from 'hls.js';

import config from '../../../config';
import {
  WEBSOCKET_MESSAGE_TYPES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES
} from '../../../../../server/utils/constants';
import get from 'get-value';
import style from './style.css';
import GladysPlusUpsellCard from '../../gateway/GladysPlusUpsellCard';
import CameraPtzControls from './CameraPtzControls';

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

  // `cameraDisabled` overrides the state for a caller that just resolved it: setState is
  // asynchronous, so a caller awaiting refreshDevice still reads the previous value here.
  refreshData = async ({ cameraDisabled = this.state.cameraDisabled } = {}) => {
    // A disabled camera serves no image at all (the server refuses, on purpose): asking for
    // one would only display the generic "no image" error instead of the disabled placeholder.
    if (cameraDisabled) {
      return;
    }
    try {
      const image = await this.props.httpClient.get(`/api/v1/camera/${this.props.box.camera}/image`);
      this.setState({ image, error: false });
    } catch (e) {
      console.error(e);
      this.setState({ error: true });
    }
  };

  // Returns whether the loaded camera is disabled, or null when that could not be resolved (no
  // camera selected, request failed, or a newer request superseded this one). null is not
  // "enabled": callers must only fetch an image or start a live stream on a strict false, so a
  // failed or stale device request never polls a camera that is in fact disabled.
  // Callers must use that returned value and not this.state.cameraDisabled right after awaiting
  // this method: setState is asynchronous, so the state still holds the previous value when this
  // promise resolves.
  // `keepCurrentView` is for a refresh where the camera has not changed (a websocket reconnect):
  // what is on screen still belongs to this camera, so it stays until the fresh device says
  // otherwise, instead of blinking on every reconnect.
  refreshDevice = async ({ keepCurrentView = false } = {}) => {
    const cameraSelector = this.props.box.camera;
    // Request generation guard: a camera change clears the controls immediately, and a slow
    // response for a previous camera can never overwrite the current one (a stale overlay
    // would send commands to the wrong camera).
    this.deviceRequestId = (this.deviceRequestId || 0) + 1;
    const requestId = this.deviceRequestId;
    // Everything displayed belongs to the camera we are leaving, image included: it must not
    // stay on screen while the new one loads, and a disabled new camera must show its
    // placeholder rather than the last frame of the previous one. The measured ratio goes
    // with it: the new camera may not frame in the same aspect.
    if (!keepCurrentView) {
      this.setState({ device: null, cameraDisabled: false, image: null, error: false, mediaRatio: null });
    }
    if (!cameraSelector) {
      return null;
    }
    try {
      const device = await this.props.httpClient.get(`/api/v1/device/${cameraSelector}`);
      if (requestId === this.deviceRequestId && this.props.box.camera === cameraSelector) {
        const cameraDisabled = this.isCameraDisabled(device);
        this.setState({ device, cameraDisabled });
        return cameraDisabled;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  // The "enabled" feature is the on/off gate of the camera. A camera without that feature is
  // always enabled (docs/specs/camera-enable-disable.md).
  getEnabledFeature = device => {
    const features = get(device, 'features') || [];
    return features.find(
      feature =>
        feature.category === DEVICE_FEATURE_CATEGORIES.CAMERA && feature.type === DEVICE_FEATURE_TYPES.CAMERA.ENABLED
    );
  };

  isCameraDisabled = device => {
    const enabledFeature = this.getEnabledFeature(device);
    return enabledFeature !== undefined && enabledFeature.last_value === 0;
  };

  updateDeviceFeatureStateWebsocket = payload => {
    const enabledFeature = this.getEnabledFeature(this.state.device);
    if (!enabledFeature || enabledFeature.selector !== payload.device_feature_selector) {
      return;
    }
    enabledFeature.last_value = payload.last_value;
    const cameraDisabled = payload.last_value === 0;
    if (cameraDisabled) {
      // Stop showing anything of a camera that was just turned off, including a live stream
      // still being started
      if (this.hasStreamingToStop()) {
        this.stopStreaming();
      }
      this.setState({ cameraDisabled, image: null, error: false });
    } else {
      // Explicit value rather than a bare `this.refreshData` reference: the state is committed
      // by the time a setState callback runs, but refreshData now takes options and Preact
      // invokes render callbacks with no arguments.
      this.setState({ cameraDisabled }, () => this.refreshData({ cameraDisabled: false }));
    }
  };

  renderPtzControls = () => {
    if (this.props.box.camera_ptz_controls === false) {
      return null;
    }
    if (!this.state.device || this.state.device.selector !== this.props.box.camera) {
      return null;
    }
    const features = get(this.state, 'device.features') || [];
    const moveFeature = features.find(
      feature =>
        feature.category === DEVICE_FEATURE_CATEGORIES.CAMERA && feature.type === DEVICE_FEATURE_TYPES.CAMERA.MOVE
    );
    const presetFeature = features.find(
      feature =>
        feature.category === DEVICE_FEATURE_CATEGORIES.CAMERA && feature.type === DEVICE_FEATURE_TYPES.CAMERA.PRESET
    );
    const hasPresets =
      presetFeature && Array.isArray(presetFeature.supported_options) && presetFeature.supported_options.length > 0;
    if (!moveFeature && !hasPresets) {
      return null;
    }
    return (
      <CameraPtzControls httpClient={this.props.httpClient} moveFeature={moveFeature} presetFeature={presetFeature} />
    );
  };

  handleWebsocketConnected = async ({ connected }) => {
    // When the websocket is disconnected, we refresh the data when the websocket is reconnected
    if (!connected) {
      this.wasDisconnected = true;
    } else if (this.wasDisconnected) {
      this.wasDisconnected = false;
      // The camera may have been disabled while the websocket was down, so we missed its state
      // event: reload the device first, as on mount. Refreshing the image alone would leave the
      // frame received before the disconnect on screen (docs/specs/camera-enable-disable.md).
      const cameraDisabled = await this.refreshDevice({ keepCurrentView: true });
      if (cameraDisabled === true) {
        // Same teardown as the device.new-state handler: the placeholder hides the video, but a
        // live stream that was running (or still starting) when the socket dropped, and the
        // frame keepCurrentView deliberately kept, would otherwise both survive a camera
        // disabled while we were not listening.
        if (this.hasStreamingToStop()) {
          this.stopStreaming();
        }
        this.setState({ image: null, error: false });
      } else if (cameraDisabled === false) {
        // The confirmed value is passed on: this reload keeps the current view, so its only
        // setState is the one it just scheduled, and this.state still holds the pre-reconnect
        // value — a camera enabled while the socket was down would otherwise skip its refresh.
        this.refreshData({ cameraDisabled: false });
      } else if (cameraDisabled === null) {
        // The reload did not resolve (the device request failed — likely right after a
        // reconnect — or a newer one superseded it). Skipping the image then would drop the
        // very refresh the reconnect exists for, so fall back to the last known state:
        // refreshData is already a no-op on a camera known to be disabled, and the server
        // refuses a disabled camera's image anyway.
        this.refreshData();
      }
    }
  };

  updateDeviceStateWebsocket = payload => {
    if (this.props.box.camera === payload.device && !this.state.cameraDisabled) {
      this.setState({
        image: payload.last_value_string,
        error: false
      });
    }
  };

  // The snapshot's width/height ratio caps how far the stretched card may grow (the
  // --media-ratio custom property, see routes/dashboard/style.css): a camera card then ends
  // with its image instead of filling a tall column with letterbox bands. Snapshots are
  // raster images, so the natural size is always readable here.
  handleImageLoad = event => {
    const { naturalWidth, naturalHeight } = event.target;
    if (naturalWidth > 0 && naturalHeight > 0) {
      const mediaRatio = naturalWidth / naturalHeight;
      if (mediaRatio !== this.state.mediaRatio) {
        this.setState({ mediaRatio });
      }
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

  // True as soon as a live stream is being started and until it is stopped. `state.streaming` is
  // not enough: setState is asynchronous, so a stop asked for while the start request is in
  // flight would not see it yet and would leave a hidden stream running.
  hasStreamingToStop = () => this.state.streaming === true || Boolean(this.streamingToken);

  startStreaming = async () => {
    if (!Hls.isSupported()) {
      this.setState({ liveNotSupportedBrowser: true });
      return;
    }
    // Start guard: this token identifies the current start attempt. stopStreaming clears it, so
    // a stop (the camera being turned off, for example) that happens while the start request is
    // in flight wins, and no HLS instance or ping interval is created behind its back.
    const streamingToken = {};
    this.streamingToken = streamingToken;
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
      // The stream was stopped (or restarted) while we were starting it: the state was already
      // reset by stopStreaming, so we only have to not build anything.
      if (this.streamingToken !== streamingToken) {
        return;
      }
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
    // Invalidate any start request still in flight (see startStreaming)
    this.streamingToken = null;
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

  async componentDidMount() {
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STRING_STATE,
      this.updateDeviceStateWebsocket
    );
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceFeatureStateWebsocket
    );
    this.props.session.dispatcher.addListener('websocket.connected', this.handleWebsocketConnected);
    // The device is loaded first: a disabled camera must show its placeholder instead of
    // requesting an image and auto-starting a live stream the server would refuse.
    const cameraDisabled = await this.refreshDevice();
    if (cameraDisabled === false) {
      this.refreshData();
      if (this.props.box.camera_live_auto_start === true) {
        this.startStreaming();
      }
    }
  }

  async componentDidUpdate(previousProps) {
    const cameraChanged = get(previousProps, 'box.camera') !== get(this.props, 'box.camera');
    const nameChanged = get(previousProps, 'box.name') !== get(this.props, 'box.name');
    let { cameraDisabled } = this.state;
    if (cameraChanged) {
      // A live stream (or one still being started) belongs to the camera we are leaving: left
      // running it would keep playing in the background and ping the new selector, and the
      // placeholder of a disabled new camera would hide it. refreshDevice clears the image.
      if (this.hasStreamingToStop()) {
        await this.stopStreaming();
      }
      cameraDisabled = await this.refreshDevice();
    }
    if ((cameraChanged || nameChanged) && cameraDisabled === false) {
      this.refreshData();
    }
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STRING_STATE,
      this.updateDeviceStateWebsocket
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceFeatureStateWebsocket
    );
    if (this.hasStreamingToStop()) {
      this.stopStreaming();
    }
    this.props.session.dispatcher.removeListener('websocket.connected', this.handleWebsocketConnected);
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
      upgradeGladysPlusPlanRequired,
      cameraDisabled,
      mediaRatio
    }
  ) {
    // Threads the measured snapshot ratio to the dashboard stylesheet; also set on the live
    // card (the stream frames like the snapshot) so starting the live does not regrow the card.
    const mediaRatioStyle = mediaRatio ? `--media-ratio: ${mediaRatio}` : undefined;
    // A disabled camera shows a clear placeholder: no image (not even the last one received
    // before it was turned off) and no way to start a live stream.
    if (cameraDisabled) {
      return (
        <div class="card">
          <div class={style.noImagePlaceholder}>
            <span class={style.noImageIcon}>
              <i class="fe fe-video-off" />
            </span>
            <span class={style.noImageText}>
              <Text id="dashboard.boxes.camera.cameraDisabled" />
            </span>
          </div>
          <div class="card-header">
            <h3 class="card-title">{props.box && props.box.name}</h3>
          </div>
        </div>
      );
    }
    // PTZ controls only make sense on the live view: in snapshot mode movements are not
    // visible, and the overlay was covering the widget's other actions (field feedback).
    const ptzControls = streaming ? this.renderPtzControls() : null;
    if (streaming) {
      return (
        <div class="card" style={mediaRatioStyle}>
          <div
            class={cx('dimmer card-img-top', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.cameraMediaContainer)}>
              <video class="w-100" ref={this.videoRef} controls autoPlay muted />
              {ptzControls}
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
      <div class="card" style={mediaRatioStyle}>
        {image && <img class="card-img-top" src={`data:${image}`} alt={props.roomName} onLoad={this.handleImageLoad} />}
        {error && (
          <div class={style.noImagePlaceholder}>
            <span class={style.noImageIcon}>
              <i class="fe fe-video-off" />
            </span>
            <span class={style.noImageText}>
              <Text id="dashboard.boxes.camera.noImageToShow" />
            </span>
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
          <div class="p-2">
            <GladysPlusUpsellCard
              variant="upgrade"
              icon="fe-video"
              utmCampaign="dashboard_camera_upgrade"
              titleKey="gladysPlusUpsell.camera.upgradeTitle"
              descriptionKey="gladysPlusUpsell.camera.upgradeDescription"
            />
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
