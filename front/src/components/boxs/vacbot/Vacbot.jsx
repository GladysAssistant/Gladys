import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/boxes/vacbot';
import { DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY, RequestStatus } from '../../../utils/consts';
import get from 'get-value';
import { WEBSOCKET_MESSAGE_TYPES, DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';
import debounce from 'debounce';
import VacbotModeControls from './VacbotModeControls';

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

const VacbotBox = ({ children, ...props }) => {
  const { boxTitle, deviceFeatures = [], device = {} } = props;

  console.log(`${device.name} features : ${deviceFeatures.map(deviceFeature => deviceFeature.name)}`);
  const debug = false;

  return (
    <div class="card">
      {props.error && (
        <div>
          <p class="alert alert-danger">
            <i class="fe fe-bell" />
            <span class="pl-2">
              <Text id="dashboard.boxes.vacbot.noVacbotInfo" />
            </span>
          </p>
        </div>
      )}
      <div class="card-body ">
        <div class="card-header">
          <div class="d-flex bd-highlight mb-3">
            <h2 class="card-title me-auto p-2 bd-highlight">
              {boxTitle} - {props.vacbotStatus.name}
            </h2>

            <div class="p-2 bd-highlight">
              {props.vacbotStatus.cleanReport == 'idle' && <i class={`list-separated-item fe fe-disc`} />}
              {props.vacbotStatus.chargeStatus == 'returning' && <i class={`list-separated-item fe fe-dowload`} />}
              {props.vacbotStatus.cleanReport == 'auto' && <i class={`list-separated-item fe fe-play-circle`} />}

              {props.vacbotStatus.cleanReport}
            </div>

            <div class="p-2 bd-highlight align-items-right">
              {props.vacbotStatus.chargeStatus == 'charging' && (
                <i class={`fe fe-battery-charging`}>{props.vacbotStatus.batteryLevel}% </i>
              )}
              {props.vacbotStatus.chargeStatus != 'charging' && (
                <i class={`fe fe-battery`} style={{ fontSize: '20px' }}>
                  {props.vacbotStatus.batteryLevel}%
                </i>
              )}
            </div>
          </div>
        </div>

        <div
          class="bg-image d-flex flex-row-reverse"
          style={{
            backgroundImage: `url("https://site-static.ecovacs.com/upload/de/image/product/2022/10/18/074346_9998-DEEBOT-OZMO920-1280x1280.jpg.webp")`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            width: '100%',
            height: '250px',
            position: 'relative'
          }}
        >
          <div class="p-2">
            <button class={`btn btn-sm fe fe-map`} />
            <button class={`btn btn-sm fe fe-codepen`} />
          </div>
          <div class="d-flex align-items-center justify-content-center">
            <div>
              {deviceFeatures.map((deviceFeature, deviceFeatureIndex) => (
                <div class="card-body ">
                  <div class="d-flex bd-highlight mb-3">
                    {deviceFeature.type === DEVICE_FEATURE_TYPES.VACBOT.STATE && (
                      <VacbotModeControls
                        deviceFeature={deviceFeature}
                        deviceFeatureIndex={deviceFeatureIndex}
                        updateValue={props.updateValue}
                        updateValueWithDebounce={props.updateValueWithDebounce}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {debug && (
        <div class="mt-3">
          DEBUG Vacbot features :
          {deviceFeatures.map(deviceFeature => (
            <div>{deviceFeature.name}</div>
          ))}
          Vacbot other capabilities : hasMoppingSystem : {props.vacbotStatus.hasMoppingSystem}, chargeStatus :{' '}
          {props.vacbotStatus.chargeStatus}, cleanReport : {props.vacbotStatus.cleanReport}
        </div>
      )}
    </div>
  );
};

class VacbotBoxComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      device: {},
      deviceFeatures: [],
      vacbotStatus: [],
      status: RequestStatus.Getting
    };
  }

  refreshData = () => {
    console.log('Call refreshData');
    // this.props.getVacbot(this.props.box, this.props.x, this.props.y);
    this.getDeviceData();
  };

  getDeviceData = async () => {
    this.setState({ status: RequestStatus.Getting });
    try {
      const vacbotStatus = await this.props.httpClient.get(
        `/api/v1/service/ecovacs/${this.props.box.device_feature}/status`
      );
      const device = await this.props.httpClient.get(`/api/v1/device/${this.props.box.device_feature}`);
      const deviceFeatures = device.features;
      this.setState({
        device,
        deviceFeatures,
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
    console.log('Call updateDeviceStateWebsocket');
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
    console.log('Call updateDeviceTextWebsocket');
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

  componentDidMount() {
    console.log('Call componentDidMount');
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
    console.log('Call componentDidUpdate');
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

  setValueDevice = async (deviceFeature, value) => {
    await this.props.httpClient.post(`/api/v1/device_feature/${deviceFeature.selector}/value`, {
      value
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

  render(props, { device, deviceFeatures, vacbotStatus, status }) {
    const loading = status === RequestStatus.Getting && !status;
    console.log(`box status : `, status);
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}Vacbot.${props.x}_${props.y}`);
    console.log(`box data : `, boxData);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}Vacbot.${props.x}_${props.y}`);
    const boxTitle = get(props.box, 'name');
    console.log(`${boxTitle} - ${boxStatus}`);

    console.log(
      `vacbotStatus : ${vacbotStatus.name}, ${vacbotStatus.hasMappingCapabilities}, ${vacbotStatus.hasMoppingSystem}, ${vacbotStatus.chargeStatus}, ${vacbotStatus.cleanReport}, ${vacbotStatus.batteryLevel}`
    );

    const error = boxStatus === RequestStatus.Error;

    console.log(`${device} features : ${deviceFeatures}`);

    return (
      <VacbotBox
        {...props}
        loading={loading}
        boxTitle={boxTitle}
        device={device}
        deviceFeatures={deviceFeatures}
        vacbotStatus={vacbotStatus}
        updateValue={this.updateValue}
        updateValueWithDebounce={this.updateValueWithDebounce}
        error={error}
      />
    );
  }
}

export default connect(
  'session,httpClient,DashboardBoxDataVacbot,DashboardBoxStatusVacbot',
  actions
)(VacbotBoxComponent);
