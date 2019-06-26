import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';
import { RequestStatus } from '../../utils/consts';
import Map from './Map';

const removeRoomLocal = (index, removeRoom) => () => {
  removeRoom(index);
};

const EditHouse = ({ children, ...props }) => (
  <div
    class={cx('dimmer', {
      active: props.loading
    })}
  >
    <div class="loader" />
    <div class="dimmer-content">
      {props.houseUpdateStatus === RequestStatus.ValidationError && (
        <div class="alert alert-danger">
          <Text id="signup.configureHouse.validationError" />
        </div>
      )}
      {props.houseUpdateStatus === RequestStatus.ConflictError && (
        <div class="alert alert-danger">
          <Text id="signup.configureHouse.conflictError" />
        </div>
      )}
      {props.houseUpdateStatus === RequestStatus.NetworkError && (
        <div class="alert alert-danger">
          <Text id="signup.httpErrors.networkError" />
        </div>
      )}
      {props.houseUpdateStatus === RequestStatus.Error && (
        <div class="alert alert-danger">
          <Text id="signup.httpErrors.unknownError" />
        </div>
      )}
      <div class="form-group">
        <label class="form-label">
          <Text id="signup.configureHouse.houseNameLabel" />
        </label>
        <Localizer>
          <input
            type="text"
            value={props.house.name}
            class={cx('form-control', {
              'is-invalid': get(props, 'errors.houseName')
            })}
            onInput={props.updateHouseName}
            placeholder={<Text id="signup.configureHouse.houseNamePlaceHolder" />}
          />
        </Localizer>
        <div class="invalid-feedback">
          <Text id="signup.configureHouse.houseNameError" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">
          <Text id="signup.configureHouse.houseLocationLabel" />
        </label>
        <Map house={props.house} houseIndex={props.houseIndex} updateHouseLocation={props.updateHouseLocation} />
      </div>
      <div class="form-group">
        <label class="form-label">
          <Text id="signup.configureHouse.roomsLabel" />
        </label>
        <div
          class="tags"
          style={{
            marginBottom: '10px'
          }}
        >
          {props.house.rooms &&
            props.house.rooms.map((room, index) => {
              if (room.to_delete === true) {
                return null;
              }
              return (
                <span class="tag">
                  {room.name}
                  <a onClick={removeRoomLocal(index, props.removeRoom)} class="tag-addon">
                    <i class="fe fe-x" />
                  </a>
                </span>
              );
            })}
        </div>
        <div class="input-group">
          <Localizer>
            <input
              type="text"
              value={props.newRoomName}
              onKeyPress={props.onKeyPressRoomInput}
              onInput={props.updateNewRoomName}
              class="form-control"
              placeholder={<Text id="signup.configureHouse.roomNamePlaceHolder" />}
            />{' '}
          </Localizer>
          <span class="input-group-append">
            <button onClick={props.addRoom} class="btn btn-primary" type="button">
              <Text id="signup.configureHouse.addRoomButton" />
            </button>
          </span>
        </div>
      </div>

      <div class="form-group">
        <button onClick={props.saveHouse} class="btn btn-success">
          <Text id="signup.configureHouse.saveHouse" />
        </button>
        {!props.wantToDeleteHouse && (
          <button onClick={props.deleteHouse} class="btn btn-danger ml-4">
            <Text id="signup.configureHouse.deleteHouse" />
          </button>
        )}
        {props.wantToDeleteHouse && (
          <span class="ml-4">
            <button onClick={props.confirmDeleteHouse} class="btn btn-danger">
              <Text id="signup.configureHouse.confirmDeleteHouse" />
            </button>
            <button onClick={props.cancelDeleteHouse} class="btn btn-primary ml-4">
              <Text id="signup.configureHouse.cancelDeleteHouse" />
            </button>
          </span>
        )}
      </div>
    </div>
  </div>
);

export default EditHouse;
