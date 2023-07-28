import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/boxes/vacbot';
import { DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY, RequestStatus } from '../../../utils/consts';
import get from 'get-value';
import cx from 'classnames';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import VacbotModeControls from './VacbotModeControls';
import VacbotCard from './VacbotCard';
import debounce from 'debounce';

const BOX_KEY = 'Vacbot';

const updateDevice = (device, deviceFeatureSelector, lastValue, lastValueChange) => {
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
};

class VacbotBoxComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      device: undefined,
      vacbotStatus: [],
      status: RequestStatus.Getting
    };
  }

  refreshData = () => {
    this.getDevice();
  };

  getDevice = async () => {
    this.setState({ status: RequestStatus.Getting });
    try {
      const device = await this.props.httpClient.get(`/api/v1/device/${this.props.box.device_feature}`);
      const vacbotStatus = await this.props.httpClient.get(`/api/v1/service/ecovacs/${this.props.box.device_feature}/status`);  
      this.setState({
        device,
        vacbotStatus,
        status: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        status: RequestStatus.Error
      });
    }
  };

  updateDeviceStateWebsocket = payload => {
    let vacbot = this.state.device;
    if (vacbot) {
      vacbot = updateDevice(vacbot, payload.device_feature_selector, payload.last_value, payload.last_value_changed);
      this.setState({
        device: vacbot
      });
    }
  };

  updateDeviceTextWebsocket = payload => {
    let vacbot = this.state.device;
    if (vacbot) {
      vacbot = updateDevice(vacbot, payload.device_feature, payload.last_value, payload.last_value_changed);
      this.setState({
        device: vacbot
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
    const vacbot = updateDevice(device, deviceFeature.selector, value, new Date());
    this.setState({
      device: vacbot
    });
    await this.setValueDevice(deviceFeature, value);
  };

  setValueDeviceDebounce = async (deviceFeature, value) => {
    debounce(() => {
      this.updateValue(deviceFeature, value);
    }, 500);
  };

  //Remove x, y when DeviceInRoom is rewrite without action
  updateValueWithDebounce = async (state, x, y, device, deviceFeature, deviceIndex, featureIndex, value) => {
    const vacbot = updateDevice(this.state.device, deviceFeature.selector, value, new Date());
    console.log(vacbot);
    this.setState({
      device: vacbot
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
    const vacbotChanged = get(previousProps, 'box.vacbot') !== get(this.props, 'box.vacbot');
    const nameChanged = get(previousProps, 'box.name') !== get(this.props, 'box.name');
    const deviceFeaturesChanged = get(previousProps, 'box.device_features') !== get(this.props, 'box.device_features');
    if (deviceFeaturesChanged || vacbotChanged || nameChanged) {
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


  render(props, { device, vacbotStatus, status }) {
    const boxTitle = props.box.title;

    const loading = status === RequestStatus.Getting && !status;
    const error = status === RequestStatus;
    
    
    const name = get(vacbotStatus, 'name');
    const imageUrl = get(vacbotStatus, 'imageUrl');
    const hasMappingCapabilities = get(vacbotStatus, 'hasMappingCapabilities');
    const hasCustomAreaCleaningMode = get(vacbotStatus, 'hasCustomAreaCleaningMode');
    const hasMoppingSystem = get(vacbotStatus, 'hasMoppingSystem');
    const chargeStatus = get(vacbotStatus, 'chargeStatus');
    const cleanReport = get(vacbotStatus, 'cleanReport');
    const batteryLevel = get(vacbotStatus, 'batteryLevel');
    
    const deviceFeature = this.props.box.device_feature;
    const deviceFeatureIndex = 0;
    
    
    return (
      
      <VacbotCard
        {...props}
        loading={loading}
        error={error}
        boxTitle={boxTitle}

        name={name}
        imageUrl={imageUrl}
        hasMappingCapabilities={hasMappingCapabilities}
        hasCustomAreaCleaningMode={hasCustomAreaCleaningMode}
        hasMoppingSystem={hasMoppingSystem}
        chargeStatus={chargeStatus}
        cleanReport={cleanReport}
        batteryLevel={batteryLevel}
        device={device}
        deviceFeature={deviceFeature}
        deviceFeatureIndex={deviceFeatureIndex}
        
        updateValue={this.updateValueWithDebounce}
        
        
      />
    );
  }
}

export default connect('session,httpClient,DashboardBoxDataVacbot,DashboardBoxStatusVacbot', actions)(VacbotBoxComponent);

