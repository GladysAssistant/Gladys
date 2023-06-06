import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import actions from '../../../actions/dashboard/boxes/devicesInRoom';
import { RequestStatus, DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import DeviceCard from './DeviceCard';

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

    const roomLightStatus = get(boxData, `roomLightStatus`);
    const loading = boxStatus === RequestStatus.Getting && !boxData;

    return (
      <DeviceCard
        {...props}
        loading={loading}
        boxTitle={roomName}
        devices={devices}
        roomLightStatus={roomLightStatus}
      />
    );
  }
}

export default connect(
  'session,user,DashboardBoxDataDevicesInRoom,DashboardBoxStatusDevicesInRoom',
  actions
)(DevicesInRoomComponent);
