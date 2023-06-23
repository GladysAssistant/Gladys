import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { DEVICE_PARAMS } from '../../../../../../server/services/overkiz/lib/overkiz.constants';
import get from 'get-value';

class OverkizDeviceBox extends Component {
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
      await this.props.saveDevice(this.props.listName, this.props.deviceIndex);
    } catch (e) {
      let errorMessage = 'integration.overkiz.error.defaultError';
      if (e.response.status === 409) {
        errorMessage = 'integration.overkiz.error.conflictError';
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
        errorMessage: 'integration.overkiz.error.defaultDeletionError'
      });
    }
    this.setState({
      loading: false
    });
  };

  render({ deviceIndex, device, housesWithRooms, editable, ...props }, { loading, errorMessage }) {
    const online = device.params.find(param => param.name === DEVICE_PARAMS.ONLINE).value === '1';
    const firmware = device.params.find(param => param.name === DEVICE_PARAMS.FIRMWARE).value;
    const state = device.params.find(param => param.name === DEVICE_PARAMS.STATE).value;

    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <Localizer>
              <div title={<Text id={`integration.overkiz.status.${online ? 'online' : 'offline'}`} />}>
                <i class={`fe fe-radio text-${online ? 'success' : 'danger'}`} />
                &nbsp;{device.name}
              </div>
            </Localizer>
            <div class="page-options d-flex">
              {firmware && <div class="tag tag-blue">{`Firmware: ${firmware}`}</div>}
            </div>
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
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.overkiz.device.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.overkiz.device.namePlaceholder" />}
                      disabled={!editable}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`model_${deviceIndex}`}>
                    <Text id="integration.overkiz.device.modelLabel" />
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
                  <label class="form-label" for={`model_${deviceIndex}`}>
                    <Text id="integration.overkiz.device.stateLabel" />
                  </label>
                  <input id={`state_${deviceIndex}`} type="text" value={state} class="form-control" disabled="true" />
                </div>

                {editable && (
                  <div class="form-group">
                    <label class="form-label" for={`room_${deviceIndex}`}>
                      <Text id="integration.overkiz.device.roomLabel" />
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
                  <label class="form-label">
                    <Text id="integration.overkiz.device.featuresLabel" />
                  </label>
                  <div class="tags">
                    {device.features.map(feature => (
                      <span class="tag">
                        <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
                        <div class="tag-addon">
                          <i
                            class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`}
                          />
                        </div>
                      </span>
                    ))}
                  </div>
                </div>

                <div class="form-group">
                  {props.createButton && (
                    <button onClick={this.saveDevice} class="btn btn-primary mr-2">
                      <Text id="integration.overkiz.device.createButton" />
                    </button>
                  )}

                  {props.updateButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.overkiz.device.updateButton" />
                    </button>
                  )}

                  {props.deleteButton && (
                    <button onClick={this.deleteDevice} class="btn btn-danger mr-2">
                      <Text id="integration.overkiz.device.deleteButton" />
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

export default OverkizDeviceBox;
