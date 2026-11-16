import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';

import { RequestStatus } from '../../utils/consts';
import BottomSheet from '../sheet/BottomSheet';
import withIntlAsProp from '../../utils/withIntlAsProp';
import {
  MobileNavBar,
  MobileSectionHeader,
  MobileGroup,
  MobileRow,
  MobileField,
  fieldClass,
  MobileBottomBar,
  BigButton,
  DirtyLabel,
  MobileToast,
  ConfirmSheet,
  kitStyle
} from '../mobile';
import MobileLocationField from './MobileLocationField';
import RoomSuggestions, { sameName } from './RoomSuggestions';
import style from './mobileHouse.css';

const ALARM_DELAYS = ['0', '5', '10', '15', '30', '60'];
const UNDO_DURATION_MS = 5000;

// What a failed save or deletion says, by status of the house (actions/house.js)
const ERROR_TEXT_IDS = {
  [RequestStatus.ValidationError]: 'signup.configureHouse.validationError',
  [RequestStatus.ConflictError]: 'signup.configureHouse.conflictError',
  [RequestStatus.RoomConflictError]: 'signup.configureHouse.roomConflictError',
  [RequestStatus.RoomValidationError]: 'signup.configureHouse.validationErrorRoom',
  [RequestStatus.NetworkError]: 'httpErrors.networkError',
  [RequestStatus.Error]: 'httpErrors.unknownError'
};

/**
 * @description A house being edited, on a phone (docs/specs/mobile-pages/house-and-rooms.md, C):
 * the name, the location, the rooms as rows, the alarm, and the save in the bottom bar. Fed by
 * the same container as the desktop form (EditHouseComponent): the validation, the store actions
 * and the requests are shared.
 */
class MobileEditHouse extends Component {
  state = {
    // the room of the rename sheet: its index stays while the sheet slides out
    roomIndex: null,
    roomOpen: false,
    roomName: '',
    roomError: null,
    addRoomOpen: false,
    newRoomName: '',
    newRoomError: null,
    deleteOpen: false,
    leaveOpen: false,
    errorClosed: false,
    // the room just deleted, for the Undo of the toast
    undo: null,
    undoKey: 0
  };

  componentDidMount() {
    window.addEventListener('beforeunload', this.onBeforeUnload);
  }

  componentDidUpdate(prevProps) {
    const statusChanged = prevProps.houseUpdateStatus !== this.props.houseUpdateStatus;
    // a new attempt shows its error again
    if (statusChanged && this.state.errorClosed) {
      this.resetErrorClosed();
    }
    // "Save and leave": the page is left once the save went through, and kept when it failed
    if (statusChanged && this.leaveAfterSave && this.props.houseUpdateStatus !== RequestStatus.Getting) {
      this.leaveAfterSave = false;
      if (this.props.houseUpdateStatus === RequestStatus.Success) {
        this.props.onClose();
      }
    }
    // the system "back" was pressed with unsaved changes: the page asks the guard
    if (prevProps.leaveRequestKey !== this.props.leaveRequestKey) {
      this.openLeave();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onBeforeUnload);
  }

  // a house that was never saved only exists on this screen: leaving it is losing it
  isUnsaved = () => Boolean(this.props.dirty) || !this.props.house.created_at;

  onBeforeUnload = event => {
    // the user chose to leave without saving: nothing holds the page back
    if (this.isUnsaved() && !this.discarding) {
      event.preventDefault();
      event.returnValue = '';
    }
  };

  // ---------- leaving ----------

  openLeave = () => this.setState({ leaveOpen: true });

  closeLeave = () => {
    this.leaveAfterSave = false;
    this.setState({ leaveOpen: false });
  };

  onBack = () => {
    if (this.isUnsaved()) {
      this.openLeave();
    } else {
      this.props.onClose();
    }
  };

  saveAndLeave = () => {
    this.setState({ leaveOpen: false });
    // a house that cannot be saved stays on screen, its errors next to their fields
    if (Object.keys(this.props.errors).length > 0) {
      return;
    }
    this.leaveAfterSave = true;
    this.props.saveHouse();
  };

  leaveWithoutSaving = () => {
    this.discarding = true;
    this.setState({ leaveOpen: false });
    this.props.onDiscard();
  };

  resetErrorClosed = () => this.setState({ errorClosed: false });
  closeError = () => this.setState({ errorClosed: true });

  visibleRooms = () =>
    (this.props.house.rooms || [])
      .map((room, index) => ({ room, index }))
      .filter(({ room }) => room.to_delete !== true);

  isNameTaken = (name, exceptIndex) =>
    this.visibleRooms().some(({ room, index }) => index !== exceptIndex && sameName(room.name, name));

  // The name of a room is unique in the whole instance, not only in its house (the server
  // refuses the save otherwise): a name another house uses is refused next to the field
  isNameTakenElsewhere = name => (this.props.otherRoomNames || []).some(otherName => sameName(otherName, name));

  // The error of a room name, or null when the name can be used
  getNameError = (name, exceptIndex) => {
    if (this.isNameTaken(name, exceptIndex)) {
      return 'roomNameTaken';
    }
    if (this.isNameTakenElsewhere(name)) {
      return 'roomNameTakenElsewhere';
    }
    return null;
  };

  // ---------- one room ----------

  openRoom = index => () =>
    this.setState({
      roomIndex: index,
      roomOpen: true,
      roomName: this.props.house.rooms[index].name,
      roomError: null
    });

  closeRoom = () => this.setState({ roomOpen: false });

  updateRoomName = e => this.setState({ roomName: e.target.value, roomError: null });

  // the new name is applied when the sheet is validated: an empty or taken name never reaches
  // the house
  validateRoom = () => {
    const { roomIndex, roomName } = this.state;
    const name = roomName.trim();
    const room = this.props.house.rooms[roomIndex];
    if (!room || name === room.name) {
      this.closeRoom();
      return;
    }
    if (name.length === 0) {
      this.setState({ roomError: 'roomNameRequired' });
      return;
    }
    const roomError = this.getNameError(name, roomIndex);
    if (roomError) {
      this.setState({ roomError });
      return;
    }
    this.props.editRoom(roomIndex, 'name', name);
    this.closeRoom();
  };

  onRoomKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.validateRoom();
    }
  };

  deleteRoom = () => {
    const { roomIndex } = this.state;
    const room = this.props.house.rooms[roomIndex];
    if (!room) {
      return;
    }
    this.setState(prevState => ({
      roomOpen: false,
      roomIndex: null,
      undo: { id: room.id, name: room.name },
      undoKey: prevState.undoKey + 1
    }));
    this.props.removeRoom(roomIndex);
  };

  // A deletion is local until the save. A saved room was only flagged: the flag is lifted. A room
  // that was never saved was dropped from the list: it is added again.
  undoDeleteRoom = () => {
    const { undo } = this.state;
    if (!undo) {
      return;
    }
    const index = undo.id ? (this.props.house.rooms || []).findIndex(room => room.id === undo.id) : -1;
    if (index >= 0) {
      this.props.editRoom(index, 'to_delete', false);
    } else {
      this.props.addRoomNamed(undo.name);
    }
  };

  closeUndo = () => this.setState({ undo: null });

  // ---------- adding rooms ----------

  openAddRoom = () => this.setState({ addRoomOpen: true, newRoomName: '', newRoomError: null });
  closeAddRoom = () => this.setState({ addRoomOpen: false });

  updateNewRoomName = e => this.setState({ newRoomName: e.target.value, newRoomError: null });

  addTypedRoom = () => {
    const name = this.state.newRoomName.trim();
    if (name.length === 0) {
      return;
    }
    const newRoomError = this.getNameError(name);
    if (newRoomError) {
      this.setState({ newRoomError });
      return;
    }
    this.props.addRoomNamed(name);
    // the sheet stays open: several rooms are added in a row
    this.setState({ newRoomName: '', newRoomError: null });
  };

  onNewRoomKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.addTypedRoom();
    }
  };

  // a suggestion is a toggle: tapped again, the room it just added goes away
  toggleSuggestion = (name, selected) => {
    if (!selected) {
      this.props.addRoomNamed(name);
      return;
    }
    const entry = this.visibleRooms().find(({ room }) => !room.id && sameName(room.name, name));
    if (entry) {
      this.props.removeRoom(entry.index);
    }
  };

  // ---------- the house ----------

  openDelete = () => this.setState({ deleteOpen: true });
  closeDelete = () => this.setState({ deleteOpen: false });

  confirmDelete = () => {
    this.setState({ deleteOpen: false });
    this.props.confirmDeleteHouse();
  };

  render(
    props,
    {
      roomIndex,
      roomOpen,
      roomName,
      roomError,
      addRoomOpen,
      newRoomName,
      newRoomError,
      deleteOpen,
      leaveOpen,
      errorClosed,
      undo,
      undoKey
    }
  ) {
    const { house, errors, intl } = props;
    const dictionary = intl.dictionary;
    const rooms = this.visibleRooms();
    const saving = props.houseUpdateStatus === RequestStatus.Getting;
    const neverSaved = !house.created_at;
    const dirty = this.isUnsaved();
    const hasErrors = Object.keys(errors).length > 0;
    const errorTextId = ERROR_TEXT_IDS[props.houseUpdateStatus];
    const error = errorTextId && !errorClosed ? <Text id={errorTextId} /> : null;
    const sheetRoom = roomIndex !== null ? house.rooms[roomIndex] : null;
    const savedRoomNames = (house.rooms || []).filter(room => room.id).map(room => room.name);
    const unsavedRoomNames = rooms.filter(({ room }) => !room.id).map(({ room }) => room.name);
    return (
      <div class={kitStyle.page} data-cy="house-edit-mobile">
        <MobileNavBar
          title={house.name || <Text id="housesSettings.defaultNewHouseName" />}
          onBack={this.onBack}
          backLabel={<Text id="housesSettings.title" />}
        />
        <div class={`${kitStyle.content} ${kitStyle.contentWithBottomBar}`}>
          <MobileField
            label={<Text id="signup.configureHouse.houseNameLabel" />}
            htmlFor="houseName"
            error={errors.houseName && <Text id="signup.configureHouse.houseNameError" />}
          >
            <Localizer>
              <input
                id="houseName"
                type="text"
                class={`${fieldClass.input} ${errors.houseName ? fieldClass.invalid : ''}`}
                value={house.name}
                onInput={props.updateHouseName}
                placeholder={<Text id="signup.configureHouse.houseNamePlaceHolder" />}
                autocomplete="off"
                autocapitalize="sentences"
                enterkeyhint="done"
                maxLength={40}
                data-cy="house-name"
              />
            </Localizer>
          </MobileField>

          <MobileSectionHeader title={<Text id="housesSettings.sections.location" />} />
          <p class={`${kitStyle.footnote} ${style.sectionLead}`}>
            <Text id="housesSettings.mobile.locationHelp" />
          </p>
          <MobileLocationField
            latitude={house.latitude}
            longitude={house.longitude}
            onChange={props.selectHouseLocation}
          />

          <MobileSectionHeader
            title={
              <Text
                id={rooms.length > 1 ? 'housesSettings.summary.rooms' : 'housesSettings.sections.rooms'}
                fields={{ count: rooms.length }}
              />
            }
            action={
              <button
                type="button"
                class={`${kitStyle.sectionAction} ${style.sectionAction}`}
                onClick={this.openAddRoom}
                data-cy="house-add-room"
              >
                <Text id="housesSettings.mobile.addRooms" />
              </button>
            }
          />
          {rooms.length > 0 && (
            <MobileGroup>
              {rooms.map(({ room, index }) => (
                <MobileRow
                  key={room.id || `new-${index}`}
                  icon="grid"
                  iconTone="neutral"
                  title={room.name}
                  subtitle={!room.id && <Text id="housesSettings.summary.neverSaved" />}
                  onClick={this.openRoom(index)}
                  dataCy="house-room-row"
                />
              ))}
            </MobileGroup>
          )}
          {rooms.length === 0 && (
            <button
              type="button"
              class={kitStyle.dashedButton}
              onClick={this.openAddRoom}
              data-cy="house-add-first-room"
            >
              <i class="fe fe-plus" aria-hidden="true" />
              <Text id="housesSettings.mobile.addFirstRoom" />
            </button>
          )}
          {rooms.length > 0 && (
            <p class={kitStyle.footnote}>
              <Text id="housesSettings.mobile.roomsHint" />
            </p>
          )}

          <MobileSectionHeader title={<Text id="signup.configureHouse.alarmTitle" />} />
          <MobileField
            label={<Text id="signup.configureHouse.alarmCodeLabel" />}
            htmlFor="houseAlarmCode"
            error={errors.alarm_code && <Text id="signup.configureHouse.alarmCodeError" />}
            help={<Text id="housesSettings.mobile.alarmCodeHelp" />}
          >
            <div class={fieldClass.group}>
              <Localizer>
                <input
                  id="houseAlarmCode"
                  type={props.showAlarmCode ? 'text' : 'password'}
                  class={fieldClass.input}
                  value={house.alarm_code}
                  onInput={props.updateHouseAlarmCode}
                  placeholder={<Text id="housesSettings.mobile.alarmCodePlaceholder" />}
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  autocomplete="off"
                  enterkeyhint="done"
                  data-cy="house-alarm-code"
                />
              </Localizer>
              <Localizer>
                <button
                  type="button"
                  class={fieldClass.addon}
                  onClick={props.toggleAlarmCodePassword}
                  aria-pressed={props.showAlarmCode ? 'true' : 'false'}
                  aria-label={<Text id="housesSettings.toggleAlarmCodeVisibility" />}
                  data-cy="house-alarm-code-reveal"
                >
                  <i class={`fe ${props.showAlarmCode ? 'fe-eye-off' : 'fe-eye'}`} aria-hidden="true" />
                </button>
              </Localizer>
            </div>
          </MobileField>
          <MobileField
            label={<Text id="signup.configureHouse.alarmDelayBeforeArmingLabel" />}
            htmlFor="houseAlarmDelay"
            help={<Text id="housesSettings.mobile.alarmDelayHelp" />}
          >
            <select
              id="houseAlarmDelay"
              class={fieldClass.select}
              value={house.alarm_delay_before_arming}
              onChange={props.updateHouseDelayBeforeArming}
              data-cy="house-alarm-delay"
            >
              {ALARM_DELAYS.map(delay => (
                <option value={delay}>{get(dictionary, `signup.configureHouse.alarmDelays.${delay}`)}</option>
              ))}
            </select>
          </MobileField>

          <div class={style.deleteBlock}>
            <BigButton variant="dangerSoft" icon="trash-2" onClick={this.openDelete} data-cy="house-delete">
              <Text id="signup.configureHouse.deleteHouse" />
            </BigButton>
          </div>
        </div>

        <MobileBottomBar error={error} onCloseError={this.closeError} dataCy="house-edit-bottom-bar">
          {dirty && (
            <DirtyLabel>
              {neverSaved ? <Text id="housesSettings.summary.neverSaved" /> : <Text id="mobileKit.unsavedChanges" />}
            </DirtyLabel>
          )}
          <BigButton
            variant="primary"
            fit={dirty}
            onClick={props.saveHouse}
            disabled={!dirty || hasErrors}
            loading={saving}
            data-cy="house-save"
          >
            <Text id="signup.configureHouse.saveHouse" />
          </BigButton>
        </MobileBottomBar>

        <BottomSheet
          open={roomOpen && Boolean(sheetRoom)}
          title={get(dictionary, 'housesSettings.mobile.roomSheetTitle')}
          onClose={this.closeRoom}
          onOk={this.validateRoom}
          dataCy="house-room-sheet"
        >
          <MobileField
            label={<Text id="housesSettings.mobile.roomNameLabel" />}
            htmlFor="roomName"
            error={roomError && <Text id={`housesSettings.mobile.${roomError}`} />}
          >
            <input
              id="roomName"
              type="text"
              class={`${fieldClass.input} ${roomError ? fieldClass.invalid : ''}`}
              value={roomName}
              onInput={this.updateRoomName}
              onKeyDown={this.onRoomKeyDown}
              autocomplete="off"
              autocapitalize="sentences"
              enterkeyhint="done"
              maxLength={40}
              data-cy="house-room-name"
            />
          </MobileField>
          <BigButton variant="dangerSoft" icon="trash-2" onClick={this.deleteRoom} data-cy="house-room-delete">
            <Text id="housesSettings.mobile.deleteRoom" />
          </BigButton>
          <p class={kitStyle.footnote}>
            <Text id="housesSettings.mobile.deleteRoomHint" />
          </p>
        </BottomSheet>

        <BottomSheet
          open={addRoomOpen}
          title={get(dictionary, 'housesSettings.mobile.addRoomsTitle')}
          onClose={this.closeAddRoom}
          onOk={this.closeAddRoom}
          dataCy="house-add-room-sheet"
        >
          <div class={style.addRow}>
            <MobileField
              class={style.addRowField}
              error={newRoomError && <Text id={`housesSettings.mobile.${newRoomError}`} />}
            >
              <Localizer>
                <input
                  type="text"
                  class={`${fieldClass.input} ${newRoomError ? fieldClass.invalid : ''}`}
                  value={newRoomName}
                  onInput={this.updateNewRoomName}
                  onKeyDown={this.onNewRoomKeyDown}
                  placeholder={<Text id="housesSettings.mobile.newRoomPlaceholder" />}
                  aria-label={<Text id="housesSettings.mobile.roomNameLabel" />}
                  autocomplete="off"
                  autocapitalize="sentences"
                  enterkeyhint="done"
                  maxLength={40}
                  data-cy="house-new-room-name"
                />
              </Localizer>
            </MobileField>
            <BigButton
              variant="primary"
              class={style.addRowButton}
              onClick={this.addTypedRoom}
              disabled={newRoomName.trim().length === 0}
              data-cy="house-new-room-add"
            >
              <Text id="signup.configureHouse.addRoomButton" />
            </BigButton>
          </div>
          <MobileSectionHeader title={<Text id="housesSettings.mobile.roomSuggestionsTitle" />} />
          <RoomSuggestions
            selectedNames={rooms.map(({ room }) => room.name)}
            // a room of another house cannot be suggested: its name is taken
            excludedNames={[...savedRoomNames, ...(props.otherRoomNames || [])]}
            extraNames={unsavedRoomNames}
            onToggle={this.toggleSuggestion}
          />
        </BottomSheet>

        <ConfirmSheet
          open={deleteOpen}
          title={(get(dictionary, 'housesSettings.deleteConfirmTitle') || '').replace('{{name}}', house.name || '')}
          text={<Text id="housesSettings.deleteConfirmDescription" />}
          confirmLabel={<Text id="signup.configureHouse.deleteHouse" />}
          destructive
          onConfirm={this.confirmDelete}
          onCancel={this.closeDelete}
          dataCy="house-delete-confirm"
        />

        <BottomSheet
          open={leaveOpen}
          title={get(dictionary, 'mobileKit.leaveTitle')}
          onClose={this.closeLeave}
          dataCy="house-leave-confirm"
        >
          <p class={kitStyle.sheetText}>
            <Text id="mobileKit.leaveText" />
          </p>
          <div class={kitStyle.buttons}>
            <BigButton variant="primary" onClick={this.saveAndLeave} data-cy="house-leave-save">
              <Text id="mobileKit.saveAndLeave" />
            </BigButton>
            <BigButton variant="dangerSoft" onClick={this.leaveWithoutSaving} data-cy="house-leave-discard">
              <Text id="mobileKit.leaveWithoutSaving" />
            </BigButton>
            <BigButton variant="ghost" onClick={this.closeLeave} data-cy="house-leave-keep-editing">
              <Text id="mobileKit.keepEditing" />
            </BigButton>
          </div>
        </BottomSheet>

        <MobileToast
          message={
            undo ? (get(dictionary, 'housesSettings.mobile.roomDeleted') || '').replace('{{name}}', undo.name) : null
          }
          toastKey={undoKey}
          duration={UNDO_DURATION_MS}
          actionLabel={get(dictionary, 'mobileKit.undo')}
          onAction={this.undoDeleteRoom}
          onClose={this.closeUndo}
          aboveBar
          dataCy="house-room-deleted-toast"
        />
      </div>
    );
  }
}

export default withIntlAsProp(MobileEditHouse);
