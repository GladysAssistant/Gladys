import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';
import { connect } from 'unistore/preact';
import style from './style.css';

class MatterDeviceBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      device: this.props.device,
      showParams: false
    };
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
      const deviceDidNotExist = this.state.device.id === undefined;
      const savedDevice = await this.props.httpClient.post('/api/v1/device', this.state.device);
      if (deviceDidNotExist) {
        savedDevice.alreadyExist = true;
      }
      this.setState({
        device: savedDevice
      });
    } catch (e) {
      let errorMessage = 'integration.matter.error.defaultError';
      if (e.response.status === 409) {
        errorMessage = 'integration.matter.error.conflictError';
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
      this.props.refreshMatterDevices();
    } catch (e) {
      console.error(e);
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        this.setState({
          errorMessage: 'integration.matter.error.defaultDeletionError'
        });
      }
    }
    this.setState({
      loading: false
    });
  };

  toggleParams = () => {
    this.setState({
      showParams: !this.state.showParams
    });
  };

  render(
    { deviceIndex, editable, deleteButton, housesWithRooms, nodesIsConnected },
    { device, loading, errorMessage, tooMuchStatesError, statesNumber, showParams }
  ) {
    const validModel = device.features && device.features.length > 0;
    const nodeId = device.external_id.split(':')[1];
    const nodeIsDisconnected = nodesIsConnected.get(nodeId) === false;

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
                  <div class="alert alert-danger">
                    <Text id={errorMessage} />
                  </div>
                )}
                {tooMuchStatesError && (
                  <div class="alert alert-warning">
                    <Text id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
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
