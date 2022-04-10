import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/boxes/humidityInRoom';
import { DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';
import get from 'get-value';

const isNotNullOrUndefined = value => value !== undefined && value !== null;

const RoomHumidityBox = ({ children, ...props }) => (
  <div class="card p-3">
    <div class="d-flex align-items-center">
      {props.humidity > 45 && props.humidity < 60 && (
        <span class="stamp stamp-md bg-green mr-3">
          <i class="ti ti-droplet" />
        </span>
      )}
      {props.humidity <= 45 && (
        <span class="stamp stamp-md bg-yellow mr-3">
          <i class="ti ti-droplet" />
        </span>
      )}
      {props.humidity >= 60 && (
        <span class="stamp stamp-md bg-blue mr-3">
          <i class="ti ti-droplet" />
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
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}HumidityInRoom.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}HumidityInRoom.${props.x}_${props.y}`);
    const humidity = get(boxData, 'room.humidity.humidity');
    const unit = get(boxData, 'room.humidity.unit');
    const roomName = get(boxData, 'room.name');
    return <RoomHumidityBox {...props} humidity={humidity} unit={unit} boxStatus={boxStatus} roomName={roomName} />;
  }
}

export default connect(
  'DashboardBoxDataHumidityInRoom,DashboardBoxStatusHumidityInRoom',
  actions
)(RoomHumidityBoxComponent);
