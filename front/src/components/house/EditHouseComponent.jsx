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
  updateHouseAlarmCode = e => {
    this.props.updateHouseAlarmCode(e.target.value, this.props.houseIndex);
  };
  updateHouseDelayBeforeArming = e => {
    this.props.updateHouseDelayBeforeArming(e.target.value, this.props.houseIndex);
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
  editRoom = (roomIndex, property, value) => {
    this.props.editRoom(this.props.houseIndex, roomIndex, property, value);
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
  toggleAlarmCodePassword = () => {
    this.setState(prevState => {
      return { ...prevState, showAlarmCode: !this.state.showAlarmCode };
    });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      newRoomName: '',
      showAlarmCode: false
    };
  }

  render(props, { newRoomName, wantToDeleteHouse, loading, showAlarmCode }) {
    return (
      <EditHouse
        {...props}
        setMapRef={this.setMapRef}
        updateHouseName={this.updateHouseName}
        updateNewRoomName={this.updateNewRoomName}
        updateHouseAlarmCode={this.updateHouseAlarmCode}
        updateHouseDelayBeforeArming={this.updateHouseDelayBeforeArming}
        newRoomName={newRoomName}
        addRoom={this.addRoom}
        removeRoom={this.removeRoom}
        editRoom={this.editRoom}
        saveHouse={this.saveHouse}
        onKeyPressRoomInput={this.onKeyPressRoomInput}
        wantToDeleteHouse={wantToDeleteHouse}
        deleteHouse={this.deleteHouse}
        confirmDeleteHouse={this.confirmDeleteHouse}
        cancelDeleteHouse={this.cancelDeleteHouse}
        toggleAlarmCodePassword={this.toggleAlarmCodePassword}
        showAlarmCode={showAlarmCode}
        loading={loading}
      />
    );
  }
}

export default EditHouseComponent;
