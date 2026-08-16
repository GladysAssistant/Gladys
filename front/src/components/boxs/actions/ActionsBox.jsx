import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import { WEBSOCKET_MESSAGE_TYPES, COVER_STATE } from '../../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon } from '../../../utils/consts';
import style from './style.css';

const SCENE_START_FEEDBACK_MS = 1200;

const COVER_COMMAND_ICONS = {
  [COVER_STATE.OPEN]: 'arrow-up',
  [COVER_STATE.STOP]: 'square',
  [COVER_STATE.CLOSE]: 'arrow-down'
};

class ActionsBox extends Component {
  refreshData = async () => {
    const actions = this.props.box.actions || [];
    try {
      const featureSelectors = actions.filter(a => a.action_type === 'device-feature' && a.device_feature);
      const scenesNeeded = actions.some(a => a.action_type === 'scene' && a.scene);
      const [devices, scenes] = await Promise.all([
        featureSelectors.length
          ? this.props.httpClient.get('/api/v1/device', {
              device_feature_selectors: featureSelectors.map(a => a.device_feature).join(',')
            })
          : Promise.resolve([]),
        scenesNeeded ? this.props.httpClient.get('/api/v1/scene') : Promise.resolve([])
      ]);
      const featuresBySelector = {};
      const deviceNamesByFeatureSelector = {};
      devices.forEach(device => {
        device.features.forEach(feature => {
          featuresBySelector[feature.selector] = feature;
          deviceNamesByFeatureSelector[feature.selector] = device.name;
        });
      });
      const scenesBySelector = {};
      scenes.forEach(scene => {
        scenesBySelector[scene.selector] = scene;
      });
      this.setState({ featuresBySelector, deviceNamesByFeatureSelector, scenesBySelector });
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
          last_value: payload.last_value
        }
      }
    });
  };

  runAction = async (action, index) => {
    if (this.state[`pending-${index}`]) {
      return;
    }
    this.setState({ [`pending-${index}`]: true });
    try {
      if (action.action_type === 'scene' && action.scene) {
        await this.props.httpClient.post(`/api/v1/scene/${action.scene}/start`);
        // A scene has no state to reflect: keep a short visual confirmation
        await new Promise(resolve => setTimeout(resolve, SCENE_START_FEEDBACK_MS));
      } else if (action.action_type === 'device-feature' && action.device_feature) {
        const feature = get(this.state, `featuresBySelector.${action.device_feature}`);
        const value = action.value !== undefined ? action.value : feature && feature.last_value === 1 ? 0 : 1;
        await this.props.httpClient.post(`/api/v1/device_feature/${action.device_feature}/value`, { value });
        if (feature) {
          this.updateDeviceStateWebsocket({ device_feature_selector: action.device_feature, last_value: value });
        }
      }
    } catch (e) {
      console.error(e);
    }
    this.setState({ [`pending-${index}`]: false });
  };

  componentDidMount() {
    this.refreshData();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
  }

  componentDidUpdate(previousProps) {
    if (previousProps.box.actions !== this.props.box.actions) {
      this.refreshData();
    }
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
  }

  getActionIcon = action => {
    if (action.icon) {
      return action.icon;
    }
    if (action.action_type === 'scene') {
      return get(this.state, `scenesBySelector.${action.scene}.icon`) || 'play';
    }
    if (action.value !== undefined && COVER_COMMAND_ICONS[action.value]) {
      return COVER_COMMAND_ICONS[action.value];
    }
    const feature = get(this.state, `featuresBySelector.${action.device_feature}`);
    if (feature) {
      const icon = get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`);
      if (icon) {
        return icon;
      }
    }
    return 'zap';
  };

  getActionLabel = action => {
    if (action.label) {
      return action.label;
    }
    if (action.action_type === 'scene') {
      return get(this.state, `scenesBySelector.${action.scene}.name`) || action.scene;
    }
    return get(this.state, `deviceNamesByFeatureSelector.${action.device_feature}`) || action.device_feature;
  };

  isActionActive = action => {
    if (action.action_type !== 'device-feature') {
      return false;
    }
    const feature = get(this.state, `featuresBySelector.${action.device_feature}`);
    if (!feature || feature.last_value === null) {
      return false;
    }
    if (action.value !== undefined) {
      return feature.last_value === action.value;
    }
    return feature.last_value === 1;
  };

  render(props, state) {
    const actions = props.box.actions || [];
    const name = get(props, 'box.name', '');
    return (
      <div class="card">
        {name && (
          <div class="card-header">
            <h3 class="card-title">{name}</h3>
          </div>
        )}
        <div class="card-body">
          {actions.length === 0 && (
            <div class="text-muted text-center">
              <Text id="dashboard.boxes.actions.noActions" />
            </div>
          )}
          <div class={style.actionsGrid}>
            {actions.map((action, index) => {
              const active = this.isActionActive(action);
              const pending = state[`pending-${index}`];
              return (
                <button
                  type="button"
                  class={cx(style.actionButton, {
                    [style.actionActive]: active && !(action.value < 0),
                    // an active "close" command (shutters closed) tints red, not green
                    [style.actionActiveDanger]: active && action.value < 0
                  })}
                  disabled={pending}
                  onClick={() => this.runAction(action, index)}
                >
                  <span class={style.actionIcon}>
                    <i class={`fe fe-${pending ? 'loader' : this.getActionIcon(action)}`} />
                  </span>
                  <span class={style.actionLabel}>{this.getActionLabel(action)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,session', {})(ActionsBox);
