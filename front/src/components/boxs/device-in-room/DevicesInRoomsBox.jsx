import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import cx from 'classnames';

import actions from '../../../actions/dashboard/boxes/devicesInRoom';
import { RequestStatus, DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  WEBSOCKET_MESSAGE_TYPES
} from '../../../../../server/utils/constants';

import DeviceRow from './DeviceRow';

const hasSwitchFeature = (device, featureSelectors) => {
  return device.features.find(feature => isSwitchFeature(feature, featureSelectors));
};

const isSwitchFeature = (feature, featureSelectors) => {
  return (
    feature.category === DEVICE_FEATURE_CATEGORIES.LIGHT &&
    feature.type === DEVICE_FEATURE_TYPES.LIGHT.BINARY &&
    feature.read_only === false &&
    featureSelectors.includes(feature.selector)
  );
};

const changeAllLightsStatusRoom = (props, boxData) => () => {
  const newStatus = boxData.roomLightStatus === 1 ? 0 : 1;
  props.changeAllLightsStatusRoom(props.x, props.y, newStatus);
};

const DeviceInRoomCard = ({ children, ...props }) => {
  const { roomName, boxData, loading, devices = [], box = {} } = props;
  const { device_features: featureSelectors = [] } = box;

  const hasBinaryLightDeviceFeature = devices.find(device => hasSwitchFeature(device, featureSelectors)) !== undefined;

  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">{roomName}</h3>
        {hasBinaryLightDeviceFeature && (
          <div class="card-options">
            <label class="custom-switch m-0">
              <input
                type="checkbox"
                name={boxData.room.selector}
                value="1"
                class="custom-switch-input"
                checked={boxData.roomLightStatus === 1}
                onClick={changeAllLightsStatusRoom(props, boxData)}
              />
              <span class="custom-switch-indicator" />
            </label>
          </div>
        )}
      </div>
      <div
        class={cx('dimmer', {
          active: loading
        })}
      >
        <div class="loader py-3" />
        <div class="dimmer-content">
          <div class="table-responsive">
            <table class="table card-table table-vcenter">
              <tbody>
                {devices.map((device, deviceIndex) =>
                  device.features.map(
                    (deviceFeature, deviceFeatureIndex) =>
                      featureSelectors.indexOf(deviceFeature.selector) !== -1 && (
                        <DeviceRow
                          user={props.user}
                          x={props.x}
                          y={props.y}
                          device={device}
                          deviceFeature={deviceFeature}
                          roomIndex={props.roomIndex}
                          deviceIndex={deviceIndex}
                          deviceFeatureIndex={deviceFeatureIndex}
                          updateValue={props.updateValue}
                          updateValueWithDebounce={props.updateValueWithDebounce}
                        />
                      )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

class DevicesInRoomComponent extends Component {
  refreshData = () => {
    this.props.getDevicesInRoom(this.props.box, this.props.x, this.props.y);
  };
  updateDeviceStateWebsocket = payload => this.props.deviceFeatureWebsocketEvent(this.props.x, this.props.y, payload);
  updateDeviceTextWebsocket = payload =>
    this.props.deviceFeatureStringStateWebsocketEvent(this.props.x, this.props.y, payload);

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
    const roomChanged = get(previousProps, 'box.room') !== get(this.props, 'box.room');
    const deviceFeaturesChanged = get(previousProps, 'box.device_features') !== get(this.props, 'box.device_features');
    if (roomChanged || deviceFeaturesChanged) {
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

  render(props, {}) {
    // safely get all data
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}DevicesInRoom.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}DevicesInRoom.${props.x}_${props.y}`);
    const roomName = get(boxData, `room.name`);
    const devices = get(boxData, `room.devices`);
    const loading = boxStatus === RequestStatus.Getting && !boxData;

    return <DeviceInRoomCard {...props} boxData={boxData} loading={loading} roomName={roomName} devices={devices} />;
  }
}

export default connect(
  'session,user,DashboardBoxDataDevicesInRoom,DashboardBoxStatusDevicesInRoom',
  actions
)(DevicesInRoomComponent);
