import { Component } from 'preact';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import { Link } from 'preact-router';
import get from 'get-value';

import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';

class TasmotaDeviceBox extends Component {
  updateName = e => {
    this.props.updateDeviceField(this.props.listName, this.props.deviceIndex, 'name', e.target.value);

    this.setState({
      loading: false
    });
  };

  updateRoom = e => {
    this.props.updateDeviceField(this.props.listName, this.props.deviceIndex, 'room_id', e.target.value);

    this.setState({
      loading: false
    });
  };

  saveDevice = async () => {
    this.setState({
      loading: true,
      errorMessage: null
    });
    try {
      await this.props.saveDevice(this.props.listName, this.props.deviceIndex);
    } catch (e) {
      let errorMessage = 'integration.tasmota.error.defaultError';
      if (e.response.status === 409) {
        errorMessage = 'integration.tasmota.error.conflictError';
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
      await this.props.deleteDevice(this.props.deviceIndex);
    } catch (e) {
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        this.setState({
          errorMessage: 'integration.tasmota.error.defaultDeletionError'
        });
      }
    }
    this.setState({
      loading: false
    });
  };

  updateUsername = e => {
    e.preventDefault();

    this.setState({ username: e.target.value });
  };

  updatePassword = e => {
    e.preventDefault();

    this.setState({ password: e.target.value });
  };

  connectAndScan = async () => {
    this.setState({
      loading: true,
      authErrorMessage: null
    });
    try {
      const { device, httpClient } = this.props;
      const { username, password } = this.state;
      const options = {
        singleAddress: device.external_id.replace('tasmota:', ''),
        username,
        password
      };
      await httpClient.post('/api/v1/service/tasmota/discover/http', options);
    } catch (e) {
      console.error(e);
      this.setState({
        authErrorMessage: 'integration.tasmota.discover.http.authError'
      });
    }
    this.setState({
      loading: false
    });
  };

  render(
    { deviceIndex, device, housesWithRooms, editable, ...props },
    { loading, errorMessage, authErrorMessage, tooMuchStatesError, statesNumber }
  ) {
    const validModel = device.features.length > 0 || device.needAuthentication;
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
              {device.needAuthentication && (
                <div class="card-body position-absolute w-100 h-100">
                  <div class="alert alert-info">
                    <Text id="integration.tasmota.discover.http.needAuthenticationAlert" />
                  </div>

                  {authErrorMessage && (
                    <div class="alert alert-danger">
                      <Text id={authErrorMessage} />
                    </div>
                  )}

                  <div class="form-group">
                    <label class="form-label" for={`username_${deviceIndex}`}>
                      <Text id="integration.tasmota.discover.http.usernameLabel" />
                    </label>
                    <Localizer>
                      <input
                        id={`username_${deviceIndex}`}
                        type="text"
                        class="form-control"
                        autocomplete="off"
                        onInput={this.updateUsername}
                        placeholder={<Text id="integration.tasmota.discover.http.usernameLabel" />}
                      />
                    </Localizer>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for={`password_${deviceIndex}`}>
                      <Text id="integration.tasmota.discover.http.passwordLabel" />
                    </label>
                    <Localizer>
                      <input
                        id={`password_${deviceIndex}`}
                        autocomplete="off"
                        type="password"
                        class="form-control"
                        onInput={this.updatePassword}
                        placeholder={<Text id="integration.tasmota.discover.http.passwordLabel" />}
                      />
                    </Localizer>
                  </div>
                  <div class="text-center">
                    <button class="btn btn-primary mx-auto" onClick={this.connectAndScan}>
                      <Text id="integration.tasmota.discover.http.authenticateButton" />
                    </button>
                  </div>
                </div>
              )}

              <div
                class={cx('card-body', {
                  invisible: device.needAuthentication
                })}
              >
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
                    <Text id="integration.tasmota.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.tasmota.namePlaceholder" />}
                      disabled={!editable || !validModel}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`room_${deviceIndex}`}>
                    <Text id="integration.tasmota.roomLabel" />
                  </label>
                  <select
                    onChange={this.updateRoom}
                    class="form-control"
                    id={`room_${deviceIndex}`}
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

                <div class="form-group">
                  <label class="form-label" for={`topic_${deviceIndex}`}>
                    <Text id={`integration.tasmota.protocolLabels.${deviceProtocol}`} />
                  </label>
                  <input
                    id={`topic_${deviceIndex}`}
                    type="text"
                    value={device.external_id.substring(8)}
                    class="form-control"
                    disabled="true"
                  />
                </div>

                {props.editButton && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.tasmota.device.protocolLabel" />
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
                          <Text id="integration.tasmota.device.protocolMQTT" />
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
                          <Text id="integration.tasmota.device.protocolHTTP" />
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {device.features && device.features.length > 0 && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.tasmota.device.featuresLabel" />
                    </label>
                    <DeviceFeatures features={device.features} />
                  </div>
                )}

                <div class="form-group">
                  {validModel && props.alreadyCreatedButton && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.tasmota.alreadyCreatedButton" />
                    </button>
                  )}

                  {validModel && props.updateButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.tasmota.updateButton" />
                    </button>
                  )}

                  {validModel && props.saveButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.tasmota.saveButton" />
                    </button>
                  )}

                  {validModel && props.deleteButton && (
                    <button onClick={this.deleteDevice} class="btn btn-danger">
                      <Text id="integration.tasmota.deleteButton" />
                    </button>
                  )}

                  {!validModel && (
                    <button class="btn btn-dark" disabled>
                      <Text id="integration.tasmota.unmanagedModelButton" />
                    </button>
                  )}

                  {validModel && props.editButton && (
                    <Link href={`/dashboard/integration/device/tasmota/edit/${device.selector}`}>
                      <button class="btn btn-secondary float-right">
                        <Text id="integration.tasmota.device.editButton" />
                      </button>
                    </Link>
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

export default TasmotaDeviceBox;
