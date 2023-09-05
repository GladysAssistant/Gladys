import { Component } from 'preact';
import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';

import RoomSelector from '../../house/RoomSelector';
import InputWithUnit from './InputWithUnit';

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
    <div className="form-group form-check">
      <label className="form-check-label">
        <input type="checkbox" checked={true} className="form-check-input" />
        <Text id="dashboard.boxes.humidityInRoom.test" />
      </label>
    </div>
    <div className="form-group container">
      <div class="row">
        <span class="stamp stamp-sm bg-yellow mr-1">
          <i class="fe fe-droplet" />
        </span>
        <InputWithUnit unit="%" value={'45'} classNames="mr-1" />
        <span class="stamp stamp-sm bg-green mr-1">
          <i class="fe fe-droplet" />
        </span>
        <InputWithUnit unit="%" value={'60'} classNames="mr-1" />
        <span class="stamp stamp-sm bg-blue">
          <i class="fe fe-droplet" />
        </span>
      </div>
    </div>
  </BaseEditBox>
);

class EditRoomHumidityBoxComponent extends Component {
  updateBoxRoom = (x, y, selector) => {
    this.props.updateBoxConfig(x, y, {
      room: selector
    });
  };
  render(props, {}) {
    return <EditRoomHumidityBox {...props} updateBoxRoom={this.updateBoxRoom} />;
  }
}

export default EditRoomHumidityBoxComponent;
