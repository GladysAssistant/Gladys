import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import actions from '../../../actions/dashboard/boxes/temperatureInRoom';
import { DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';
import {
  DEFAULT_VALUE_TEMPERATURE,
  DEVICE_FEATURE_UNITS,
  WEBSOCKET_MESSAGE_TYPES
} from '../../../../../server/utils/constants';
import { celsiusToFahrenheit } from '../../../../../server/utils/units';

const isNotNullOrUndefined = value => value !== undefined && value !== null;

const RoomTemperatureBox = ({ children, ...props }) => (
  <div class="card p-3">
    <div class="d-flex align-items-center">
      {isNotNullOrUndefined(props.temperature) &&
        props.temperature >= props.temperatureMin &&
        props.temperature <= props.temperatureMax && (
          <span class="stamp stamp-md bg-green mr-3">
            <i class="fe fe-thermometer" />
          </span>
        )}
      {isNotNullOrUndefined(props.temperature) && props.temperature < props.temperatureMin && (
        <span class="stamp stamp-md bg-blue mr-3">
          <i class="fe fe-thermometer" />
        </span>
      )}
      {isNotNullOrUndefined(props.temperature) && props.temperature > props.temperatureMax && (
        <span class="stamp stamp-md bg-red mr-3">
          <i class="fe fe-thermometer" />
        </span>
      )}
      {!isNotNullOrUndefined(props.temperature) && (
        <span class="stamp stamp-md bg-warning mr-3">
          <i class="fe fe-thermometer" />
        </span>
      )}

      <div>
        {isNotNullOrUndefined(props.temperature) && (
          <h4 class="m-0">
            <Text id="global.degreeValue" fields={{ value: Number(props.temperature).toFixed(1) }} />
            <Text id={`global.${props.unit}`} />
          </h4>
        )}
        {!isNotNullOrUndefined(props.temperature) && (
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

    const temperature_use_custom_value = get(props, 'box.temperature_use_custom_value');
    let temperature_min = get(props, 'box.temperature_min');
    let temperature_max = get(props, 'box.temperature_max');

    if (!temperature_use_custom_value) {
      temperature_min = DEFAULT_VALUE_TEMPERATURE.MINIMUM;
      temperature_max = DEFAULT_VALUE_TEMPERATURE.MAXIMUM;
    }

    if (isNaN(temperature_min)) {
      temperature_min = DEFAULT_VALUE_TEMPERATURE.MINIMUM;
    }
    if (isNaN(temperature_max)) {
      temperature_max = DEFAULT_VALUE_TEMPERATURE.MAXIMUM;
    }

    if (unit === DEVICE_FEATURE_UNITS.FAHRENHEIT) {
      temperature_min = celsiusToFahrenheit(temperature_min);
      temperature_max = celsiusToFahrenheit(temperature_min);
    }

    return (
      <RoomTemperatureBox
        {...props}
        temperature={temperature}
        unit={unit}
        boxStatus={boxStatus}
        roomName={roomName}
        useCustomValue={temperature_use_custom_value}
        temperatureMin={temperature_min}
        temperatureMax={temperature_max}
      />
    );
  }
}

export default connect(
  'session,DashboardBoxDataTemperatureInRoom,DashboardBoxStatusTemperatureInRoom',
  actions
)(RoomTemperatureBoxComponent);
