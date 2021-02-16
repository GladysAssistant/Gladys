import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Select from 'react-select';
import actions from '../../actions/house';

@connect('houses', actions)
class RoomSelector extends Component {
  updateSelection = option => {
    this.props.updateRoomSelection(option.room);
  };

  componentDidMount = () => {
    this.props.getHouses();
  };

  componentWillReceiveProps = newProps => {
    let selectedRoom;
    let houseOptions = [];
    if (newProps.houses) {
      houseOptions = newProps.houses.map(house => {
        return {
          label: house.name,
          options:
            house && house.rooms
              ? house.rooms.map(room => {
                  const option = {
                    label: room.name,
                    value: room.selector,
                    room
                  };

                  if (newProps.selectedRoom === room.selector || newProps.selectedRoom === room.id) {
                    selectedRoom = option;
                  }

                  return option;
                })
              : []
        };
      });
    }

    this.setState({ houseOptions, selectedRoom });
  };

  render({}, { selectedRoom, houseOptions }) {
    return <Select value={selectedRoom} options={houseOptions} onChange={this.updateSelection} />;
  }
}

export default RoomSelector;
