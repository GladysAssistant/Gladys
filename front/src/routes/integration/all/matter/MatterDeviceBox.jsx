import { Component } from 'preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';
import { connect } from 'unistore/preact';
import { getMatterDeviceSaveError } from '../../../../utils/formatErrors';
import MatterDeviceSaveErrorAlert, { MatterDeviceSaveErrorContent } from './MatterDeviceSaveErrorAlert';
import style from './style.css';
import { stripDeviceStatesForSave } from '../../../../utils/device';
import { MobileNotice, MobilePill } from '../../../../components/mobile';
import { MobileDeviceItem } from '../../../../components/integration/mobile';

class MatterDeviceBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      device: this.props.device,
      showParams: false
    };
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
      errorDetail: null,
      isKnownError: true,
      errorOrigin: null
    });
    let saved = true;
    try {
      const deviceDidNotExist = this.state.device.id === undefined;
      const savedDevice = await this.props.httpClient.post(
        '/api/v1/device',
        stripDeviceStatesForSave(this.state.device)
      );
      if (deviceDidNotExist) {
        savedDevice.alreadyExist = true;
      }
      this.setState({
        device: savedDevice
      });
    } catch (e) {
      console.error(e);
      this.setState({ ...getMatterDeviceSaveError(e), errorOrigin: 'save' });
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
      this.props.refreshMatterDevices();
    } catch (e) {
      console.error(e);
      deleted = false;
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        this.setState({
          errorMessage: 'integration.matter.error.defaultDeletionError',
          errorOrigin: 'delete'
        });
      }
    }
    this.setState({
      loading: false
    });
    return deleted;
  };

  toggleParams = () => {
    this.setState({
      showParams: !this.state.showParams
    });
  };

  // The device on a phone (docs/specs/mobile-pages/integration-devices.md): a row and its sheet,
  // fed by the state and the handlers of the card below
  renderMobile(
    { editable, deleteButton, housesWithRooms },
    { device, errorMessage, errorDetail, isKnownError, errorOrigin, tooMuchStatesError, statesNumber },
    { validModel, nodeIsDisconnected }
  ) {
    let deleteError = null;
    if (tooMuchStatesError) {
      deleteError = <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />;
    } else if (errorMessage && errorOrigin === 'delete') {
      deleteError = <Text id={errorMessage} />;
    }
    return (
      <MobileDeviceItem
        device={device}
        houses={housesWithRooms}
        pills={
          nodeIsDisconnected ? (
            <MobilePill tone="danger" data-cy="matter-device-disconnected">
              <i class="fe fe-wifi-off" aria-hidden="true" />
              <Text id="integration.matter.device.nodeDisconnected" />
            </MobilePill>
          ) : null
        }
        notices={
          !validModel && (
            <MobileNotice tone="warning" icon="alert-triangle">
              <Text id="integration.matter.noFeaturesHandled" />
            </MobileNotice>
          )
        }
        onNameChange={this.updateName}
        onRoomChange={this.updateRoom}
        namePlaceholderId="integration.matter.namePlaceholder"
        fieldsDisabled={!editable || !validModel}
        showFeatures={validModel}
        details={(device.params || []).map(param => ({
          label: <Text id={`integration.matter.matterParamsNames.${param.name}`}>{param.name}</Text>,
          value: param.value,
          mono: true
        }))}
        detailsFolded
        onSave={device.alreadyExist ? undefined : this.saveDevice}
        saveError={
          errorMessage &&
          errorOrigin === 'save' && (
            <MatterDeviceSaveErrorContent
              errorMessage={errorMessage}
              errorDetail={errorDetail}
              isKnownError={isKnownError !== false}
            />
          )
        }
        onDelete={deleteButton ? this.deleteDevice : undefined}
        deleteError={deleteError}
        deleteScheduled={Boolean(tooMuchStatesError)}
        dataCy="matter-device-row"
      />
    );
  }

  render(
    { deviceIndex, editable, deleteButton, housesWithRooms, nodesIsConnected, isMobile },
    { device, loading, errorMessage, errorDetail, isKnownError, tooMuchStatesError, statesNumber, showParams }
  ) {
    const validModel = device.features && device.features.length > 0;
    const nodeId = device.external_id.split(':')[1];
    const nodeIsDisconnected = nodesIsConnected.get(nodeId) === false;

    if (isMobile) {
      return this.renderMobile(this.props, this.state, { validModel, nodeIsDisconnected });
    }

    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            {device.name}
            {nodeIsDisconnected && (
              <div class="page-options d-flex">
                <div class="tag tag-danger">
                  <Text id="integration.matter.device.nodeDisconnected" />
                  <span class="tag-addon">
                    <i class="fe fe-wifi-off" />
                  </span>
                </div>
              </div>
            )}
          </div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                {errorMessage && (
                  <MatterDeviceSaveErrorAlert
                    errorMessage={errorMessage}
                    errorDetail={errorDetail}
                    isKnownError={isKnownError !== false}
                  />
                )}
                {tooMuchStatesError && (
                  <div class="alert alert-warning">
                    <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.matter.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.matter.namePlaceholder" />}
                      disabled={!editable || !validModel}
                    />
                  </Localizer>
                </div>

                {housesWithRooms && (
                  <div class="form-group">
                    <label class="form-label" for={`room_${deviceIndex}`}>
                      <Text id="integration.matter.roomLabel" />
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

                {device.features && device.features.length > 0 && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.matter.featuresLabel" />
                    </label>
                    <DeviceFeatures features={device.features} />
                  </div>
                )}

                {(!device.features || device.features.length === 0) && (
                  <div class="alert alert-warning">
                    <Text id="integration.matter.noFeaturesHandled" />
                  </div>
                )}

                {device.params && device.params.length > 0 && (
                  <div class="form-group">
                    <button onClick={this.toggleParams} class="btn btn-sm btn-outline-secondary mb-2" type="button">
                      <i class={`fe fe-chevron-${showParams ? 'up' : 'down'} mr-2`} />
                      <Text id="integration.matter.displayDeviceInfo" default="Display device informations" />
                    </button>
                    {showParams && (
                      <div class="table-responsive">
                        <table class="table table-sm table-hover">
                          <thead>
                            <tr>
                              <th>
                                <Text id="integration.matter.paramName" default="Name" />
                              </th>
                              <th>
                                <Text id="integration.matter.paramValue" default="Value" />
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {device.params.map(param => (
                              <tr key={param.name}>
                                <td>
                                  <code>
                                    <Text
                                      id={`integration.matter.matterParamsNames.${param.name}`}
                                      default={param.name}
                                    />
                                  </code>
                                </td>
                                <td class={style.scrollableCell}>
                                  <code>{param.value}</code>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div class="form-group">
                  {device.alreadyExist && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.matter.alreadyCreatedButton" />
                    </button>
                  )}

                  {!device.alreadyExist && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.matter.saveButton" />
                    </button>
                  )}

                  {deleteButton && (
                    <button onClick={this.deleteDevice} class="btn btn-danger">
                      <Text id="integration.matter.deleteButton" />
                    </button>
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

export default connect('httpClient', {})(MatterDeviceBox);
