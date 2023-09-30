import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Select from 'react-select';

class RoomSelector extends Component {
  updateSelection = option => {
    this.props.updateRoomSelection(option.room);
  };

  refreshOptions = () => {
    if (this.state.houses) {
      let selectedRoom;
      const houseOptions = this.state.houses.map(house => {
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

                  if (this.props.selectedRoom === room.selector) {
                    selectedRoom = option;
                  }

                  return option;
                })
              : []
        };
      });

      this.setState({ houseOptions, selectedRoom });
    }
  };

  getHouses = async () => {
    try {
      await this.setState({
        pending: true
      });
      const params = {
        expand: 'rooms',
        order_dir: 'asc'
      };
      const houses = await this.props.httpClient.get(`/api/v1/house`, params);
      houses.forEach(house => house.rooms.sort((r1, r2) => r1.name.localeCompare(r2.name)));
      await this.setState({
        houses,
        pending: false,
        error: false
      });
      this.refreshOptions();
    } catch (e) {
      this.setState({
        pending: false,
        error: true
      });
    }
  };

  componentDidMount = () => {
    this.getHouses();
  };

  componentWillReceiveProps() {
    this.refreshOptions();
  }

  render({}, { selectedRoom, houseOptions }) {
    return (
      <Select
        value={selectedRoom}
        options={houseOptions}
        onChange={this.updateSelection}
        maxMenuHeight={220}
        styles={{
          // Fixes the overlapping problem
          menu: provided => ({ ...provided, zIndex: 100 })
        }}
      />
    );
  }
}

export default connect('httpClient', {})(RoomSelector);
