import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/edit-boxes/editHumidityInRoom';
import BaseEditBox from '../baseEditBox';

import RoomSelector from '../../house/RoomSelector';

const updateBoxRoom = (updateBoxRoomFunc, x, y) => room => {
  updateBoxRoomFunc(x, y, room.selector);
};

const EditRoomHumidityBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.humidity-in-room">
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.humidityInRoom.editRoomLabel" />
      </label>
      <RoomSelector
        selectedRoom={props.box.room}
        updateRoomSelection={updateBoxRoom(props.updateBoxRoom, props.x, props.y)}
      />
    </div>
  </BaseEditBox>
);

@connect('', actions)
class EditRoomHumidityBoxComponent extends Component {
  render(props, {}) {
    return <EditRoomHumidityBox {...props} />;
  }
}

export default EditRoomHumidityBoxComponent;
