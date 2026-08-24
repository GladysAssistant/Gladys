import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { RequestStatus } from '../../../utils/consts';
import SceneRow from './SceneRow';
import cx from 'classnames';
import style from './style.css';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import { computeRunningInfo, mergeRunningScenes } from '../../../routes/scene/runningInfo';

class SceneBoxComponent extends Component {
  refreshData = () => {
    this.getScene();
    this.getStatusFeatures();
  };

  getScene = async () => {
    this.setState({ status: RequestStatus.Getting });
    try {
      const scenes = await this.props.httpClient.get(`/api/v1/scene`, {
        selectors: this.props.box.scenes.join(',')
      });
      this.setState({
        scenes,
        status: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        status: RequestStatus.Error
      });
    }
  };

  getStatusFeatures = async () => {
    const statusFeaturesBySceneSelector = this.props.box.scene_status_features || {};
    const featureSelectors = Object.keys(statusFeaturesBySceneSelector).map(
      sceneSelector => statusFeaturesBySceneSelector[sceneSelector]
    );
    if (featureSelectors.length === 0) {
      return;
    }
    try {
      const devices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_selectors: featureSelectors.join(',')
      });
      const featuresBySelector = {};
      devices.forEach(device => {
        device.features.forEach(feature => {
          featuresBySelector[feature.selector] = feature;
        });
      });
      this.setState({ featuresBySelector });
    } catch (e) {
      console.error(e);
    }
  };

  updateDeviceStateWebsocket = payload => {
    const { featuresBySelector } = this.state;
    if (!featuresBySelector || !featuresBySelector[payload.device_feature_selector]) {
      return;
    }
    this.setState({
      featuresBySelector: {
        ...featuresBySelector,
        [payload.device_feature_selector]: {
          ...featuresBySelector[payload.device_feature_selector],
          last_value: payload.last_value,
          last_value_changed: payload.last_value_changed
        }
      }
    });
  };

  getRunningScenes = async () => {
    // stops received while the request is in flight would be undone by the response
    const stoppedDuringFetch = new Set();
    this.stoppedDuringFetch = stoppedDuringFetch;
    try {
      const runningScenes = await this.props.httpClient.get('/api/v1/scene/running');
      // Merge with any websocket-driven updates received while fetching
      this.setState(prevState => ({
        runningScenes: mergeRunningScenes(runningScenes, prevState.runningScenes, stoppedDuringFetch)
      }));
    } catch (e) {
      console.error(e);
    } finally {
      if (this.stoppedDuringFetch === stoppedDuringFetch) {
        this.stoppedDuringFetch = null;
      }
    }
  };
  onSceneStarted = payload => {
    this.setState(prevState => {
      const alreadyKnown = (prevState.runningScenes || []).some(scene => scene.executionId === payload.executionId);
      if (alreadyKnown) {
        return null;
      }
      return { runningScenes: [...(prevState.runningScenes || []), payload] };
    });
  };
  onSceneStopped = payload => {
    if (this.stoppedDuringFetch) {
      this.stoppedDuringFetch.add(payload.executionId);
    }
    this.setState(prevState => ({
      runningScenes: (prevState.runningScenes || []).filter(scene => scene.executionId !== payload.executionId)
    }));
  };
  // Keep a 1s ticker running only while at least one scene is executing,
  // so running rows can display a live elapsed time.
  refreshTicker = () => {
    const hasRunning = (this.state.runningScenes || []).length > 0;
    if (hasRunning && !this.ticker) {
      this.ticker = setInterval(() => this.setState({ now: Date.now() }), 1000);
    } else if (!hasRunning && this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      runningScenes: [],
      now: Date.now()
    };
    this.ticker = null;
  }

  componentDidMount() {
    this.refreshData();
    this.getRunningScenes();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.SCENE.STARTED, this.onSceneStarted);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.SCENE.STOPPED, this.onSceneStopped);
  }

  componentDidUpdate() {
    // Start/stop the ticker based on the applied state.
    this.refreshTicker();
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.SCENE.STARTED, this.onSceneStarted);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.SCENE.STOPPED, this.onSceneStopped);
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.box.scenes !== this.props.box.scenes ||
      nextProps.box.scene_status_features !== this.props.box.scene_status_features
    ) {
      this.refreshData();
    }
  }

  render(props, { scenes, status, featuresBySelector, runningScenes, now }) {
    const boxTitle = props.box.name;
    const loading = status === RequestStatus.Getting && !status;

    return (
      <div class="card">
        {boxTitle && (
          <div class="card-header">
            <h3 class="card-title">{boxTitle}</h3>
          </div>
        )}
        <div
          class={cx('dimmer', {
            active: loading
          })}
        >
          <div class="loader py-3" />
          <div class="dimmer-content">
            <div class={style.sceneList}>
              {scenes &&
                scenes.map(scene => (
                  <SceneRow
                    key={scene.selector}
                    boxStatus={status}
                    name={scene.name}
                    icon={scene.icon}
                    user={props.user}
                    sceneSelector={scene.selector}
                    runningInfo={computeRunningInfo(runningScenes, scene.selector, now)}
                    statusFeature={
                      featuresBySelector &&
                      props.box.scene_status_features &&
                      featuresBySelector[props.box.scene_status_features[scene.selector]]
                    }
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('user,session,httpClient', {})(SceneBoxComponent);
