import { Component } from 'preact';

import EditHouse from './EditHouse';
import { RequestStatus } from '../../utils/consts';

class EditHouseComponent extends Component {
  getErrors = () => {
    const errors = {};
    const name = this.props.house.name;
    if (!name || name.trim().length === 0) {
      errors.houseName = true;
    }
    return errors;
  };
  updateNewRoomName = e => {
    this.setState({
      newRoomName: e.target.value
    });
  };
  updateHouseName = e => {
    this.props.updateHouseName(e.target.value, this.props.houseIndex);
  };
  updateHouseDelayBeforeArming = e => {
    this.props.updateHouseDelayBeforeArming(e.target.value, this.props.houseIndex);
  };
  selectHouseLocation = (latitude, longitude) => {
    this.props.updateHouseLocation(latitude, longitude, this.props.houseIndex);
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
    if (this.unmounted) {
      return;
    }
    this.setState({
      loading: false
    });
  };
  // a short "saved" confirmation next to the button: the panel otherwise
  // gives no sign that anything happened when a save goes through
  showSavedNotice = () => {
    clearTimeout(this.savedNoticeTimer);
    this.setState({ justSaved: true });
    this.savedNoticeTimer = setTimeout(() => {
      if (!this.unmounted) {
        this.setState({ justSaved: false });
      }
    }, 4000);
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
    if (this.unmounted) {
      return;
    }
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
      newRoomName: '',
      justSaved: false
    };
  }

  // the store sets the status of this house to Getting when its save starts,
  // so a Getting -> Success transition is exactly "this save went through"
  componentDidUpdate(prevProps) {
    if (
      prevProps.houseUpdateStatus === RequestStatus.Getting &&
      this.props.houseUpdateStatus === RequestStatus.Success
    ) {
      this.showSavedNotice();
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    clearTimeout(this.savedNoticeTimer);
  }

  render(props, { newRoomName, wantToDeleteHouse, loading, justSaved }) {
    const errors = this.getErrors();
    return (
      <EditHouse
        {...props}
        setMapRef={this.setMapRef}
        updateHouseName={this.updateHouseName}
        updateNewRoomName={this.updateNewRoomName}
        updateHouseDelayBeforeArming={this.updateHouseDelayBeforeArming}
        selectHouseLocation={this.selectHouseLocation}
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
        justSaved={justSaved}
        loading={loading}
        errors={errors}
      />
    );
  }
}

export default EditHouseComponent;
