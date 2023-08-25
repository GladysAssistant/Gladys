import { Component } from 'preact';
import { connect } from 'unistore/preact';

import DeviceBox from './DevicesBox';

class DevicesInRoomComponent extends Component {
  getRoom = async () => {
    try {
      const room = await this.props.httpClient.get(`/api/v1/room/${this.props.box.room}`);
      this.setState({
        room
      });
    } catch (e) {
      console.error(e);
    }
  };
  componentDidMount() {
    this.getRoom();
  }
  render({ box }, { room }) {
    const boxModified = { ...box, name: room && room.name };
    return <DeviceBox box={boxModified} />;
  }
}

export default connect('httpClient', {})(DevicesInRoomComponent);
