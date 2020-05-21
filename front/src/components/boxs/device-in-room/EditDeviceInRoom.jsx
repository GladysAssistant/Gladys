import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';

import BaseEditBox from '../baseEditBox';
import RoomSelector from '../../house/RoomSelector';

import actions from '../../../actions/dashboard/edit-boxes/editDevicesInRoom';

@connect('', actions)
class EditDeviceInRoom extends Component {
  updateBoxRoom = room => {
    this.props.updateBoxRoom(this.props.x, this.props.y, room.selector);
  };

  render(props) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.devices-in-room">
        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.devicesInRoom.editRoomLabel" />
          </label>
          <RoomSelector selectedRoom={props.box.room} updateRoomSelection={this.updateBoxRoom} />
        </div>
      </BaseEditBox>
    );
  }
}

export default EditDeviceInRoom;
