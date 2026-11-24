import { Component } from 'preact';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import { connect } from 'unistore/preact';
import { stripDeviceStatesForSave } from '../../../../utils/device';
import { MobilePill } from '../../../../components/mobile';
import { MobileDeviceItem } from '../../../../components/integration/mobile';
import DeleteDeviceButton from '../../../../components/device/DeleteDeviceButton';

class AirplayDeviceBox extends Component {
  componentWillMount() {
    this.setState({
      device: this.props.device
    });
  }

  componentWillReceiveProps(nextProps) {
    // only when the list brings another version of the device: a parent that merely renders
    // again (the router on a system "back" closing a sheet) must not drop what is being typed
    if (nextProps.device !== this.props.device) {
      this.setState({
        device: nextProps.device
      });
    }
  }

  // from the previous state: two changes in a row (the phone sheet undoing a name and a room)
  // must not overwrite each other
  updateName = e => {
    const name = e.target.value;
    this.setState(prevState => ({
      device: {
        ...prevState.device,
        name
      }
    }));
  };

  updateRoom = e => {
    const roomId = e.target.value;
    this.setState(prevState => ({
      device: {
        ...prevState.device,
        room_id: roomId
      }
    }));
  };

  // resolves to false when the device could not be saved (the phone sheet then stays open)
  saveDevice = async () => {
    this.setState({
      loading: true,
      errorMessage: null,
      errorOrigin: null
    });
    let saved = true;
    try {
      let deviceDidNotExist = this.state.device.id === undefined;
      const savedDevice = await this.props.httpClient.post(
        `/api/v1/device`,
        stripDeviceStatesForSave(this.state.device)
      );
      if (deviceDidNotExist) {
        savedDevice.alreadyExist = true;
      }
      this.setState({
        device: savedDevice
      });
    } catch (e) {
      let errorMessage = 'integration.airplay.error.defaultError';
      if (e.response.status === 409) {
        errorMessage = 'integration.airplay.error.conflictError';
      }
      this.setState({
        errorMessage,
        errorOrigin: 'save'
      });
      saved = false;
    }
    this.setState({
      loading: false
    });
    return saved;
  };

  // resolves to false when the device could not be deleted
  deleteDevice = async () => {
    this.setState({
      loading: true,
      errorMessage: null,
      errorOrigin: null,
      tooMuchStatesError: false,
      statesNumber: undefined
    });
    let deleted = true;
    try {
      if (this.state.device.created_at) {
        await this.props.httpClient.delete(`/api/v1/device/${this.state.device.selector}`);
      }
      this.props.getAirplayDevices();
    } catch (e) {
      deleted = false;
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        this.setState({
          errorMessage: 'integration.airplay.error.defaultDeletionError',
          errorOrigin: 'delete'
        });
      }
    }
    this.setState({
      loading: false
    });
    return deleted;
  };

  // The device on a phone (docs/specs/mobile-pages/integration-devices.md): a row and its sheet,
  // fed by the state and the handlers of the card below. A discovered device (its card has no
  // editable field) is added with the same "Save"; one that is already in Gladys says so.
  renderMobile(
    { editable, deleteButton, housesWithRooms, discovered },
    { device, errorMessage, errorOrigin, tooMuchStatesError, statesNumber },
    validModel
  ) {
    let deleteError = null;
    if (tooMuchStatesError) {
      deleteError = <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />;
    } else if (errorMessage && errorOrigin === 'delete') {
      deleteError = <Text id={errorMessage} />;
    }
    const saveError = errorMessage && errorOrigin === 'save' && <Text id={errorMessage} />;
    if (discovered) {
      return (
        <MobileDeviceItem
          device={device}
          icon="speaker"
          subtitle={null}
          status={
            device.alreadyExist && (
              <MobilePill tone="success">
                <Text id="mobileDeviceList.inGladys" />
              </MobilePill>
            )
          }
          saveError={saveError}
          primaryAction={
            device.alreadyExist
              ? { label: <Text id="integration.airplay.alreadyCreatedButton" />, disabled: true }
              : {
                  label: <Text id="integration.airplay.saveButton" />,
                  onClick: this.saveDevice,
                  toast: <Text id="mobileDeviceList.added" />
                }
          }
          dataCy="airplay-discovered-row"
        />
      );
    }
    return (
      <MobileDeviceItem
        device={device}
        icon="speaker"
        houses={housesWithRooms}
        onNameChange={this.updateName}
        onRoomChange={this.updateRoom}
        namePlaceholderId="integration.airplay.namePlaceholder"
        fieldsDisabled={!editable || !validModel}
        onSave={device.alreadyExist ? undefined : this.saveDevice}
        saveError={saveError}
        onDelete={deleteButton ? this.deleteDevice : undefined}
        deleteError={deleteError}
        deleteScheduled={Boolean(tooMuchStatesError)}
        dataCy="airplay-device-row"
      />
    );
  }

  render(
    { deviceIndex, editable, deleteButton, housesWithRooms, isMobile },
    { device, loading, errorMessage, tooMuchStatesError, statesNumber }
  ) {
    const validModel = device.features && device.features.length > 0;

    if (isMobile) {
      return this.renderMobile(this.props, this.state, validModel);
    }

    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">{device.name}</div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                {errorMessage && (
                  <div class="alert alert-danger">
                    <Text id={errorMessage} />
                  </div>
                )}
                {tooMuchStatesError && (
                  <div class="alert alert-warning">
                    <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.airplay.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.airplay.namePlaceholder" />}
                      disabled={!editable || !validModel}
                    />
                  </Localizer>
                </div>

                {housesWithRooms && (
                  <div class="form-group">
                    <label class="form-label" for={`room_${deviceIndex}`}>
                      <Text id="integration.airplay.roomLabel" />
                    </label>
                    <select
                      id={`room_${deviceIndex}`}
                      onChange={this.updateRoom}
                      class="form-control"
                      disabled={!editable || !validModel}
                    >
                      <option value="">
                        <Text id="global.emptySelectOption" />
                      </option>
                      {housesWithRooms &&
                        housesWithRooms.map(house => (
                          <optgroup label={house.name}>
                            {house.rooms.map(room => (
                              <option selected={room.id === device.room_id} value={room.id}>
                                {room.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                    </select>
                  </div>
                )}

                <div class="form-group">
                  {device.alreadyExist && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.airplay.alreadyCreatedButton" />
                    </button>
                  )}

                  {!device.alreadyExist && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.airplay.saveButton" />
                    </button>
                  )}

                  {deleteButton && (
                    <DeleteDeviceButton device={device} onDelete={this.deleteDevice} class="btn btn-danger">
                      <Text id="integration.airplay.deleteButton" />
                    </DeleteDeviceButton>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(AirplayDeviceBox);
