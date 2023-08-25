import { Component } from 'preact';

class EditRoom extends Component {
  removeRoomLocal = () => {
    this.props.removeRoom(this.props.index);
  };

  editRoomLocal = e => {
    e.preventDefault();

    this.props.editRoom(this.props.index, 'name', e.target.value);
  };

  constructor(props) {
    super(props);
    this.state = { initialName: this.props.room.name };
  }

  render({ room }, { initialName }) {
    if (room.to_delete === true) {
      return null;
    }

    return (
      <div class="col-md-3 mb-2">
        <div class="input-group ">
          <input
            type="text"
            class="form-control form-control-sm"
            placeholder={initialName}
            value={room.name}
            onInput={this.editRoomLocal}
          />
          <div class="input-group-append cursor-pointer" onClick={this.removeRoomLocal}>
            <div class="input-group-text">
              <i class="fe fe-x" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default EditRoom;
