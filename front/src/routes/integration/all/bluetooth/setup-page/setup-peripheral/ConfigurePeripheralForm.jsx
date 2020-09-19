import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { Link } from 'preact-router/match';
import actions from '../actions';
import { RequestStatus } from '../../../../../../utils/consts';
import cx from 'classnames';

import ConfigurePeripheralInput from './ConfigurePeripheralInput';

@connect('session,httpClient,houses,currentIntegration', actions)
class ConfigurePeripheralForm extends Component {
  updateName(e) {
    this.setState({
      device: {
        ...this.state.device,
        name: e.target.value
      }
    });
  }

  updateRoom(e) {
    this.setState({
      device: {
        ...this.state.device,
        room_id: e.target.value
      }
    });
  }

  updateFeatureName(e, index) {
    e.preventDefault();

    const { device } = this.state;
    const features = device.features.slice();
    features[index].name = e.target.value;

    this.setState({
      device: {
        ...device,
        features
      }
    });
  }

  createDevice(e) {
    e.preventDefault();

    this.props.createDevice(this.state.device);
  }

  constructor(props) {
    super(props);

    this.state = {
      device: {
        name: props.peripheral.name,
        external_id: props.peripheral.uuid
      }
    };

    this.createDevice = this.createDevice.bind(this);

    this.updateName = this.updateName.bind(this);
    this.updateRoom = this.updateRoom.bind(this);
    this.updateFeatureName = this.updateFeatureName.bind(this);
  }

  componentWillMount() {
    this.props.getIntegrationByName('bluetooth');
  }

  render(props, {}) {
    const { device, bluetoothSaveStatus } = this.state;
    const { peripheral, houses } = props;

    const disableForm = bluetoothSaveStatus === RequestStatus.Getting;

    return (
      <form>
        {bluetoothSaveStatus === RequestStatus.Error && (
          <div class="alert alert-danger">
            <Text id="integration.bluetooth.setup.saveError" />
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
                <Text id="integration.bluetooth.setup.addressLabel" />
              </label>
              <input value={peripheral.address} class="form-control" disabled />
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

          {device.features && (
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.bluetooth.device.featuresLabel" />
              </label>
              <ul class="tags">
                {device.features.map((feature, index) => (
                  <ConfigurePeripheralInput
                    feature={feature}
                    index={index}
                    disableForm={disableForm}
                    updateFeatureName={this.updateFeatureName}
                  />
                ))}
              </ul>
            </div>
          )}

          <div class="row mt-5">
            <div class="col">
              <button
                type="submit"
                class="btn btn-success"
                disabled={disableForm || !device.features}
                onClick={this.createDevice}
              >
                <Text id="integration.bluetooth.setup.peripheral.createLabel" />
              </button>
            </div>
            <div class="col text-right">
              <Link href="/dashboard/integration/device/bluetooth/setup">
                <button type="button" class="btn btn-danger" disabled={disableForm}>
                  <Text id="integration.bluetooth.setup.peripheral.cancelLabel" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    );
  }
}

export default ConfigurePeripheralForm;
