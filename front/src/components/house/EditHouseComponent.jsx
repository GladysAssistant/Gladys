import { Component } from 'preact';

import EditHouse from './EditHouse';

class EditHouseComponent extends Component {
  updateNewRoomName = e => {
    this.setState({
      newRoomName: e.target.value
    });
  };
  updateHouseName = e => {
    this.props.updateHouseName(e.target.value, this.props.houseIndex);
  };
  addRoom = () => {
    this.props.addRoom(this.state.newRoomName, this.props.houseIndex);
    this.setState({
      newRoomName: ''
    });
  };
  removeRoom = roomIndex => {
    this.props.removeRoom(this.props.houseIndex, roomIndex);
  };
  saveHouse = async () => {
    this.setState({
      loading: true
    });
    await this.props.saveHouse(this.props.houseIndex);
    this.setState({
      loading: false
    });
  };
  deleteHouse = () => {
    this.setState({
      wantToDeleteHouse: true
    });
  };
  confirmDeleteHouse = async () => {
    this.setState({
      wantToDeleteHouse: false,
      loading: true
    });
    await this.props.deleteHouse(this.props.houseIndex);
    this.setState({
      loading: false
    });
  };
  cancelDeleteHouse = () => {
    this.setState({
      wantToDeleteHouse: false
    });
  };
  onKeyPressRoomInput = e => {
    if (e.keyCode === 13) {
      this.addRoom();
    }
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      newRoomName: ''
    };
  }

  render(props, { newRoomName, wantToDeleteHouse, loading }) {
    return (
      <EditHouse
        {...props}
        setMapRef={this.setMapRef}
        updateHouseName={this.updateHouseName}
        updateNewRoomName={this.updateNewRoomName}
        newRoomName={newRoomName}
        addRoom={this.addRoom}
        removeRoom={this.removeRoom}
        saveHouse={this.saveHouse}
        onKeyPressRoomInput={this.onKeyPressRoomInput}
        wantToDeleteHouse={wantToDeleteHouse}
        deleteHouse={this.deleteHouse}
        confirmDeleteHouse={this.confirmDeleteHouse}
        cancelDeleteHouse={this.cancelDeleteHouse}
        loading={loading}
      />
    );
  }
}

export default EditHouseComponent;
