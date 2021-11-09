import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import cx from 'classnames';

import actions from '../../../actions/house';
import { RequestStatus } from '../../../utils/consts';

@connect('houses,housesGetStatus', actions)
class DeviceRoomSelector extends Component {
  componentWillMount() {
    this.props.getHouses();
  }

  render({ houses = [], housesGetStatus = RequestStatus.Getting, selectedRoomId, updateRoom, disabled, inputId }) {
    if (housesGetStatus === RequestStatus.Error) {
      return (
        <div class="alert alert-danger py-2">
          <Text id="house.loadingHouseError" />
        </div>
      );
    }

    return (
      <div
        class={cx('dimmer', {
          active: housesGetStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <select onChange={updateRoom} class="form-control" id={inputId} disabled={disabled}>
            <option value="">
              <Text id="global.emptySelectOption" />
            </option>
            {houses.map(house => (
              <optgroup label={house.name}>
                {house.rooms.map(room => (
                  <option selected={room.id === selectedRoomId} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
    );
  }
}

export default DeviceRoomSelector;
