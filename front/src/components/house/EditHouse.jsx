import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';
import { RequestStatus } from '../../utils/consts';
import Map from './Map';
import EditRoom from './EditRoom';

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
          <Text id="httpErrors.networkError" />
        </div>
      )}
      {props.houseUpdateStatus === RequestStatus.Error && (
        <div class="alert alert-danger">
          <Text id="httpErrors.unknownError" />
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
        {props.houseUpdateStatus === RequestStatus.RoomConflictError && (
          <div class="alert alert-danger">
            <Text id="signup.configureHouse.roomConflictError" />
          </div>
        )}
        {props.houseUpdateStatus === RequestStatus.RoomValidationError && (
          <div class="alert alert-danger">
            <Text id="signup.configureHouse.validationErrorRoom" />
          </div>
        )}
        <div class="row mb-2">
          {props.house.rooms &&
            props.house.rooms.map((room, index) => <EditRoom {...props} room={room} index={index} />)}
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
            />
          </Localizer>
          <span class="input-group-append">
            <button onClick={props.addRoom} class="btn btn-primary" type="button">
              <Text id="signup.configureHouse.addRoomButton" />
            </button>
          </span>
        </div>
        <div class="mt-4">
          <h4>
            <Text id="signup.configureHouse.alarmTitle" />
          </h4>
          <p>
            <Text id="signup.configureHouse.alarmDescription" />
          </p>
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="signup.configureHouse.alarmCodeLabel" />
          </label>
          <div class="input-icon mb-3">
            <Localizer>
              <input
                type={props.showAlarmCode ? 'text' : 'password'}
                placeholder={<Text id="signup.configureHouse.alarmCodePlaceholder" />}
                value={props.house.alarm_code}
                class={cx('form-control', {
                  'is-invalid': get(props, 'errors.alarm_code')
                })}
                onInput={props.updateHouseAlarmCode}
              />
            </Localizer>
            <span class="input-icon-addon cursor-pointer" onClick={props.toggleAlarmCodePassword}>
              <i
                class={cx('fe', {
                  'fe-eye': !props.showAlarmCode,
                  'fe-eye-off': props.showAlarmCode
                })}
              />
            </span>
          </div>
          <div
            class={cx('invalid-feedback', {
              'd-block': get(props, 'errors.alarm_code')
            })}
          >
            <Text id="signup.configureHouse.alarmCodeError" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="signup.configureHouse.alarmDelayBeforeArmingLabel" />
          </label>
          <select
            class="form-control"
            value={props.house.alarm_delay_before_arming}
            onChange={props.updateHouseDelayBeforeArming}
          >
            <option value="0">
              <Text id="signup.configureHouse.alarmDelays.0" />
            </option>
            <option value="5">
              <Text id="signup.configureHouse.alarmDelays.5" />
            </option>
            <option value="10">
              <Text id="signup.configureHouse.alarmDelays.10" />
            </option>
            <option value="15">
              <Text id="signup.configureHouse.alarmDelays.15" />
            </option>
            <option value="30">
              <Text id="signup.configureHouse.alarmDelays.30" />
            </option>
            <option value="60">
              <Text id="signup.configureHouse.alarmDelays.60" />
            </option>
          </select>
          <div class="invalid-feedback">
            <Text id="signup.configureHouse.alarmDelayBeforeArmingError" />
          </div>
        </div>
      </div>
      <div class="form-group">
        <button onClick={props.saveHouse} class="btn btn-success" disabled={Object.keys(props.errors).length > 0}>
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
