import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Select from '../form/Select';
import actions from '../../actions/house';
import { RequestStatus } from '../../utils/consts';

@connect('houses,housesGetStatus', actions)
class RoomSelector extends Component {
  componentDidMount = () => {
    this.props.getHouses();
  };

  componentWillReceiveProps = nextProps => {
    if (
      nextProps.houses &&
      (nextProps.selectedRoom !== this.props.selectedRoom || nextProps.housesGetStatus !== this.props.housesGetStatus)
    ) {
      const selectedRoom = nextProps.houses
        .flatMap(house => house.rooms)
        .find(room => room.selector === nextProps.selectedRoom);

      this.setState({ selectedRoom, houses: nextProps.houses });
    }
  };

  render({ housesGetStatus, houses, updateRoomSelection }, { selectedRoom }) {
    return (
      <Select
        value={selectedRoom}
        options={houses}
        onChange={updateRoomSelection}
        itemLabelKey="name"
        useGroups
        groupItemsKey="rooms"
        loading={housesGetStatus === RequestStatus.Getting}
      />
    );
  }
}

export default RoomSelector;
