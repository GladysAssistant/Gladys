import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { RequestStatus } from '../../../utils/consts';
import SceneRow from './SceneRow';
import cx from 'classnames';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';

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

  componentDidMount() {
    this.refreshData();
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

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.box.scenes !== this.props.box.scenes ||
      nextProps.box.scene_status_features !== this.props.box.scene_status_features
    ) {
      this.refreshData();
    }
  }

  render(props, { scenes, status, featuresBySelector }) {
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
            <div class="table-responsive">
              <table className="table card-table table-vcenter">
                <tbody>
                  {scenes &&
                    scenes.map(scene => (
                      <SceneRow
                        boxStatus={status}
                        name={scene.name}
                        icon={scene.icon}
                        user={props.user}
                        sceneSelector={scene.selector}
                        statusFeature={
                          featuresBySelector &&
                          props.box.scene_status_features &&
                          featuresBySelector[props.box.scene_status_features[scene.selector]]
                        }
                      />
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('user,session,httpClient', {})(SceneBoxComponent);
