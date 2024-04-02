import { Component } from 'preact';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';
import { PARAMS } from '../../../../../../server/services/zwavejs-ui/lib/constants';

import { connect } from 'unistore/preact';

class ZwaveJSUIDeviceBox extends Component {
  componentWillMount() {
    this.setState({
      device: this.props.device
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      device: nextProps.device
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
      let deviceDidNotExist = this.state.device.id === undefined;
      const savedDevice = await this.props.httpClient.post(`/api/v1/device`, this.state.device);
      if (deviceDidNotExist) {
        savedDevice.alreadyExist = true;
      }
      this.setState({
        device: savedDevice
      });
    } catch (e) {
      let errorMessage = 'integration.zwavejs-ui.error.defaultError';
      if (e.response.status === 409) {
        errorMessage = 'integration.zwavejs-ui.error.conflictError';
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
      this.props.getZwaveJSUIDevices();
    } catch (e) {
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        this.setState({
          errorMessage: 'integration.zwavejs-ui.error.defaultDeletionError'
        });
      }
    }
    this.setState({
      loading: false
    });
  };

  getDeviceProperty = () => {
    const device = this.state.device;
    if (!device.features) {
      return null;
    }

    let locationZwaveUi = null;
    const locationZwaveUiParam = device.params.find(param => param.name === PARAMS.LOCATION);
    if (locationZwaveUiParam) {
      locationZwaveUi = locationZwaveUiParam.value;
    }

    return { locationZwaveUi };
  };

  render(
    { deviceIndex, editable, deleteButton, housesWithRooms },
    { device, loading, errorMessage, tooMuchStatesError, statesNumber }
  ) {
    const validModel = device.features && device.features.length > 0;
    const { locationZwaveUi } = this.getDeviceProperty();

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
                    <Text id="integration.zwavejs-ui.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.zwavejs-ui.namePlaceholder" />}
                      disabled={!editable || !validModel}
                    />
                  </Localizer>
                </div>

                {locationZwaveUi && (
                  <div class="form-group">
                    <label class="form-label" for={`location_${deviceIndex}`}>
                      <Text id="integration.zwavejs-ui.locationLabel" />
                    </label>
                    <input
                      id={`location_${deviceIndex}`}
                      type="text"
                      value={locationZwaveUi}
                      class="form-control"
                      disabled="true"
                    />
                  </div>
                )}

                {housesWithRooms && (
                  <div class="form-group">
                    <label class="form-label" for={`room_${deviceIndex}`}>
                      <Text id="integration.zwavejs-ui.roomLabel" />
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

                {device.features.length > 0 && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.zwavejs-ui.featuresLabel" />
                    </label>
                    <DeviceFeatures features={device.features} />
                  </div>
                )}

                {device.features.length === 0 && (
                  <div class="alert alert-warning">
                    <Text id="integration.zwavejs-ui.noFeaturesHandled" />
                  </div>
                )}

                <div class="form-group">
                  {device.alreadyExist && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.zwavejs-ui.alreadyCreatedButton" />
                    </button>
                  )}

                  {!device.alreadyExist && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.zwavejs-ui.saveButton" />
                    </button>
                  )}

                  {deleteButton && (
                    <button onClick={this.deleteDevice} class="btn btn-danger">
                      <Text id="integration.zwavejs-ui.deleteButton" />
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

export default connect('httpClient', {})(ZwaveJSUIDeviceBox);
