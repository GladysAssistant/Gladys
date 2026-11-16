import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../utils/consts';
import {
  MobileSectionHeader,
  MobileField,
  fieldClass,
  MobileBottomBar,
  BigButton,
  kitStyle
} from '../../../components/mobile';
import MobileLocationField from '../../../components/house/MobileLocationField';
import RoomSuggestions, { sameName } from '../../../components/house/RoomSuggestions';
import houseStyle from '../../../components/house/mobileHouse.css';

/**
 * @description The house of the onboarding on a phone (docs/specs/mobile-pages/onboarding.md,
 * C.4): its name, where it is and its rooms, built with the pieces of the house settings
 * (components/house). The house and its rooms are created by the same store action as the
 * desktop step (actions/signup/signupConfigureHouse.js).
 */
class MobileConfigureHouse extends Component {
  state = {
    roomError: false,
    errorClosed: false
  };

  closeError = () => this.setState({ errorClosed: true });

  updateNewRoomName = e => {
    this.setState({ roomError: false });
    this.props.updateNewRoomName(e);
  };

  addTypedRoom = () => {
    const name = (this.props.signupNewRoomName || '').trim();
    if (name.length === 0) {
      return;
    }
    if ((this.props.signupRooms || []).some(room => sameName(room, name))) {
      this.setState({ roomError: true });
      return;
    }
    this.props.addRoomNamed(name);
    this.props.updateNewRoomName({ target: { value: '' } });
  };

  onRoomKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.addTypedRoom();
    }
  };

  // a chip is a toggle: nothing is saved before the end of the step
  toggleRoom = (name, selected) => {
    if (!selected) {
      this.props.addRoomNamed(name);
      return;
    }
    const index = (this.props.signupRooms || []).findIndex(room => sameName(room, name));
    if (index >= 0) {
      this.props.removeRoom(index);
    }
  };

  setNameRef = element => {
    this.nameInput = element;
  };

  componentDidUpdate() {
    // a house submitted without a name: its field, a screen above the button, is brought back
    // into view
    const errors = this.props.signupConfigureHouseErrors;
    if (this.submitted && errors && errors.houseName && this.nameInput) {
      this.submitted = false;
      this.nameInput.scrollIntoView({ block: 'center' });
      this.nameInput.focus({ preventScroll: true });
    }
  }

  save = () => {
    this.submitted = true;
    this.setState({ errorClosed: false });
    this.props.saveHouse();
  };

  render(props, { roomError, errorClosed }) {
    // the store keeps the error of the last submission: a name typed since then answers it
    const nameError =
      props.signupConfigureHouseErrors &&
      props.signupConfigureHouseErrors.houseName &&
      (props.signupNewHouseName || '').trim().length === 0;
    const rooms = props.signupRooms || [];
    const saving = props.signupSaveHouse === RequestStatus.Getting;
    const failed = props.signupSaveHouse === RequestStatus.Error && !errorClosed;
    return (
      <div data-cy="signup-house-mobile">
        <h1 class={kitStyle.largeTitle}>
          <Text id="signup.configureHouse.title" />
        </h1>
        <p class={kitStyle.lead}>
          <Text id="signup.configureHouse.description" />
        </p>
        <MobileField
          label={<Text id="signup.configureHouse.houseNameLabel" />}
          htmlFor="houseName"
          error={nameError && <Text id="signup.configureHouse.houseNameError" />}
        >
          <Localizer>
            <input
              id="houseName"
              type="text"
              ref={this.setNameRef}
              class={cx(fieldClass.input, { [fieldClass.invalid]: nameError })}
              value={props.signupNewHouseName}
              onInput={props.updateNewHouseName}
              placeholder={<Text id="signup.configureHouse.houseNamePlaceHolder" />}
              autocomplete="off"
              autocapitalize="sentences"
              enterkeyhint="done"
              maxLength={40}
              aria-invalid={nameError ? 'true' : 'false'}
              data-cy="signup-house-name"
            />
          </Localizer>
        </MobileField>

        <MobileSectionHeader title={<Text id="housesSettings.sections.location" />} />
        <p class={cx(kitStyle.footnote, houseStyle.sectionLead)}>
          <Text id="housesSettings.mobile.locationHelp" />
        </p>
        <MobileLocationField
          latitude={props.signupNewHouseLatitude}
          longitude={props.signupNewHouseLongitude}
          onChange={props.setHouseLocation}
        />

        <MobileSectionHeader title={<Text id="housesSettings.sections.rooms" />} />
        <p class={cx(kitStyle.footnote, houseStyle.sectionLead)}>
          <Text id="signup.mobile.roomsHelp" />
        </p>
        <RoomSuggestions selectedNames={rooms} extraNames={rooms} onToggle={this.toggleRoom} />
        <div class={houseStyle.addRow}>
          <MobileField
            class={houseStyle.addRowField}
            error={roomError && <Text id="housesSettings.mobile.roomNameTaken" />}
          >
            <Localizer>
              <input
                type="text"
                class={cx(fieldClass.input, { [fieldClass.invalid]: roomError })}
                value={props.signupNewRoomName}
                onInput={this.updateNewRoomName}
                onKeyDown={this.onRoomKeyDown}
                placeholder={<Text id="housesSettings.mobile.newRoomPlaceholder" />}
                aria-label={<Text id="housesSettings.mobile.roomNameLabel" />}
                autocomplete="off"
                autocapitalize="sentences"
                enterkeyhint="done"
                maxLength={40}
                data-cy="signup-new-room-name"
              />
            </Localizer>
          </MobileField>
          <BigButton
            class={houseStyle.addRowButton}
            onClick={this.addTypedRoom}
            disabled={(props.signupNewRoomName || '').trim().length === 0}
            data-cy="signup-new-room-add"
          >
            <Text id="signup.configureHouse.addRoomButton" />
          </BigButton>
        </div>

        <MobileBottomBar
          error={failed ? <Text id="signup.mobile.saveHouseError" /> : null}
          onCloseError={this.closeError}
        >
          <BigButton variant="primary" onClick={this.save} loading={saving} data-cy="signup-save-house">
            <Text id="signup.configureHouse.saveHouse" />
          </BigButton>
        </MobileBottomBar>
      </div>
    );
  }
}

export default MobileConfigureHouse;
