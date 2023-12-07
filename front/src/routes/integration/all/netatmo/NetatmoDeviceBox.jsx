import { Component } from 'preact';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import { Link } from 'preact-router';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';
import get from 'get-value';
import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';
import BatteryLevelFeature from '../../../../components/device/view/BatteryLevelFeature';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../server/utils/constants';
import styles from './style.css';

class NetatmoDeviceBox extends Component {
  componentWillMount() {
    this.setState({
      device: this.props.device,
      user: this.props.user
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
        device: savedDevice,
        isSaving: true
      });
    } catch (e) {
      let errorMessage = 'integration.netatmo.error.defaultError';
      if (e.response.status === 409) {
        errorMessage = 'integration.netatmo.error.conflictError';
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
      this.props.getNetatmoDevices();
    } catch (e) {
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        this.setState({
          errorMessage: 'integration.netatmo.error.defaultDeletionError'
        });
      }
    }
    this.setState({
      loading: false
    });
  };

  getDeviceProperty = () => {
    if (!this.state.device.features) {
      return null;
    }
    const batteryLevelDeviceFeature = this.state.device.features.find(
      deviceFeature => deviceFeature.category === DEVICE_FEATURE_CATEGORIES.BATTERY
    );
    const batteryLevel = get(batteryLevelDeviceFeature, 'last_value');
    let mostRecentValueAt = null;
    this.state.device.features.forEach(feature => {
      if (feature.last_value_changed && new Date(feature.last_value_changed) > mostRecentValueAt) {
        mostRecentValueAt = new Date(feature.last_value_changed);
      }
    });
    return {
      batteryLevel,
      mostRecentValueAt
    };
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
      showMostRecentValueAt,
      housesWithRooms
    },
    { device, user, loading, errorMessage, tooMuchStatesError, statesNumber }
  ) {
    const validModel = device.features && device.features.length > 0;
    const online = device.online;
    const { batteryLevel, mostRecentValueAt } = this.getDeviceProperty();
    const modelImage = `../../../../assets/integrations/devices/netatmo/netatmo-${device.model}.jpg`;
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <Localizer>
              <div title={<Text id={`integration.netatmo.status.${online ? 'online' : 'offline'}`} />}>
                <i class={`fe fe-radio text-${online ? 'success' : 'danger'}`} />
                &nbsp;{device.name}
              </div>
            </Localizer>
            {device.deviceNetatmo && device.deviceNetatmo.firmware_revision && (
              <div class={styles['firmware-revision']}>
                <strong>
                  <Text id={`integration.netatmo.device.firmwareRevisionLabel`} />
                </strong>
                &nbsp;{device.deviceNetatmo.firmware_revision}
              </div>
            )}
            {showMostRecentValueAt && batteryLevel && (
              <div class="page-options d-flex">
                <BatteryLevelFeature batteryLevel={batteryLevel} />
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
                    <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
                  </div>
                )}
                <div class="form-group">
                  <img
                    src={modelImage}
                    onError={e => {
                      e.target.style.display = 'none';
                    }}
                    alt={`Image de ${device.name}`}
                    className={styles['device-image-container']}
                  />
                </div>
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.netatmo.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.netatmo.namePlaceholder" />}
                      disabled={!editable || !validModel}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`model_${deviceIndex}`}>
                    <Text id="integration.netatmo.modelLabel" />
                  </label>
                  <input
                    id={`model_${deviceIndex}`}
                    type="text"
                    value={device.model}
                    class="form-control"
                    disabled="true"
                  />
                </div>
                {device.deviceNetatmo && device.deviceNetatmo.plug && device.deviceNetatmo.plug.name && (
                  <div class="form-group">
                    <label class="form-label" for={`model_${deviceIndex}`}>
                      <Text id="integration.netatmo.device.connectedPlugLabel" />
                    </label>
                    <input
                      id={`connectedPlug_${deviceIndex}`}
                      type="text"
                      value={device.deviceNetatmo.plug.name}
                      class="form-control"
                      disabled="true"
                    />
                  </div>
                )}
                {device.deviceNetatmo && device.deviceNetatmo.room && (
                  <div class="form-group">
                    <label class="form-label" for={`model_${deviceIndex}`}>
                      <Text id="integration.netatmo.device.roomNetatmoApiLabel" />
                    </label>
                    <input
                      id={`connectedPlug_${deviceIndex}`}
                      type="text"
                      value={device.deviceNetatmo.room.name}
                      class="form-control"
                      disabled="true"
                    />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`room_${deviceIndex}`}>
                    <Text id="integration.netatmo.roomLabel" />
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
                      <Text id="integration.netatmo.device.featuresLabel" />
                    </label>
                    <DeviceFeatures features={device.features} />
                  </div>
                )}

                <div class="form-group">
                  {validModel && alreadyCreatedButton && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.netatmo.alreadyCreatedButton" />
                    </button>
                  )}

                  {validModel && updateButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.netatmo.updateButton" />
                    </button>
                  )}

                  {validModel && saveButton && (
                    <button
                      onClick={this.saveDevice}
                      class={`btn ${this.state.isSaving ? 'btn-primary' : 'btn-success'} mr-2`}
                      disabled={this.state.isSaving}
                    >
                      {this.state.isSaving ? (
                        <Text id="integration.netatmo.alreadyCreatedButton" />
                      ) : (
                        <Text id="integration.netatmo.saveButton" />
                      )}
                      {/* {!this.state.isSaving && (<Text id="integration.netatmo.saveButton" />)}
                      {this.state.isSaving && (<Text id="integration.netatmo.alreadyCreatedButton" />)} */}
                    </button>
                  )}

                  {validModel && deleteButton && (
                    <button onClick={this.deleteDevice} class="btn btn-danger">
                      <Text id="integration.netatmo.deleteButton" />
                    </button>
                  )}

                  {!validModel && (
                    <button class="btn btn-dark" disabled>
                      <Text id="integration.netatmo.unmanagedModelButton" />
                    </button>
                  )}

                  {validModel && editButton && (
                    <Link href={`/dashboard/integration/device/netatmo/edit/${device.selector}`}>
                      <button class="btn btn-secondary float-right">
                        <Text id="integration.netatmo.device.editButton" />
                      </button>
                    </Link>
                  )}

                  {validModel && showMostRecentValueAt && (
                    <p class="mt-4">
                      {mostRecentValueAt ? (
                        <Text
                          id="integration.mqtt.device.mostRecentValueAt"
                          fields={{
                            mostRecentValueAt: dayjs(mostRecentValueAt)
                              .locale(user.language)
                              .fromNow()
                          }}
                        />
                      ) : (
                        <Text id="integration.netatmo.device.noValueReceived" />
                      )}
                    </p>
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

export default connect('httpClient,user', {})(NetatmoDeviceBox);
