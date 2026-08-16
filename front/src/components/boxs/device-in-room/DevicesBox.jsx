import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Promise from 'bluebird';
import get from 'get-value';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import { RequestStatus } from '../../../utils/consts';
import {
  WEBSOCKET_MESSAGE_TYPES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES
} from '../../../../../server/utils/constants';
import DeviceCard from './DeviceCard';
import debounce from 'debounce';

// A dynamic select holds a string state: its widget reads last_value_string
const isTextSelectFeature = feature =>
  feature.category === DEVICE_FEATURE_CATEGORIES.TEXT && feature.type === DEVICE_FEATURE_TYPES.TEXT.SELECT;

// Any read-only binary feature (opening sensor, motion sensor, presence, leak...) can display
// the date at which its current state was reached.
const isBinarySensorFeature = feature =>
  feature.read_only === true && feature.type === DEVICE_FEATURE_TYPES.SENSOR.BINARY;

const updateDeviceFeatures = (deviceFeatures, deviceFeatureSelector, lastValue, lastValueChange) => {
  return deviceFeatures.map(feature => {
    if (feature.selector === deviceFeatureSelector) {
      // The branch is on the FEATURE, not on typeof lastValue: numeric widgets (sliders,
      // number inputs...) pass the raw DOM string while still reading last_value, so a
      // typeof check would break their optimistic update
      if (isTextSelectFeature(feature)) {
        return {
          ...feature,
          last_value_string: `${lastValue}`,
          last_value_changed: lastValueChange
        };
      }
      return {
        ...feature,
        last_value: lastValue,
        last_value_changed: lastValueChange
      };
    }
    return feature;
  });
};

const updateDeviceFeaturesString = (deviceFeatures, deviceFeatureSelector, lastValueString, lastValueChange) => {
  return deviceFeatures.map(feature => {
    if (feature.selector === deviceFeatureSelector) {
      return {
        ...feature,
        last_value_string: lastValueString,
        last_value_changed: lastValueChange
      };
    }
    return feature;
  });
};

class DevicesComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deviceFeatures: [],
      lastStateChanges: {},
      status: RequestStatus.Getting
    };
    this.wasDisconnected = false;
  }

  handleWebsocketConnected = ({ connected }) => {
    // When the websocket is disconnected, we refresh the data when the websocket is reconnected
    if (!connected) {
      this.wasDisconnected = true;
    } else if (this.wasDisconnected) {
      this.refreshData();
      this.wasDisconnected = false;
    }
  };

  refreshData = () => {
    this.getDeviceFeatures();
  };

  getDeviceFeatures = async () => {
    this.setState({ status: RequestStatus.Getting });
    try {
      const deviceFeatureSelectors = this.props.box.device_features;
      const devices = await this.props.httpClient.get(`/api/v1/device`, {
        device_feature_selectors: deviceFeatureSelectors.join(',')
      });
      const deviceFeaturesFlat = [];
      devices.forEach(device => {
        device.features.forEach(feature => {
          deviceFeaturesFlat.push({ ...feature, device });
        });
      });
      const deviceFeaturesSorted = deviceFeaturesFlat.sort(
        (a, b) => deviceFeatureSelectors.indexOf(a.selector) - deviceFeatureSelectors.indexOf(b.selector)
      );
      const deviceFeaturesNewNames = this.props.box.device_feature_names;
      if (deviceFeaturesNewNames) {
        deviceFeaturesSorted.forEach((deviceFeature, index) => {
          deviceFeature.new_label = deviceFeaturesNewNames[index];
        });
      }
      this.setState({
        deviceFeatures: deviceFeaturesSorted,
        status: RequestStatus.Success
      });
      this.getLastStateChanges(deviceFeaturesSorted);
    } catch (e) {
      this.setState({
        status: RequestStatus.Error
      });
    }
  };

  // `last_value_changed` is refreshed on every state report, even when the device re-publishes
  // the value it already had, so the real date of the last state change is asked to the server,
  // which reads it from the state history.
  getLastStateChanges = async deviceFeatures => {
    if (!this.props.box.display_last_state_change) {
      return;
    }
    const binarySensorSelectors = deviceFeatures.filter(isBinarySensorFeature).map(feature => feature.selector);
    if (binarySensorSelectors.length === 0) {
      return;
    }
    try {
      const lastStateChanges = await this.props.httpClient.get('/api/v1/device_feature/last_state_changes', {
        device_feature_selectors: binarySensorSelectors.join(',')
      });
      this.setState({ lastStateChanges });
    } catch (e) {
      console.error(e);
    }
  };

  updateDeviceStateWebsocket = payload => {
    let { deviceFeatures } = this.state;
    if (deviceFeatures) {
      const lastStateChanges = this.getUpdatedLastStateChanges(
        deviceFeatures,
        payload.device_feature_selector,
        payload.last_value,
        payload.last_value_changed
      );
      deviceFeatures = updateDeviceFeatures(
        deviceFeatures,
        payload.device_feature_selector,
        payload.last_value,
        payload.last_value_changed
      );
      this.setState({
        deviceFeatures,
        lastStateChanges
      });
    }
  };

  // A new state is a state change only when the value actually differs from the one displayed,
  // so a sensor re-publishing the same value never resets the displayed date.
  getUpdatedLastStateChanges = (deviceFeatures, deviceFeatureSelector, lastValue, lastValueChange) => {
    const { lastStateChanges } = this.state;
    const feature = deviceFeatures.find(
      f => f.selector === deviceFeatureSelector && isBinarySensorFeature(f) && f.last_value !== lastValue
    );
    if (!feature) {
      return lastStateChanges;
    }
    return { ...lastStateChanges, [deviceFeatureSelector]: lastValueChange };
  };
  updateDeviceTextWebsocket = payload => {
    let { deviceFeatures } = this.state;
    if (deviceFeatures) {
      deviceFeatures = updateDeviceFeaturesString(
        deviceFeatures,
        payload.device_feature,
        payload.last_value_string,
        payload.last_value_changed
      );
      this.setState({
        deviceFeatures
      });
    }
  };

  setValueDevice = async (deviceFeature, value) => {
    await this.props.httpClient.post(`/api/v1/device_feature/${deviceFeature.selector}/value`, {
      value
    });
  };

  changeAllLightsStatusRoom = async () => {
    const newValue = this.getLightStatus() === 0 ? 1 : 0;
    // Foreach device features
    await Promise.map(this.state.deviceFeatures, async feature => {
      const isLightBinary =
        feature.category === DEVICE_FEATURE_CATEGORIES.LIGHT && feature.type === DEVICE_FEATURE_TYPES.LIGHT.BINARY;
      // if device feature is a light, we control it
      if (isLightBinary) {
        return this.updateValue(feature, newValue);
      }
    });
  };

  updateValue = async (deviceFeature, value) => {
    const deviceFeatures = updateDeviceFeatures(this.state.deviceFeatures, deviceFeature.selector, value, new Date());
    await this.setState({
      deviceFeatures
    });
    try {
      await this.setValueDevice(deviceFeature, value);
    } catch (e) {
      console.error(e);
    }
  };

  setValueDeviceDebounce = debounce(this.updateValue.bind(this), 200);

  updateValueWithDebounce = async (deviceFeature, value) => {
    const deviceFeatures = updateDeviceFeatures(this.state.deviceFeatures, deviceFeature.selector, value, new Date());
    this.setState({
      deviceFeatures
    });
    await this.setValueDeviceDebounce(deviceFeature, value);
  };

  getLightStatus = () => {
    let roomLightStatus = 0;
    this.state.deviceFeatures.forEach(feature => {
      // if it's a light
      const isLight =
        feature.category === DEVICE_FEATURE_CATEGORIES.LIGHT &&
        feature.type === DEVICE_FEATURE_TYPES.LIGHT.BINARY &&
        feature.read_only === false;
      // if it's a light and it's turned on, we consider that the light
      // is on in the room
      if (isLight && feature.last_value === 1) {
        roomLightStatus = 1;
      }
    });
    return roomLightStatus;
  };

  componentDidMount() {
    this.refreshData();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STRING_STATE,
      this.updateDeviceTextWebsocket
    );
    this.props.session.dispatcher.addListener('websocket.connected', this.handleWebsocketConnected);
  }

  componentDidUpdate(previousProps) {
    const deviceFeaturesChanged = get(previousProps, 'box.device_features') !== get(this.props, 'box.device_features');
    const displayLastStateChangeChanged =
      get(previousProps, 'box.display_last_state_change') !== get(this.props, 'box.display_last_state_change');
    if (deviceFeaturesChanged) {
      this.refreshData();
    } else if (displayLastStateChangeChanged) {
      this.getLastStateChanges(this.state.deviceFeatures);
    }
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STRING_STATE,
      this.updateDeviceTextWebsocket
    );
    this.props.session.dispatcher.removeListener('websocket.connected', this.handleWebsocketConnected);
  }

  render(props, { deviceFeatures, lastStateChanges, status }) {
    const boxTitle = props.box.name;
    const loading = status === RequestStatus.Getting;
    const roomLightStatus = this.getLightStatus();

    return (
      <DeviceCard
        {...props}
        loading={loading}
        boxTitle={boxTitle}
        deviceFeatures={deviceFeatures}
        lastStateChanges={lastStateChanges}
        roomLightStatus={roomLightStatus}
        updateValue={this.updateValue}
        updateValueWithDebounce={this.updateValueWithDebounce}
        changeAllLightsStatusRoom={this.changeAllLightsStatusRoom}
        intl={this.props.intl}
      />
    );
  }
}

export default withIntlAsProp(connect('session,httpClient,user', {})(DevicesComponent));
