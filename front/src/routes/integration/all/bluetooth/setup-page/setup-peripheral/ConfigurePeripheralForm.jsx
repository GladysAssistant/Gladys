import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';
import update from 'immutability-helper';

import withIntlAsProp from '../../../../../../utils/withIntlAsProp';
import { RequestStatus } from '../../../../../../utils/consts';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../../../server/utils/constants';

import actions from '../actions';
import UpdateDeviceFeature from '../../../../../../components/device/UpdateDeviceFeature';
import BluetoothPeripheralFeatures from '../BluetoothPeripheralFeatures';

class ConfigurePeripheralForm extends Component {
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

  updateFeatureProperty = (featureIndex, property, value) => {
    if (
      property === 'external_id' &&
      this.props.requiredExternalIdBase &&
      !value.startsWith(this.props.requiredExternalIdBase)
    ) {
      if (value.length < this.props.requiredExternalIdBase.length) {
        value = this.props.requiredExternalIdBase;
      } else {
        value = `${this.props.requiredExternalIdBase}${value}`;
      }
    }
    const device = update(this.state.device, {
      features: {
        [featureIndex]: {
          [property]: {
            $set: value
          }
        }
      }
    });

    this.setState({
      device
    });
  };

  createDevice = e => {
    e.preventDefault();

    const { device } = this.state;
    const deviceCopy = { ...device, service_id: this.props.currentIntegration.id };
    this.props.createDevice(deviceCopy);
  };

  switchPresenceSensor = () => {
    const { presenceSensorIndex, device } = this.state;

    let updatedDevice;
    let updatedPresenceSensorIndex;

    if (presenceSensorIndex >= 0) {
      updatedDevice = update(device, {
        features: {
          $splice: [[presenceSensorIndex, 1]]
        }
      });

      updatedPresenceSensorIndex = -1;
    } else {
      updatedDevice = update(device, {
        features: {
          $push: [
            {
              name: get(
                this.props.intl.dictionary,
                `deviceFeatureCategory.${DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR}.${DEVICE_FEATURE_TYPES.SENSOR.PUSH}`
              ),
              external_id: `${device.external_id}:${DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR}`,
              category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
              type: DEVICE_FEATURE_TYPES.SENSOR.PUSH,
              min: 0,
              max: 1,
              read_only: true,
              has_feedback: false,
              keep_history: true
            }
          ]
        }
      });

      updatedPresenceSensorIndex = updatedDevice.features.length - 1;
    }

    this.setState({
      device: updatedDevice,
      presenceSensorIndex: updatedPresenceSensorIndex
    });
  };

  constructor(props) {
    super(props);

    const { device } = props;
    const presenceSensorIndex = device.features.findIndex(
      f => f.category === DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR
    );

    this.state = {
      device,
      presenceSensorIndex
    };

    this.createDevice = this.createDevice.bind(this);

    this.updateName = this.updateName.bind(this);
    this.updateRoom = this.updateRoom.bind(this);
  }

  componentWillMount() {
    this.props.getIntegrationByName('bluetooth');
  }

  render({ houses, bluetoothSaveStatus, currentIntegration = {} }, { device, presenceSensorIndex }) {
    const deviceService = get(device, 'service_id');
    const bluetoothDevice = !deviceService || deviceService === currentIntegration.id;
    const disableForm = bluetoothSaveStatus === RequestStatus.Getting || !bluetoothDevice;
    const { features = [] } = device;

    return (
      <form>
        {!bluetoothDevice && (
          <div class="alert alert-warning">
            <Text id="integration.bluetooth.discover.notManagedByBluteooth" fields={{ service: device.service.name }} />
          </div>
        )}

        <div>
          <div>
            <div
              class={cx('form-group', {
                'was-validated': !device.name || device.name.length === 0
              })}
            >
              <label for="name" class="form-label">
                <Text id="integration.bluetooth.device.nameLabel" />
              </label>
              <Localizer>
                <input
                  name="name"
                  value={device.name}
                  onChange={this.updateName}
                  class="form-control"
                  placeholder={<Text id="integration.bluetooth.device.namePlaceholder" />}
                  disabled={disableForm}
                  required
                />
              </Localizer>
            </div>

            <div class="form-group">
              <label class="form-label">
                <Text id="integration.bluetooth.device.externalIdLabel" />
              </label>
              <input value={device.external_id} class="form-control" disabled />
            </div>

            <div class="form-group">
              <label for="room" class="form-label">
                <Text id="integration.bluetooth.device.roomLabel" />
              </label>
              <select name="room" onChange={this.updateRoom} class="form-control" disabled={disableForm}>
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
          </div>

          <div class="form-group">
            <label class="custom-switch">
              <input
                type="radio"
                class="custom-switch-input"
                checked={presenceSensorIndex >= 0}
                onClick={this.switchPresenceSensor}
              />
              <span class="custom-switch-indicator" />
              <span class="custom-switch-description">
                <Text id="integration.bluetooth.device.presenceSensorLabel" />
              </span>
            </label>
          </div>

          <BluetoothPeripheralFeatures device={device}>
            <div class="row">
              {features.map((feature, index) => (
                <UpdateDeviceFeature
                  feature={feature}
                  featureIndex={index}
                  updateFeatureProperty={this.updateFeatureProperty}
                />
              ))}
            </div>
          </BluetoothPeripheralFeatures>

          <div class="row mt-5">
            <div class="col">
              <button
                type="submit"
                class="btn btn-success"
                disabled={disableForm || features.length === 0}
                onClick={this.createDevice}
              >
                <Text id="integration.bluetooth.discover.peripheral.createLabel" />
              </button>
            </div>
            <div class="col text-right">
              <Link href="/dashboard/integration/device/bluetooth/setup">
                <button type="button" class="btn btn-danger">
                  <Text id="integration.bluetooth.discover.peripheral.cancelLabel" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    );
  }
}

export default withIntlAsProp(
  connect('session,httpClient,houses,currentIntegration', actions)(ConfigurePeripheralForm)
);
