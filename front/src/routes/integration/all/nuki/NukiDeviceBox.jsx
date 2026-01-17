import { Component } from 'preact';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';
import { connect } from 'unistore/preact';

class NukiDeviceBox extends Component {
  componentWillMount() {
    this.setState({
      device: this.props.device
    });
  }

  updateName = e => {
    this.setState({
      device: {
        ...this.state.device,
        name: e.target.value
      }
    });
  };

  updateRoom = e => {
    this.setState({
      device: {
        ...this.state.device,
        room_id: e.target.value
      }
    });
  };

  saveDevice = async () => {
    this.setState({
      loading: true,
      errorMessage: null
    });
    try {
      const deviceDidNotExist = this.state.device.id === undefined;
      const savedDevice = await this.props.httpClient.post(`/api/v1/device`, this.state.device);
      if (deviceDidNotExist) {
        savedDevice.alreadyExist = true;
      }
      this.setState({
        device: savedDevice
      });
    } catch (e) {
      let errorMessage = 'integration.nuki.error.defaultError';
      if (e.response.status === 409) {
        errorMessage = 'integration.nuki.error.conflictError';
      }
      this.setState({
        errorMessage
      });
    }
    this.setState({
      loading: false
    });
  };

  deleteDevice = async () => {
    this.setState({
      loading: true,
      errorMessage: null,
      tooMuchStatesError: false,
      statesNumber: undefined
    });
    try {
      if (this.state.device.created_at) {
        await this.props.httpClient.delete(`/api/v1/device/${this.state.device.selector}`);
      }
      this.props.getNukiDevices();
    } catch (e) {
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        this.setState({
          errorMessage: 'integration.nuki.error.defaultDeletionError'
        });
      }
    }
    this.setState({
      loading: false
    });
  };

  render(
    { deviceIndex, editable, alreadyCreatedButton, deleteButton, housesWithRooms },
    { device, loading, errorMessage, tooMuchStatesError, statesNumber }
  ) {
    const validModel = device.features && device.features.length > 0;
    // default value is 'mqtt'
    const deviceProtocol = ((device.params || []).find(p => p.name === 'protocol') || { value: 'mqtt' }).value;

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
                    <Text id="integration.nuki.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.nuki.namePlaceholder" />}
                      disabled={!editable || !validModel}
                    />
                  </Localizer>
                </div>

                {housesWithRooms && (
                  <div class="form-group">
                    <label class="form-label" for={`room_${deviceIndex}`}>
                      <Text id="integration.nuki.roomLabel" />
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
                  <label class="form-label" for={`topic_${deviceIndex}`}>
                    <Text id={`integration.nuki.protocolLabels.${deviceProtocol}`} />
                  </label>
                  <input
                    id={`topic_${deviceIndex}`}
                    type="text"
                    value={device.external_id.substring(8)}
                    class="form-control"
                    disabled="true"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.nuki.device.protocolLabel" />
                  </label>

                  <div class="form-check form-check-inline">
                    <label class="custom-control custom-radio">
                      <input
                        type="radio"
                        class="custom-control-input"
                        name={`device-protocol-${deviceIndex}`}
                        value="mqtt"
                        checked={deviceProtocol === 'mqtt'}
                        disabled
                      />
                      <div class="custom-control-label">
                        <Text id="integration.nuki.device.protocolMQTT" />
                      </div>
                    </label>
                  </div>

                  <div class="form-check form-check-inline">
                    <label class="custom-control custom-radio">
                      <input
                        type="radio"
                        class="custom-control-input"
                        name={`device-protocol-${deviceIndex}`}
                        value="http"
                        checked={deviceProtocol === 'http'}
                        disabled
                      />
                      <div class="custom-control-label">
                        <Text id="integration.nuki.device.protocolHTTP" />
                      </div>
                    </label>
                  </div>
                </div>

                {device.features && device.features.length > 0 && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.nuki.device.featuresLabel" />
                    </label>
                    <DeviceFeatures features={device.features} />
                  </div>
                )}

                <div class="form-group">
                  {(alreadyCreatedButton || device.alreadyExist) && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.nuki.alreadyCreatedButton" />
                    </button>
                  )}

                  {!device.alreadyExist && editable && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.nuki.saveButton" />
                    </button>
                  )}

                  {validModel && deleteButton && (
                    <button onClick={this.deleteDevice} class="btn btn-danger">
                      <Text id="integration.nuki.deleteButton" />
                    </button>
                  )}

                  {!validModel && (
                    <button class="btn btn-dark" disabled>
                      <Text id="integration.nuki.unmanagedModelButton" />
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

export default connect('httpClient', {})(NukiDeviceBox);
