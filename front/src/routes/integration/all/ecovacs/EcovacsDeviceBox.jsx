import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { Link } from 'preact-router';
import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';

class EcovacsDeviceBox extends Component {
  componentWillMount() {
    this.props.getEcovacsDeviceStatus(this.props.device);
  }

  updateName = e => {
    this.props.updateDeviceField(this.props.listName, this.props.deviceIndex, 'name', e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceField(this.props.listName, this.props.deviceIndex, 'room_id', e.target.value);
  };

  saveDevice = async () => {
    this.setState({
      loading: true,
      errorMessage: null
    });
    try {
      await this.props.saveDevice(this.props.device, this.props.deviceIndex);
    } catch (e) {
      let errorMessage = 'integration.ecovacs.error.defaultError';
      if (e.response.status === 409) {
        errorMessage = 'integration.ecovacs.error.conflictError';
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
      errorMessage: null
    });
    try {
      await this.props.deleteDevice(this.props.deviceIndex);
    } catch (e) {
      this.setState({
        errorMessage: 'integration.ecovacs.error.defaultDeletionError'
      });
    }
    this.setState({
      loading: false
    });
  };

  render({ deviceIndex, device, houses, editable, ...props }, { loading, errorMessage }) {
    const online = true;

    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <Localizer>
              <div title={<Text id={`integration.ecovacs.status.${online ? 'online' : 'offline'}`} />}>
                <i class={`fe fe-radio text-${online ? 'success' : 'danger'}`} />
                &nbsp;{device.name}
              </div>
            </Localizer>
          </div>
          <div class={cx('dimmer', { active: loading })}>
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                {errorMessage && (
                  <div class="alert alert-danger">
                    <Text id={errorMessage} />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.ecovacs.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.ecovacs.namePlaceholder" />}
                      disabled={!editable}
                    />
                  </Localizer>
                  {props.status && (
                    <div>
                      <img src={props.status.imageUrl} alt={props.status.model} />
                    </div>
                  )}
                </div>

                <div class="form-group">
                  <label class="form-label" for={`room_${deviceIndex}`}>
                    <Text id="integration.ecovacs.roomLabel" />
                  </label>
                  <select
                    id={`room_${deviceIndex}`}
                    onChange={this.updateRoom}
                    class="form-control"
                    disabled={!editable}
                  >
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {houses &&
                      houses.map(house => (
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
                  <label class="form-label">
                    <Text id="integration.ecovacs.device.featuresLabel" />
                  </label>
                  <DeviceFeatures features={device.features} />
                </div>

                <div class="form-group">
                  {props.alreadyCreatedButton && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.ecovacs.alreadyCreatedButton" />
                    </button>
                  )}

                  {props.updateButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.ecovacs.updateButton" />
                    </button>
                  )}

                  {props.saveButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.ecovacs.saveButton" />
                    </button>
                  )}

                  {props.deleteButton && (
                    <button onClick={this.deleteDevice} class="btn btn-danger">
                      <Text id="integration.ecovacs.deleteButton" />
                    </button>
                  )}

                  {props.editButton && (
                    <Link href={`/dashboard/integration/device/ecovacs/edit/${device.selector}`}>
                      <button class="btn btn-secondary float-right">
                        <Text id="integration.ecovacs.device.editButton" />
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

export default EcovacsDeviceBox;
