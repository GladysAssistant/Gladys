import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import style from '../style.css';

const removeRoomLocal = (index, removeRoom) => () => {
  removeRoom(index);
};

const ConfigureHouseTab = ({ children, ...props }) => (
  <div class="row">
    <div class="col-md-8 mx-auto">
      <h2 class={style.signupTitle}>
        <Text id="signup.configureHouse.title" />
      </h2>
      <p>
        <Text id="signup.configureHouse.description" />
      </p>
      <div class="form-group">
        <label class="form-label">
          <Text id="signup.configureHouse.houseNameLabel" />
        </label>
        <Localizer>
          <input
            type="text"
            value={props.signupNewHouseName}
            class={cx('form-control', {
              'is-invalid': props.signupConfigureHouseErrors && props.signupConfigureHouseErrors.houseName
            })}
            onInput={props.updateNewHouseName}
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
        <div id="select-house-location-map" style="width: 100%; height: 300px;" />
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
          {props.signupRooms &&
            props.signupRooms.map((room, index) => (
              <span class="tag">
                {room}
                <a onClick={removeRoomLocal(index, props.removeRoom)} class="tag-addon">
                  <i class="fe fe-x" />
                </a>
              </span>
            ))}
        </div>
        <div class="input-group">
          <Localizer>
            <input
              type="text"
              value={props.signupNewRoomName}
              onKeyPress={props.onKeyPressRoomInput}
              onInput={props.updateNewRoomName}
              class="form-control"
              placeholder={<Text id="signup.configureHouse.roomNamePlaceHolder" />}
            />
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
      </div>
    </div>
  </div>
);

export default ConfigureHouseTab;
