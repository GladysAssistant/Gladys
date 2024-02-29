import { Component } from 'preact';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';
import get from 'get-value';
import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';
import BatteryLevelFeature from '../../../../components/device/view/BatteryLevelFeature';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../server/utils/constants';
import {
  GITHUB_BASE_URL,
  PARAMS,
  SUPPORTED_CATEGORY_TYPE
} from '../../../../../../server/services/netatmo/lib/utils/netatmo.constants';
import styles from './style.css';

const createGithubUrl = device => {
  const title = encodeURIComponent(`Netatmo: Add device ${device.model}`);
  const body = encodeURIComponent(`\`\`\`\n${JSON.stringify(device, null, 2)}\n\`\`\``);
  return `${GITHUB_BASE_URL}?title=${title}&body=${body}`;
};

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
    const device = this.state.device;
    if (!device.features) {
      return null;
    }
    const batteryLevelDeviceFeature = device.features.find(
      deviceFeature => deviceFeature.category === DEVICE_FEATURE_CATEGORIES.BATTERY
    );
    const batteryLevel = get(batteryLevelDeviceFeature, 'last_value');
    let mostRecentValueAt = null;
    device.features.forEach(feature => {
      if (feature.last_value_changed && new Date(feature.last_value_changed) > mostRecentValueAt) {
        mostRecentValueAt = new Date(feature.last_value_changed);
      }
    });

    let roomNameNetatmo = null;
    const roomNameParam = device.params.find(param => param.name === PARAMS.ROOM_NAME);
    if (roomNameParam) {
      roomNameNetatmo = roomNameParam.value;
    }

    let plugName = null;
    const plugNameParam = device.params.find(param => param.name === PARAMS.PLUG_NAME);
    const plugIdParam = device.params.find(param => param.name === PARAMS.PLUG_ID);
    if (plugNameParam) {
      plugName = `${plugNameParam.value} (${plugIdParam.value})`;
    }

    let categoryAPI = null;
    let apiNotConfigured = null;
    if (device.deviceNetatmo) {
      categoryAPI = device.deviceNetatmo.categoryAPI;
      apiNotConfigured = device.deviceNetatmo.apiNotConfigured;
    }
    const isDeviceReachable = (device, now = new Date()) => {
      const isRecent = (date, time) => (now - new Date(date)) / (1000 * 60) <= time;
      const hasRecentFeature = device.features.some(feature => isRecent(feature.last_value_changed, 15));
      const isNetatmoDeviceReachable =
        device.deviceNetatmo &&
        (device.deviceNetatmo.reachable ||
          device.deviceNetatmo.room.reachable ||
          isRecent(device.deviceNetatmo.last_plug_seen * 1000, 180) ||
          isRecent(device.deviceNetatmo.last_therm_seen * 1000, 180));
      return hasRecentFeature || isNetatmoDeviceReachable;
    };
    const online = isDeviceReachable(device);

    return {
      batteryLevel,
      mostRecentValueAt,
      roomNameNetatmo,
      plugName,
      online,
      categoryAPI,
      apiNotConfigured
    };
  };

  render(
    {
      deviceIndex,
      editable,
      deleteButton,
      saveButton,
      updateButton,
      alreadyCreatedButton,
      showMostRecentValueAt,
      housesWithRooms
    },
    { device, user, loading, errorMessage, tooMuchStatesError, statesNumber }
  ) {
    const validModel = (device.features && device.features.length > 0) || !device.not_handled;
    const {
      batteryLevel,
      mostRecentValueAt,
      roomNameNetatmo,
      plugName,
      online,
      categoryAPI,
      apiNotConfigured
    } = this.getDeviceProperty();
    const sidDevice = device.external_id.replace('netatmo:', '') || (device.deviceNetatmo && device.deviceNetatmo.id);
    const saveButtonCondition =
      (saveButton && !alreadyCreatedButton) || (saveButton && !this.state.isSaving && alreadyCreatedButton);
    const modelImage = `/assets/integrations/devices/netatmo/netatmo-${device.model}.jpg`;
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
                      e.target.onerror = null;
                      e.target.src = '/assets/integrations/cover/netatmo.jpg';
                    }}
                    alt={`Image de ${device.name}`}
                    className={styles['device-image-container']}
                  />
                </div>
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.netatmo.device.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.netatmo.device.namePlaceholder" />}
                      disabled={!editable || !validModel}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`model_${deviceIndex}`}>
                    <Text id="integration.netatmo.device.modelLabel" />
                  </label>
                  <input
                    id={`model_${deviceIndex}`}
                    type="text"
                    value={device.model}
                    class="form-control"
                    disabled="true"
                  />
                </div>
                {plugName && (
                  <div class="form-group">
                    <label class="form-label" for={`model_${deviceIndex}`}>
                      <Text id="integration.netatmo.device.connectedPlugLabel" />
                    </label>
                    <input
                      id={`connectedPlug_${deviceIndex}`}
                      type="text"
                      value={plugName}
                      class="form-control"
                      disabled="true"
                    />
                  </div>
                )}
                {sidDevice && (
                  <div class="form-group">
                    <label class="form-label" for={`model_${deviceIndex}`}>
                      <Text id="integration.netatmo.device.sidLabel" />
                    </label>
                    <input
                      id={`connectedPlug_${deviceIndex}`}
                      type="text"
                      value={sidDevice}
                      class="form-control"
                      disabled="true"
                    />
                  </div>
                )}
                {roomNameNetatmo && (
                  <div class="form-group">
                    <label class="form-label" for={`model_${deviceIndex}`}>
                      <Text id="integration.netatmo.device.roomNetatmoApiLabel" />
                    </label>
                    <input
                      id={`connectedPlug_${deviceIndex}`}
                      type="text"
                      value={roomNameNetatmo}
                      class="form-control"
                      disabled="true"
                    />
                  </div>
                )}

                {validModel && (
                  <div class="form-group">
                    <label class="form-label" for={`room_${deviceIndex}`}>
                      <Text id="integration.netatmo.device.roomLabel" />
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

                {validModel && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.netatmo.device.featuresLabel" />
                    </label>
                    <DeviceFeatures features={device.features} />
                  </div>
                )}

                <div class="form-group">
                  {validModel && this.state.isSaving && alreadyCreatedButton && (
                    <button class="btn btn-primary mr-2" disabled="true">
                      <Text id="integration.netatmo.discover.alreadyCreatedButton" />
                    </button>
                  )}

                  {validModel && updateButton && (
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.netatmo.discover.updateButton" />
                    </button>
                  )}

                  {validModel && saveButtonCondition && !apiNotConfigured && (
                    <button onClick={this.saveDevice} class={`btn btn-success mr-2`}>
                      <Text id="integration.netatmo.device.saveButton" />
                    </button>
                  )}

                  {validModel && saveButtonCondition && apiNotConfigured && (
                    <div class="form-group">
                      <label class="form-label">
                        {categoryAPI === SUPPORTED_CATEGORY_TYPE.WEATHER && (
                          <Text id="integration.netatmo.status.weatherApiNotConfigured" />
                        )}
                        {categoryAPI === SUPPORTED_CATEGORY_TYPE.ENERGY && (
                          <Text id="integration.netatmo.status.energyApiNotConfigured" />
                        )}
                      </label>
                      <button class={`btn btn-warning mr-2`} disabled="true">
                        <Text id="integration.netatmo.device.saveNotAllowButton" />
                      </button>
                    </div>
                  )}

                  {validModel && deleteButton && (
                    <button onClick={this.deleteDevice} class="btn btn-danger">
                      <Text id="integration.netatmo.device.deleteButton" />
                    </button>
                  )}

                  {!validModel && (
                    <div>
                      <div class="alert alert-warning">
                        <Text id="integration.netatmo.discover.unmanagedModelButton" />
                      </div>
                      <a class="btn btn-gray" href={createGithubUrl(device)} target="_blank" rel="noopener noreferrer">
                        <Text id="integration.philipsHue.device.createGithubIssue" />
                      </a>
                    </div>
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
