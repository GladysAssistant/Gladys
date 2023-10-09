import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import actions from '../../../actions/dashboard/boxes/humidityInRoom';
import { DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';
import { DEFAULT_VALUE_HUMIDITY, WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';

const isNotNullOrUndefined = value => value !== undefined && value !== null;

const RoomHumidityBox = ({ children, ...props }) => (
  <div class="card p-3">
    <div class="d-flex align-items-center">
      {isNotNullOrUndefined(props.humidity) &&
        props.humidity >= props.humidityMin &&
        props.humidity <= props.humidityMax && (
          <span class="stamp stamp-md bg-green mr-3">
            <i class="fe fe-droplet" />
          </span>
        )}
      {isNotNullOrUndefined(props.humidity) && props.humidity < props.humidityMin && (
        <span class="stamp stamp-md bg-yellow mr-3">
          <i class="fe fe-droplet" />
        </span>
      )}
      {isNotNullOrUndefined(props.humidity) && props.humidity > props.humidityMax && (
        <span class="stamp stamp-md bg-blue mr-3">
          <i class="fe fe-droplet" />
        </span>
      )}
      {!isNotNullOrUndefined(props.humidity) && (
        <span class="stamp stamp-md bg-warning mr-3">
          <i class="fe fe-droplet" />
        </span>
      )}
      <div>
        {isNotNullOrUndefined(props.humidity) && (
          <h4 class="m-0">
            <Text id="global.percentValue" fields={{ value: Math.round(props.humidity) }} />
          </h4>
        )}
        {!isNotNullOrUndefined(props.humidity) && (
          <p class="m-0">
            <Text id="dashboard.boxes.humidityInRoom.noHumidityRecorded" />
          </p>
        )}
        <small class="text-muted">{props.roomName}</small>
      </div>
    </div>
  </div>
);

class RoomHumidityBoxComponent extends Component {
  refreshData = () => {
    this.props.getHumidityInRoom(this.props.box, this.props.x, this.props.y);
  };

  updateRoomHumidity = payload => {
    this.props.deviceFeatureWebsocketEvent(this.props.box, this.props.x, this.props.y, payload);
  };

  componentDidMount() {
    this.refreshData();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE, this.updateRoomHumidity);
  }

  componentDidUpdate(previousProps) {
    const roomChanged = get(previousProps, 'box.room') !== get(this.props, 'box.room');
    if (roomChanged) {
      this.refreshData();
    }
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE, this.updateRoomHumidity);
  }

  render(props, {}) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}HumidityInRoom.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}HumidityInRoom.${props.x}_${props.y}`);
    const humidity = get(boxData, 'room.humidity.humidity');
    const unit = get(boxData, 'room.humidity.unit');

    const humidity_use_custom_value = get(props, 'box.humidity_use_custom_value');
    let humidity_min = get(props, 'box.humidity_min');
    let humidity_max = get(props, 'box.humidity_max');

    if (!humidity_use_custom_value) {
      humidity_min = DEFAULT_VALUE_HUMIDITY.MINIMUM;
      humidity_max = DEFAULT_VALUE_HUMIDITY.MAXIMUM;
    }

    if (isNaN(humidity_min)) {
      humidity_min = DEFAULT_VALUE_HUMIDITY.MINIMUM;
    }
    if (isNaN(humidity_max)) {
      humidity_max = DEFAULT_VALUE_HUMIDITY.MAXIMUM;
    }

    const roomName = get(boxData, 'room.name');
    return (
      <RoomHumidityBox
        {...props}
        humidity={humidity}
        unit={unit}
        boxStatus={boxStatus}
        roomName={roomName}
        useCustomValue={humidity_use_custom_value}
        humidityMin={humidity_min}
        humidityMax={humidity_max}
      />
    );
  }
}

export default connect(
  'session,DashboardBoxDataHumidityInRoom,DashboardBoxStatusHumidityInRoom',
  actions
)(RoomHumidityBoxComponent);
