import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/edit-boxes/editTemperatureInRoom';
import BaseEditBox from '../baseEditBox';

const updateBoxRoom = (updateBoxRoomFunc, x, y) => e => {
  updateBoxRoomFunc(x, y, e.target.value);
};

const EditRoomTemperatureBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.temperature-in-room">
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.temperatureInRoom.editRoomLabel" />
      </label>
      <select onChange={updateBoxRoom(props.updateBoxRoom, props.x, props.y)} class="form-control">
        <option value="">-------</option>
        {props.rooms &&
          props.rooms.map(room => (
            <option selected={room.selector === props.box.room} value={room.selector}>
              {room.name}
            </option>
          ))}
      </select>
    </div>
  </BaseEditBox>
);

@connect(
  'rooms',
  actions
)
class EditRoomTemperatureBoxComponent extends Component {
  componentDidMount() {
    this.props.getRooms();
  }

  render(props, {}) {
    return <EditRoomTemperatureBox {...props} />;
  }
}

export default EditRoomTemperatureBoxComponent;
