import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { W215_PIN_CODE } from '../../../../../../server/services/w215/lib/utils/constants';
import get from 'get-value';
import { Link } from 'preact-router';

class W215DeviceBox extends Component {
  updateName = e => {
    this.props.updateDeviceField(this.props.listName, this.props.deviceIndex, 'name', e.target.value);

    this.setState({
      loading: false
    });
  };

  updatePinCode = e => {
    this.props.updateParamPinCode(this.props.listName, this.props.deviceIndex, e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceField(this.props.listName, this.props.deviceIndex, 'room_id', e.target.value);

    this.setState({
      loading: false
    });
  };

  testConnection = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.testConnection(this.props.listName, this.props.deviceIndex);
      this.setState({
        testConnectionError: null
      });
    } catch (e) {
      this.setState({
        testConnectionError: RequestStatus.Error
      });
    }
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
      let errorMessage = 'integration.w215.error.defaultError';
      // TODO : code erreur non utilisé pour mon device (à supprimer ?)
      if (e.response.status === 409) {
        errorMessage = 'integration.w215.error.conflictError';
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
        errorMessage: 'integration.w215.error.defaultDeletionError'
      });
    }
    this.setState({
      loading: false
    });
  };

  render(
    { deviceIndex, w215Device, housesWithRooms, editable, ...props },
    { loading, errorMessage, testConnectionError }
  ) {
    const validModel = w215Device.features.length > 0;

    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">{w215Device.name}</div>
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
                {!testConnectionError && w215Device.connectionSuccess === false && (
                  <div class="alert alert-danger">
                    <Text id="integration.w215.testConnectionError" />
                  </div>
                )}
                {!testConnectionError && w215Device.connectionSuccess === true && (
                  <div class="alert alert-success">
                    <Text id="integration.w215.testConnectionSuccess" />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.w215.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={w215Device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.w215.namePlaceholder" />}
                      disabled={!editable || !validModel}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`ip_${deviceIndex}`}>
                    <Text id="integration.w215.ip_adress" />
                  </label>
                  <Localizer>
                    <input
                      id={`model_${deviceIndex}`}
                      type="text"
                      value={w215Device.external_id}
                      class="form-control"
                      disabled="true"
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`pin_code_${deviceIndex}`}>
                    <Text id="integration.w215.pin_code" />
                  </label>
                  <Localizer>
                    <input
                      id={`pin_code_${deviceIndex}`}
                      type="text"
                      maxlength="6"
                      value={w215Device.params.find(param => param.name === W215_PIN_CODE).value}
                      onInput={this.updatePinCode}
                      class="form-control"
                      disabled={!editable || !validModel}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`room_${deviceIndex}`}>
                    <Text id="integration.w215.roomLabel" />
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
                            <option selected={room.id === w215Device.room_id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                  </select>
                </div>

                {w215Device.features && w215Device.features.length > 0 && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.w215.device.featuresLabel" />
                    </label>
                    <div class="tags">
                      {w215Device.features.map(feature => (
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
                )}

                <div class="form-group">
                  {validModel && props.alreadyCreatedButton && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.w215.alreadyCreatedButton" />
                    </button>
                  )}

                  {validModel && props.updateButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.w215.updateButton" />
                    </button>
                  )}

                  {validModel && props.saveButton && (
                    <button onClick={this.testConnection} class="btn btn-primary mr-2">
                      <Text id="integration.w215.checkConnection" />
                    </button>
                  )}

                  {validModel && props.saveButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.w215.saveButton" />
                    </button>
                  )}

                  {validModel && props.deleteButton && (
                    <button onClick={this.deleteDevice} class="btn btn-danger">
                      <Text id="integration.w215.deleteButton" />
                    </button>
                  )}

                  {!validModel && (
                    <button class="btn btn-dark" disabled>
                      <Text id="integration.w215.unmanagedModelButton" />
                    </button>
                  )}

                  {validModel && props.editButton && (
                    <Link href={`/dashboard/integration/device/w215/edit/${w215Device.selector}`}>
                      <button class="btn btn-secondary float-right">
                        <Text id="integration.w215.device.editButton" />
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

export default W215DeviceBox;
