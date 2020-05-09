import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';
import { Link } from 'preact-router/match';
import { DEVICE_SUBSERVICE_LIST } from '../../../../../../../server/utils/constants';
import get from 'get-value';

class ArduinoDeviceBox extends Component {
  saveDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.saveDevice(this.props.device, this.props.deviceIndex);
    } catch (e) {
      this.setState({ error: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };

  deleteDevice = async () => {
    this.setState({ 
      loading: true 
    });
    try {
      await this.props.deleteDevice(this.props.deviceIndex);
    } catch (e) {
      this.setState({ 
        error: RequestStatus.Error
      });
    }
    this.setState({ loading: false });
  };

  updateName = e => {
    this.props.updateName(this.props.deviceIndex, e.target.value);
  };

  updateDataPin = e => {
    this.props.updateDataPin(this.props.deviceIndex, e.target.value);
  };

  updateSubservice = e => {
    this.props.updateSubservice(this.props.deviceIndex, e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'room_id', e.target.value);
  };

  updateExternalId = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'external_id', e.target.value);
  };

  render(props, { loading }) {
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">{props.device.name || <Text id="integration.arduino.device.noNameLabel" />}</div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                <div>
                  <div class="form-group">
                    <label class="form-label" for="deviceName">
                      <Text id="integration.arduino.device.nameLabel" />
                    </label>
                    <Localizer>
                      <input
                        id="deviceName"
                        type="text"
                        value={props.device.name}
                        onInput={this.updateName}
                        class="form-control"
                        placeholder={<Text id="integration.arduino.device.nameLabel" />}
                      />
                    </Localizer>
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="room">
                      <Text id="integration.arduino.device.roomLabel" />
                    </label>
                    <select onChange={this.updateRoom} class="form-control" id="room">
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

                  <div class="form-group">
                    <label class="form-label" for="subservice">
                      <Text id="integration.arduino.device.subserviceLabel" />
                    </label>
                    <select class="form-control" id="subservice" onChange={this.updateSubservice}>
                      <option value={DEVICE_SUBSERVICE_LIST.EMIT_433}>
                        <Text id="integration.arduino.subservice.emit433" />
                      </option>
                      <option value={DEVICE_SUBSERVICE_LIST.EMIT_433_CHACON}>
                        <Text id="integration.arduino.subservice.emit433Chacon" />
                      </option>
                      <option value={DEVICE_SUBSERVICE_LIST.EMIT_IR}>
                        <Text id="integration.arduino.subservice.emitIR" />
                      </option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="dataPin">
                      <Text id="integration.arduino.device.dataPinLabel" />
                    </label>
                    <Localizer>
                      <input
                        id="dataPin"
                        type="text"
                        value={props.device.dataPin}
                        onInput={this.updateDataPin}
                        class="form-control"
                        placeholder={<Text id="integration.arduino.device.dataPinLabel" />}
                      />
                    </Localizer>
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.arduino.device.featuresLabel" />
                    </label>
                    <div class="tags">
                      {props.device &&
                        props.device.features &&
                        props.device.features.map(feature => (
                          <span class="tag">
                            <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
                            <div class="tag-addon">
                              <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`} />
                            </div>
                          </span>
                        ))}
                      {(!props.device.features || props.device.features.length === 0) && (
                        <Text id="integration.arduino.device.noFeatures" />
                      )}
                    </div>
                  </div>
                </div>
                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.arduino.device.saveButton" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger mr-2">
                    <Text id="integration.arduino.device.deleteButton" />
                  </button>

                  <Link href={`/dashboard/integration/device/arduino/edit/${props.device.selector}`}>
                    <button class="btn btn-secondary float-right">
                      <Text id="integration.arduino.device.editButton" />
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

export default ArduinoDeviceBox;