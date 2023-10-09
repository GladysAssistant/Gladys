import { Component } from 'preact';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import { Link } from 'preact-router';
import get from 'get-value';
import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';
import { connect } from 'unistore/preact';

class MELCloudDeviceBox extends Component {
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
      const savedDevice = await this.props.httpClient.post(`/api/v1/device`, this.state.device);
      this.setState({
        device: savedDevice
      });
    } catch (e) {
      let errorMessage = 'integration.melcloud.error.defaultError';
      if (e.response.status === 409) {
        errorMessage = 'integration.melcloud.error.conflictError';
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
      this.props.getDevices();
    } catch (e) {
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        this.setState({
          errorMessage: 'integration.melcloud.error.defaultDeletionError'
        });
      }
    }
    this.setState({
      loading: false
    });
  };

  render(
    {
      deviceIndex,
      editable,
      editButton,
      deleteButton,
      saveButton,
      updateButton,
      alreadyCreatedButton,
      housesWithRooms
    },
    { device, loading, errorMessage, tooMuchStatesError, statesNumber }
  ) {
    const validModel = device.features && device.features.length > 0;
    const online = device.online;

    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <Localizer>
              <div title={<Text id={`integration.melcloud.status.${online ? 'online' : 'offline'}`} />}>
                <i class={`fe fe-radio text-${online ? 'success' : 'danger'}`} />
                &nbsp;{device.name}
              </div>
            </Localizer>
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
                    <Text id="integration.melcloud.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.melcloud.namePlaceholder" />}
                      disabled={!editable || !validModel}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`model_${deviceIndex}`}>
                    <Text id="integration.melcloud.modelLabel" />
                  </label>
                  <input
                    id={`model_${deviceIndex}`}
                    type="text"
                    value={device.model}
                    class="form-control"
                    disabled="true"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for={`room_${deviceIndex}`}>
                    <Text id="integration.melcloud.roomLabel" />
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

                {validModel && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.melcloud.device.featuresLabel" />
                    </label>
                    <DeviceFeatures features={device.features} />
                  </div>
                )}

                <div class="form-group">
                  {validModel && alreadyCreatedButton && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.melcloud.alreadyCreatedButton" />
                    </button>
                  )}

                  {validModel && updateButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.melcloud.updateButton" />
                    </button>
                  )}

                  {validModel && saveButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.melcloud.saveButton" />
                    </button>
                  )}

                  {validModel && deleteButton && (
                    <button onClick={this.deleteDevice} class="btn btn-danger">
                      <Text id="integration.melcloud.deleteButton" />
                    </button>
                  )}

                  {!validModel && (
                    <button class="btn btn-dark" disabled>
                      <Text id="integration.melcloud.unmanagedModelButton" />
                    </button>
                  )}

                  {validModel && editButton && (
                    <Link href={`/dashboard/integration/device/melcloud/edit/${device.selector}`}>
                      <button class="btn btn-secondary float-right">
                        <Text id="integration.melcloud.device.editButton" />
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

export default connect('httpClient', {})(MELCloudDeviceBox);
