import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/boxes/vacbot';
import { RequestStatus } from '../../../utils/consts';
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

const VacbotBatteryBox = ({ children, ...props }) => {
  const { vacbotStatus } = props;
  const batteryLevel = vacbotStatus.batteryLevel;
  const chargeStatus = vacbotStatus.chargeStatus;

  return (
    <div class="vacbotBatteryLevel">
      {chargeStatus == 'charging' && <i class={`fe fe-battery-charging`}>{batteryLevel}% </i>}
      {chargeStatus != 'charging' && (
        <i class={`fe fe-battery`} style={{ fontSize: '20px' }}>
          {batteryLevel}%
        </i>
      )}
    </div>
  );
};
const VacbotCleanReportBox = ({ children, ...props }) => {
  const { vacbotStatus } = props;
  const cleanReport = vacbotStatus.cleanReport;
  const chargeStatus = vacbotStatus.chargeStatus;
  return (
    <div class="vacbotReport">
      {cleanReport == 'idle' && <i class={`list-separated-item fe fe-disc`} />}
      {chargeStatus == 'returning' && <i class={`list-separated-item fe fe-dowload`} />}
      {cleanReport == 'auto' && <i class={`list-separated-item fe fe-play-circle`} />}
      {cleanReport == 'pause' && <i class={`list-separated-item fe fe-pause-circle`} />}
      {cleanReport == 'spot_area' && <i class={`list-separated-item fe fe-layers-circle`} />}
      {cleanReport == 'singleroom' && <i class={`list-separated-item fe fe-codepen-circle`} />}

      {cleanReport}
    </div>
  );
};

const VacbotBox = ({ children, ...props }) => {
  const { boxTitle, deviceFeatures = [] } = props;

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
      {!props.error && (
        <div class="card-body">
          <div class="d-flex bd-highlight">
            <h2 class="card-title bd-highlight mr-auto ">{boxTitle}</h2>

            <div class="p-2 bd-highlight">
              <VacbotCleanReportBox {...props} />
            </div>

            <div class="p-2 bd-highlight">
              <VacbotBatteryBox {...props} />
            </div>
          </div>

          <div
            title={`${props.vacbotStatus.name}`}
            class="bg-image"
            style={{
              backgroundImage: `url("https://site-static.ecovacs.com/upload/de/image/product/2022/10/18/074346_9998-DEEBOT-OZMO920-1280x1280.jpg.webp")`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              width: '100%',
              height: '250px',
              position: 'relative'
            }}
          >
            <div class="d-flex align-items-center justify-content-center">
              <div>
                {deviceFeatures.map((deviceFeature, deviceFeatureIndex) => (
                  <div class="card-body ">
                    {!props.vacbotStatus.isOnline && <div> OFFLINE </div>}
                    {props.vacbotStatus.isOnline && (
                      <div class="d-flex bd-highlight mt-9">
                        {deviceFeature.type === DEVICE_FEATURE_TYPES.VACBOT.STATE && (
                          <VacbotModeControls
                            deviceFeature={deviceFeature}
                            deviceFeatureIndex={deviceFeatureIndex}
                            updateValue={props.updateValue}
                            updateValueWithDebounce={props.updateValueWithDebounce}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
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
  getDevice = async () => {
    try {
      this.setState({ status: RequestStatus.Getting });
      const vacbotDevice = await this.props.httpClient.get(`/api/v1/device/${this.props.box.device_feature}`);
      const deviceFeatures = vacbotDevice.features;
      const batteryFeature = vacbotDevice.features.find(f => f.type === DEVICE_FEATURE_TYPES.VACBOT.BATTERY);
      const cleanReportFeature = vacbotDevice.features.find(f => f.type === DEVICE_FEATURE_TYPES.VACBOT.CLEAN_REPORT);
      this.setState({
        vacbotDevice,
        deviceFeatures,
        batteryFeature,
        cleanReportFeature,
        status: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({
        status: RequestStatus.Error
      });
    }
  };
  refreshData = async () => {
    try {
      this.setState({ status: RequestStatus.Getting });

      const vacbotStatus = await this.props.httpClient.get(
        `/api/v1/service/ecovacs/${this.props.box.device_feature}/status`
      );
      this.setState({
        vacbotStatus,
        status: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({
        status: RequestStatus.Error
      });
    }
  };

  updateDeviceStateWebsocket = () => {
    this.refreshData();
  };

  componentDidMount() {
    this.getDevice();
    this.refreshData();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
  }

  componentDidUpdate(previousProps) {
    const vacbotDeviceChanged = get(previousProps, 'box.vacbot') !== get(this.props, 'box.vacbot');
    const nameChanged = get(previousProps, 'box.name') !== get(this.props, 'box.name');
    if (vacbotDeviceChanged || nameChanged) {
      this.refreshData();
    }
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
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
    const boxTitle = get(this.props.box, 'title');
    const error = status === RequestStatus.Error;

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
