import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../../actions/dashboard/boxes/devicesInRoom';
import { RequestStatus, DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';
// import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import get from 'get-value';

import DeviceRow from './DeviceRow';

const cardStyle = {
  maxHeight: '20rem'
};

const minHeight = {
  minHeight: '6rem'
};

const changeAllLightsStatusRoom = (props, boxData) => () => {
  const newStatus = boxData.roomLightStatus === 1 ? 0 : 1;
  props.changeAllLightsStatusRoom(props.x, props.y, newStatus);
};

const RoomCard = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">{props.roomName}</h3>
        {props.boxData && props.hasBinaryLightDeviceFeature && (
          <div class="card-options">
            <label class="custom-switch m-0">
              <input
                type="checkbox"
                name={props.boxData.room.selector}
                value="1"
                class="custom-switch-input"
                checked={props.boxData.roomLightStatus === 1}
                onClick={changeAllLightsStatusRoom(props, props.boxData)}
              />
              <span class="custom-switch-indicator" />
            </label>
          </div>
        )}
      </div>
      {props.loading && (
        <div class="card-body o-auto" style={cardStyle}>
          <div class={props.loading ? 'dimmer active' : 'dimmer'}>
            <div class="loader" />
            <div class="dimmer-content">{props.loading && <div style={minHeight} />}</div>
          </div>
        </div>
      )}
      <div class="table-responsive" style={cardStyle}>
        <table class="table card-table table-vcenter">
          <tbody>
            {props.devices &&
              props.devices.map((device, deviceIndex) =>
                device.features.map((deviceFeature, deviceFeatureIndex) => (
                  <DeviceRow
                    device={device}
                    deviceFeature={deviceFeature}
                    roomIndex={props.roomIndex}
                    deviceIndex={deviceIndex}
                    deviceFeatureIndex={deviceFeatureIndex}
                    updateValue={props.updateValue}
                  />
                ))
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

@connect(
  'session,DashboardBoxDataDevicesInRoom,DashboardBoxStatusDevicesInRoom',
  actions
)
class DevicesInRoomComponent extends Component {
  componentDidMount() {
    this.props.getDevicesInRoom(this.props.box, this.props.x, this.props.y);
  }

  render(props, {}) {
    // safely get all data
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}DevicesInRoom.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}DevicesInRoom.${props.x}_${props.y}`);
    const roomName = get(boxData, `room.name`);
    const devices = get(boxData, `room.devices`);
    const hasBinaryLightDeviceFeature = get(boxData, 'hasBinaryLightDeviceFeature');
    const loading = boxStatus === RequestStatus.Getting && !boxData;

    return (
      <RoomCard
        {...props}
        boxData={boxData}
        loading={loading}
        roomName={roomName}
        devices={devices}
        hasBinaryLightDeviceFeature={hasBinaryLightDeviceFeature}
      />
    );
  }
}

export default DevicesInRoomComponent;
