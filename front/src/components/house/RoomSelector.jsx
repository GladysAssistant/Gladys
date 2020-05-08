import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Select from '../form/Select';
import actions from '../../actions/house';
import { RequestStatus } from '../../utils/consts';

@connect('houses,housesGetStatus', actions)
class RoomSelector extends Component {
  componentDidMount = () => {
    if (!this.props.houses) {
      this.props.getHouses();
    }
  };

  render({ housesGetStatus, houses, updateRoomSelection, selectedRoom, uniqueKey, disabled, clearable }) {
    return (
      <Select
        value={selectedRoom}
        options={houses}
        onChange={updateRoomSelection}
        uniqueKey={uniqueKey || 'selector'}
        itemLabelKey="name"
        useGroups
        groupItemsKey="rooms"
        loading={housesGetStatus === RequestStatus.Getting}
        disabled={disabled}
        clearable={clearable}
      />
    );
  }
}

export default RoomSelector;
