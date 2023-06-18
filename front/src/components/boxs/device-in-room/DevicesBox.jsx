import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import { RequestStatus } from '../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import DeviceCard from './DeviceCard';
import debounce from 'debounce';

const updateDevices = (devices, deviceFeatureSelector, lastValue, lastValueChange) => {
  return devices.map(device => {
    return {
      ...device,
      features: device.features.map(feature => {
        if (feature.selector === deviceFeatureSelector) {
          return {
            ...feature,
            last_value: lastValue,
            last_value_changed: lastValueChange
          };
        }
        return feature;
      })
    };
  });
};

class DevicesComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      devices: [],
      status: RequestStatus.Getting
    };
  }

  refreshData = () => {
    this.getDevices();
  };

  getDevices = async () => {
    this.setState({ status: RequestStatus.Getting });
    try {
      const devices = await this.props.httpClient.get(`/api/v1/device`, {
        device_feature_selectors: this.props.box.device_features.join(',')
      });
      this.setState({
        devices,
        status: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        status: RequestStatus.Error
      });
    }
  };

  updateDeviceStateWebsocket = payload => {
    let devices = this.state.devices;
    if (devices) {
      devices = updateDevices(devices, payload.device_feature_selector, payload.last_value, payload.last_value_changed);
      this.setState({
        devices
      });
    }
  };
  updateDeviceTextWebsocket = payload => {
    let devices = this.state.devices;
    if (devices) {
      devices = updateDevices(devices, payload.device_feature, payload.last_value, payload.last_value_changed);
      this.setState({
        devices
      });
    }
  };

  setValueDevice = async (deviceFeature, value) => {
    await this.props.httpClient.post(`/api/v1/device_feature/${deviceFeature.selector}/value`, {
      value
    });
  };

  //Remove x, y when DeviceInRoom is rewrite without action
  updateValue = async (x, y, device, deviceFeature, deviceIndex, featureIndex, value) => {
    const devices = updateDevices(this.state.devices, deviceFeature.selector, value, new Date());
    this.setState({
      devices
    });
    await this.setValueDevice(deviceFeature, value);
  };

  setValueDeviceDebounce = async (deviceFeature, value) => {
    debounce(() => {
      this.updateValue(deviceFeature, value);
    }, 500);
  };

  //Remove x, y when DeviceInRoom is rewrite without action
  updateValueWithDebounce = async (x, y, device, deviceFeature, deviceIndex, featureIndex, value) => {
    const devices = updateDevices(this.state.devices, deviceFeature.selector, value, new Date());
    this.setState({
      devices
    });
    await this.setValueDeviceDebounce(deviceFeature, value);
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

  render(props, { devices, status }) {
    const boxTitle = props.box.name;
    const loading = status === RequestStatus.Getting && !status;

    return (
      <DeviceCard
        {...props}
        loading={loading}
        boxTitle={boxTitle}
        devices={devices}
        updateValue={this.updateValue}
        updateValueWithDebounce={this.updateValueWithDebounce}
      />
    );
  }
}

export default connect('session,httpClient', {})(DevicesComponent);
