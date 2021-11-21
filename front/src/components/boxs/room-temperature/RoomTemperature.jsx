import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/boxes/temperatureInRoom';
import { DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';
import get from 'get-value';

const isNotNullOrUndefined = value => value !== undefined && value !== null;

const RoomTemperatureBox = ({ children, ...props }) => (
  <div class="card p-3">
    <div class="d-flex align-items-center">
      <span class="stamp stamp-md bg-blue mr-3">
        <i class="fe fe-thermometer" />
      </span>
      <div>
        {isNotNullOrUndefined(props.temperature) && (
          <h4 class="m-0">
            <Text id="global.degreeValue" fields={{ value: Math.round(props.temperature) }} />
            {props.unit === 'celsius' ? 'C' : 'F'}
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

  componentDidMount() {
    this.refreshData();
  }

  componentDidUpdate(previousProps) {
    const roomChanged = get(previousProps, 'box.room') !== get(this.props, 'box.room');
    if (roomChanged) {
      this.refreshData();
    }
  }

  render(props, {}) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}TemperatureInRoom.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}TemperatureInRoom.${props.x}_${props.y}`);
    const temperature = get(boxData, 'room.temperature.temperature');
    const unit = get(boxData, 'room.temperature.unit');
    const roomName = get(boxData, 'room.name');
    return (
      <RoomTemperatureBox {...props} temperature={temperature} unit={unit} boxStatus={boxStatus} roomName={roomName} />
    );
  }
}

export default connect(
  'DashboardBoxDataTemperatureInRoom,DashboardBoxStatusTemperatureInRoom',
  actions
)(RoomTemperatureBoxComponent);
