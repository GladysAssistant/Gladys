import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';

import style from './style.css';

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
      <div class={style.roomItem}>
        <div class="input-group">
          <input
            type="text"
            class="form-control form-control-sm"
            placeholder={initialName}
            value={room.name}
            onInput={this.editRoomLocal}
          />
          <Localizer>
            <div
              class="input-group-append cursor-pointer"
              onClick={this.removeRoomLocal}
              role="button"
              title={<Text id="housesSettings.removeRoom" />}
              aria-label={<Text id="housesSettings.removeRoom" />}
            >
              <div class="input-group-text">
                <i class="fe fe-x" />
              </div>
            </div>
          </Localizer>
        </div>
      </div>
    );
  }
}

export default EditRoom;
