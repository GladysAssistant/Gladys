import { Text, Localizer, MarkupText } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { Link } from 'preact-router/match';
import get from 'get-value';

import { RequestStatus } from '../../../../../utils/consts';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';
import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import BatteryLevelFeature from '../../../../../components/device/view/BatteryLevelFeature';
import logoZigbee2mqtt from '../../../../../assets/integrations/logos/logo_zigbee2mqtt.png';
import style from './style.css';

class Zigbee2mqttBox extends Component {
  updateName = e => {
    this.props.updateDeviceField(this.props.deviceIndex, 'name', e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceField(this.props.deviceIndex, 'room_id', e.target.value);
  };

  updateModel = e => {
    const selectedModel = e.target.value;
    const params = (this.props.device.params || []).slice();
    const model = params.find(p => p.name === 'model');

    if (model) {
      model.value = selectedModel;
    } else {
      params.push({
        name: 'model',
        value: selectedModel
      });
    }

    this.props.updateDeviceField(this.props.deviceIndex, 'model', selectedModel);
    this.props.updateDeviceField(this.props.deviceIndex, 'params', params);
    //    this.props.updateDeviceField(this.props.deviceIndex, 'features', models[selectedModel]);
  };

  saveDevice = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.saveDevice(this.props.deviceIndex);
      this.setState({
        saveError: null
      });
    } catch (e) {
      this.setState({
        saveError: RequestStatus.Error
      });
    }
    this.setState({
      loading: false
    });
  };

  deleteDevice = async () => {
    this.setState({
      loading: true,
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
          deleteError: RequestStatus.Error
        });
      }
    }
    this.setState({
      loading: false
    });
  };

  getDeviceProperty = () => {
    if (!this.props.device.features) {
      return null;
    }
    const batteryLevelDeviceFeature = this.props.device.features.find(
      deviceFeature => deviceFeature.category === DEVICE_FEATURE_CATEGORIES.BATTERY
    );
    const batteryLevel = get(batteryLevelDeviceFeature, 'last_value');

    return {
      batteryLevel
    };
  };

  render(props, { loading, saveError, tooMuchStatesError, statesNumber }) {
    const { batteryLevel } = this.getDeviceProperty();
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            {props.device.name}{' '}
            {batteryLevel && (
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
                {saveError && (
                  <div class="alert alert-danger">
                    <Text id="integration.zigbee2mqtt.saveError" />
                  </div>
                )}
                {tooMuchStatesError && (
                  <div class="alert alert-warning">
                    <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${props.deviceIndex}`}>
                    <Text id="integration.zigbee2mqtt.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${props.deviceIndex}`}
                      type="text"
                      value={props.device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.zigbee2mqtt.namePlaceholder" />}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`room_${props.deviceIndex}`}>
                    <Text id="integration.zigbee2mqtt.roomLabel" />
                  </label>
                  <select onChange={this.updateRoom} class="form-control" id={`room_${props.deviceIndex}`}>
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {props.houses &&
                      props.houses.map(house => (
                        <optgroup label={house.name}>
                          {house.rooms.map(room => (
                            <option selected={room.id === props.device.room_id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                  </select>
                </div>

                {props.device.ieeeAddress && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.zigbee2mqtt.ieeeAddressLabel" />
                    </label>
                    <input type="text" class="form-control" value={props.device.ieeeAddress} disabled />
                    {props.z2mUrl && (
                      <a
                        href={`${props.z2mUrl}/#/device/0/${props.device.ieeeAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        class={`${style.z2mDeviceLink} mt-2 text-muted`}
                      >
                        <img src={logoZigbee2mqtt} alt="Zigbee2mqtt" class={style.z2mDeviceLinkLogo} />
                        <Text id="integration.zigbee2mqtt.openInZ2mButton" />
                      </a>
                    )}
                  </div>
                )}

                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.zigbee2mqtt.featuresLabel" />
                  </label>
                  <DeviceFeatures features={props.device.features} />
                </div>

                <div class={style.z2mActionButtons}>
                  <div class={style.z2mActionButtonsLeft}>
                    <button onClick={this.saveDevice} class="btn btn-success">
                      <Text id="integration.zigbee2mqtt.saveButton" />
                    </button>
                    <button onClick={this.deleteDevice} class="btn btn-danger">
                      <Text id="integration.zigbee2mqtt.deleteButton" />
                    </button>
                  </div>
                  <Link href={`/dashboard/integration/device/zigbee2mqtt/edit/${props.device.selector}`} class={style.z2mEditLink}>
                    <button class="btn btn-primary btn-block">
                      <Text id="integration.zigbee2mqtt.device.editButton" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Zigbee2mqttBox;
