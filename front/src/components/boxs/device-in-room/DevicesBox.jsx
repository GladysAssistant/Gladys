import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Promise from 'bluebird';
import get from 'get-value';
import { RequestStatus } from '../../../utils/consts';
import {
  WEBSOCKET_MESSAGE_TYPES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES
} from '../../../../../server/utils/constants';
import DeviceCard from './DeviceCard';
import debounce from 'debounce';

const updateDeviceFeatures = (deviceFeatures, deviceFeatureSelector, lastValue, lastValueChange) => {
  return deviceFeatures.map(feature => {
    if (feature.selector === deviceFeatureSelector) {
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
      status: RequestStatus.Getting
    };
  }

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
    } catch (e) {
      this.setState({
        status: RequestStatus.Error
      });
    }
  };

  updateDeviceStateWebsocket = payload => {
    let { deviceFeatures } = this.state;
    if (deviceFeatures) {
      deviceFeatures = updateDeviceFeatures(
        deviceFeatures,
        payload.device_feature_selector,
        payload.last_value,
        payload.last_value_changed
      );
      this.setState({
        deviceFeatures
      });
    }
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
  }

  componentDidUpdate(previousProps) {
    const deviceFeaturesChanged = get(previousProps, 'box.device_features') !== get(this.props, 'box.device_features');
    if (deviceFeaturesChanged) {
      this.refreshData();
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
  }

  render(props, { deviceFeatures, status }) {
    const boxTitle = props.box.name;
    const loading = status === RequestStatus.Getting && !status;
    const roomLightStatus = this.getLightStatus();

    return (
      <DeviceCard
        {...props}
        loading={loading}
        boxTitle={boxTitle}
        deviceFeatures={deviceFeatures}
        roomLightStatus={roomLightStatus}
        updateValue={this.updateValue}
        updateValueWithDebounce={this.updateValueWithDebounce}
        changeAllLightsStatusRoom={this.changeAllLightsStatusRoom}
      />
    );
  }
}

export default connect('session,httpClient,user', {})(DevicesComponent);
