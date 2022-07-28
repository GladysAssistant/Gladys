import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import actions from '../../../actions/dashboard/boxes/temperatureInRoom';
import { DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';

const isNotNullOrUndefined = value => value !== undefined && value !== null;

const RoomTemperatureBox = ({ children, ...props }) => (
  <div class="card p-3">
    <div class="d-flex align-items-center">
      <span class="stamp stamp-md bg-blue mr-3">
        <i class="fe fe-thermometer" />
      </span>
      <div>
        {props.valued && (
          <h4 class="m-0">
            <Text id="global.degreeValue" fields={{ value: Math.round(props.temperature) }} />
            <Text id={`global.${props.unit}`} />
          </h4>
        )}
        {!props.valued && (
          <p class="m-0">
            <Text id="dashboard.boxes.temperatureInRoom.noTemperatureRecorded" />
          </p>
        )}
        <small class="text-muted">{props.roomName}</small>
      </div>
    </div>
  </div>
);

class RoomTemperatureBoxComponent extends Component {
  refreshData = () => {
    this.props.getTemperatureInRoom(this.props.box, this.props.x, this.props.y);
  };

  updateRoomTemperature = payload => {
    this.props.deviceFeatureWebsocketEvent(this.props.box, this.props.x, this.props.y, payload);
  };

  componentDidMount() {
    this.refreshData();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE, this.updateRoomTemperature);
  }

  componentDidUpdate(previousProps) {
    const roomChanged = get(previousProps, 'box.room') !== get(this.props, 'box.room');
    if (roomChanged) {
      this.refreshData();
    }
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE, this.updateRoomTemperature);
  }

  render(props, {}) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}TemperatureInRoom.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}TemperatureInRoom.${props.x}_${props.y}`);
    const temperature = get(boxData, 'room.temperature.temperature');
    const unit = get(boxData, 'room.temperature.unit');
    const roomName = get(boxData, 'room.name');
    const valued = isNotNullOrUndefined(temperature);

    return (
      <RoomTemperatureBox
        {...props}
        temperature={temperature}
        unit={unit}
        boxStatus={boxStatus}
        roomName={roomName}
        valued={valued}
      />
    );
  }
}

export default connect(
  'session,DashboardBoxDataTemperatureInRoom,DashboardBoxStatusTemperatureInRoom',
  actions
)(RoomTemperatureBoxComponent);
