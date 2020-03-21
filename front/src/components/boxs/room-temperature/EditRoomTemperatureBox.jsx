import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/edit-boxes/editTemperatureInRoom';
import BaseEditBox from '../baseEditBox';

import RoomSelector from '../../house/RoomSelector';

const updateBoxRoom = (updateBoxRoomFunc, x, y) => room => {
  updateBoxRoomFunc(x, y, room.selector);
};

const EditRoomTemperatureBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.temperature-in-room">
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.temperatureInRoom.editRoomLabel" />
      </label>
      <RoomSelector
        selectedRoom={props.box.room}
        updateRoomSelection={updateBoxRoom(props.updateBoxRoom, props.x, props.y)}
      />
    </div>
  </BaseEditBox>
);

@connect('', actions)
class EditRoomTemperatureBoxComponent extends Component {
  render(props, {}) {
    return <EditRoomTemperatureBox {...props} />;
  }
}

export default EditRoomTemperatureBoxComponent;
