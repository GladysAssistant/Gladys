import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';
import { RequestStatus } from '../../utils/consts';
import Map from './Map';
import AddressSearch from './AddressSearch';
import EditRoom from './EditRoom';
import style from './style.css';

const EditHouse = ({ children, ...props }) => {
  const rooms = (props.house.rooms || []).filter(room => room.to_delete !== true);

  return (
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

        <div class={cx(style.section, style.sectionFirst)}>
          <h4 class={style.sectionTitle}>
            <Text id="housesSettings.sections.identity" />
          </h4>
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
        </div>

        <div class={style.section}>
          <h4 class={style.sectionTitle}>
            <Text id="housesSettings.sections.location" />
          </h4>
          <p class={style.sectionHelp}>
            <Text id="signup.configureHouse.houseLocationLabel" />
          </p>
          <AddressSearch onSelectLocation={props.selectHouseLocation} />
          <div class={style.mapWrapper}>
            <Map house={props.house} houseIndex={props.houseIndex} updateHouseLocation={props.updateHouseLocation} />
          </div>
        </div>

        <div class={style.section}>
          <h4 class={style.sectionTitle}>
            <Text id="housesSettings.sections.rooms" />
          </h4>
          <p class={style.sectionHelp}>
            <Text id="signup.configureHouse.roomsLabel" />
          </p>
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
          {rooms.length === 0 && (
            <p class={style.noRoomYet}>
              <Text id="housesSettings.sections.noRoomYet" />
            </p>
          )}
          {rooms.length > 0 && (
            <div class={style.roomsGrid}>
              {props.house.rooms.map((room, index) => (
                <EditRoom {...props} key={room.id || `new-room-${index}`} room={room} index={index} />
              ))}
            </div>
          )}
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
              <button onClick={props.addRoom} class="btn btn-secondary" type="button">
                <Text id="signup.configureHouse.addRoomButton" />
              </button>
            </span>
          </div>
        </div>

        <div class={style.section}>
          <h4 class={style.sectionTitle}>
            <Text id="signup.configureHouse.alarmTitle" />
          </h4>
          <p class={style.sectionHelp}>
            <Text id="signup.configureHouse.alarmDescription" />
          </p>
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
          <div class="form-group mb-0">
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

        {!props.wantToDeleteHouse && (
          <div class={style.footer}>
            <div class={style.footerMain}>
              <button onClick={props.saveHouse} class="btn btn-primary" disabled={Object.keys(props.errors).length > 0}>
                <Text id="signup.configureHouse.saveHouse" />
              </button>
              {props.justSaved && (
                <span class={style.savedNotice}>
                  <i class="fe fe-check" />
                  <Text id="housesSettings.saved" />
                </span>
              )}
            </div>
            <button onClick={props.deleteHouse} class="btn btn-outline-danger">
              <i class="fe fe-trash-2 mr-2" />
              <Text id="signup.configureHouse.deleteHouse" />
            </button>
          </div>
        )}
        {props.wantToDeleteHouse && (
          <div class={cx('alert alert-warning mt-4', style.deleteConfirm)}>
            <div>
              <strong>
                <Text id="housesSettings.deleteConfirmTitle" fields={{ name: props.house.name }} />
              </strong>
              <div>
                <Text id="housesSettings.deleteConfirmDescription" />
              </div>
            </div>
            <div class={style.footerMain}>
              <button onClick={props.confirmDeleteHouse} class="btn btn-danger">
                <Text id="signup.configureHouse.confirmDeleteHouse" />
              </button>
              <button onClick={props.cancelDeleteHouse} class="btn btn-secondary">
                <Text id="signup.configureHouse.cancelDeleteHouse" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditHouse;
