import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';
import {
  DEVICE_FUNCTION,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
} from '../../../../../../../server/utils/constants';

class ArduinoDeviceBox extends Component {
  saveDevice = async () => {
    this.setState({
      loading: true,
    });
    try {
      await this.props.saveDevice(this.props.deviceIndex);
    } catch (e) {
      this.setState({
        error: RequestStatus.Error,
      });
    }
    this.setState({
      loading: false,
    });
  };

  deleteDevice = async () => {
    this.setState({
      loading: true,
    });
    try {
      await this.props.deleteDevice(this.props.deviceIndex);
    } catch (e) {
      this.setState({
        error: RequestStatus.Error,
      });
    }
    this.setState({
      loading: false,
    });
  };

  updateName = (e) => {
    this.props.updateName(this.props.deviceIndex, e.target.value);
  };

  updateDataPin = (e) => {
    this.props.updateDataPin(this.props.deviceIndex, e.target.value);
  };

  updateBitLength = (e) => {
    this.props.updateBitLength(this.props.deviceIndex, e.target.value);
  };

  updatePulseLength = (e) => {
    this.props.updatePulseLength(this.props.deviceIndex, e.target.value);
  };

  updateFunction = (e) => {
    this.props.updateFunction(this.props.deviceIndex, e.target.value);
    switch (e.target.value) {
      case DEVICE_FUNCTION.RECV_433:
        //this.props.updateFeature(this.props.deviceIndex, 0, 'category', DEVICE_FEATURE_CATEGORIES.SWITCH);
        //this.props.updateFeature(this.props.deviceIndex, 0, 'type', DEVICE_FEATURE_TYPES.SENSOR.PUSH);
        break;
      case DEVICE_FUNCTION.EMIT_433:
        //this.props.updateFeature(this.props.deviceIndex, 0, 'category', DEVICE_FEATURE_CATEGORIES.SWITCH);
        //this.props.updateFeature(this.props.deviceIndex, 0, 'type', DEVICE_FEATURE_TYPES.SENSOR.PUSH);
        this.props.updateBitLength(this.props.deviceIndex, '24');
        break;
      case DEVICE_FUNCTION.EMIT_433_CHACON:
        //this.props.updateFeature(this.props.deviceIndex, 0, 'category', DEVICE_FEATURE_CATEGORIES.SWITCH);
        //this.props.updateFeature(this.props.deviceIndex, 0, 'type', DEVICE_FEATURE_TYPES.SWITCH.BINARY);
        break;
      case DEVICE_FUNCTION.EMIT_IR:
        //this.props.updateFeature(this.props.deviceIndex, 0, 'category', DEVICE_FEATURE_CATEGORIES.SWITCH);
        //this.props.updateFeature(this.props.deviceIndex, 0, 'type', DEVICE_FEATURE_TYPES.SENSOR.PUSH);
        this.props.updateBitLength(this.props.deviceIndex, '32');
        break;
    }
  };

  updateFeature = (e) => {
    this.props.updateFeature(this.props.deviceIndex, 0, 'category', e.target.value.split(',')[0]);
    this.props.updateFeature(this.props.deviceIndex, 0, 'type', e.target.value.split(',')[1]);
  };

  updateArduino = (e) => {
    this.props.updateArduino(this.props.deviceIndex, e.target.value);
  };

  updateRoom = (e) => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'room_id', e.target.value);
  };

  updateCode = (e) => {
    this.props.updateCode(this.props.deviceIndex, e.target.value);
  };

  updateCodeOn = (e) => {
    this.props.updateCodeOn(this.props.deviceIndex, e.target.value);
  };

  updateCodeOff = (e) => {
    this.props.updateCodeOff(this.props.deviceIndex, e.target.value);
  };

  render(props, { loading }) {
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">{props.device.name || <Text id="integration.arduino.device.noNameLabel" />}</div>
          <div
            class={cx('dimmer', {
              active: loading,
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
                        props.houses.map((house) => (
                          <optgroup label={house.name}>
                            {house.rooms.map((room) => (
                              <option selected={room.id === props.device.room_id} value={room.id}>
                                {room.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="arduino-linked">
                      <Text id="integration.arduino.device.arduinoLinkedLabel" />
                    </label>
                    <select onChange={this.updateArduino} class="form-control" id="arduino-linked">
                      <option value="">
                        <Text id="global.emptySelectOption" />
                      </option>
                      {props.arduinoDevices &&
                        props.arduinoDevices.map((device) => (
                          <option
                            value={device.selector}
                            selected={
                              props.device.params.find((e) => e.name === 'ARDUINO_LINKED').value === device.selector
                            }
                          >
                            {device.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div class="form-group">
                    <div class="row">
                      <div class="col">
                        <label class="form-label" for="function">
                          <Text id="integration.arduino.device.functionLabel" />
                        </label>
                        <select
                          class="form-control"
                          id="function"
                          value={props.device.params.find((e) => e.name === 'FUNCTION').value}
                          onChange={this.updateFunction}
                        >
                          <option value={DEVICE_FUNCTION.RECV_433}>
                            <Text id="integration.arduino.function.recv433" />
                          </option>
                          <option value={DEVICE_FUNCTION.EMIT_433}>
                            <Text id="integration.arduino.function.emit433" />
                          </option>
                          <option value={DEVICE_FUNCTION.EMIT_433_CHACON}>
                            <Text id="integration.arduino.function.emit433Chacon" />
                          </option>
                          <option value={DEVICE_FUNCTION.EMIT_IR}>
                            <Text id="integration.arduino.function.emitIR" />
                          </option>
                        </select>
                      </div>
                      {props.device.params.find((e) => e.name === 'FUNCTION').value !== DEVICE_FUNCTION.RECV_433 && (
                        <div class="col">
                          <label class="form-label" for="dataPin">
                            <Text id="integration.arduino.device.dataPinLabel" />
                          </label>
                          <Localizer>
                            <input
                              id="dataPin"
                              type="text"
                              value={props.device.params.find((e) => e.name === 'DATA_PIN').value}
                              onInput={this.updateDataPin}
                              class="form-control"
                              placeholder={<Text id="integration.arduino.device.dataPinLabel" />}
                            />
                          </Localizer>
                        </div>
                      )}
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="feature">
                      <Text id="integration.arduino.device.featuresLabel" />
                    </label>
                    <select
                      class="form-control"
                      id="feature"
                      value={[props.device.features[0].category, props.device.features[0].type]}
                      onChange={this.updateFeature}
                    >
                      <option value={[DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.BINARY]}>
                        <i class="fe fe-toggle-right" />
                        <Text id="integration.arduino.features.lightButton" />
                      </option>
                      <option value={[DEVICE_FEATURE_CATEGORIES.SWITCH, DEVICE_FEATURE_TYPES.SWITCH.BINARY]}>
                        <i class="fe fe-toggle-right" />
                        <Text id="integration.arduino.features.switchButton" />
                      </option>
                      <option value={[DEVICE_FEATURE_CATEGORIES.SWITCH, DEVICE_FEATURE_TYPES.SENSOR.PUSH]}>
                        <i class="fe fe-target" />
                        <Text id="integration.arduino.features.pushButton" />
                      </option>
                      <option value={[DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR, DEVICE_FEATURE_TYPES.SENSOR.INTEGER]}>
                        <i class="fe fe-target" />
                        <Text id="integration.arduino.features.sensor" />
                      </option>
                    </select>
                  </div>

                  {/*props.device.params.find((e) => e.name === 'FUNCTION').value === DEVICE_FUNCTION.EMIT_IR && (
                    <div class="form-group">
                      <div class="row">
                        <div class="col">
                          <label class="form-label" for="code">
                            <Text id="integration.arduino.device.codeLabel" />
                          </label>
                          <Localizer>
                            <input
                              id="code"
                              type="text"
                              value={props.device.params.find((e) => e.name === 'CODE').value}
                              onInput={this.updateCode}
                              class="form-control"
                              placeholder={<Text id="integration.arduino.device.codeLabel" />}
                            />
                          </Localizer>
                        </div>
                        <div class="col">
                          <label class="form-label" for="pulseLength">
                            <Text id="integration.arduino.device.pulseLengthLabel" />
                          </label>
                          <Localizer>
                            <input
                              id="pulseLength"
                              type="text"
                              value={props.device.params.find((e) => e.name === 'PULSE_LENGTH').value}
                              onInput={this.updatePulseLength}
                              class="form-control"
                              placeholder={<Text id="integration.arduino.device.pulseLengthLabel" />}
                            />
                          </Localizer>
                        </div>
                      </div>
                    </div>
                  )*/}

                  {(props.device.params.find((e) => e.name === 'FUNCTION').value === DEVICE_FUNCTION.EMIT_IR ||
                    props.device.params.find((e) => e.name === 'FUNCTION').value === DEVICE_FUNCTION.EMIT_433) && (
                    <div class="form-group">
                      <div class="row">
                        <div class="col">
                          <label class="form-label" for="code">
                            <Text id="integration.arduino.device.codeLabel" />
                          </label>
                          <Localizer>
                            <input
                              id="code"
                              type="text"
                              value={props.device.params.find((e) => e.name === 'CODE').value}
                              onInput={this.updateCode}
                              class="form-control"
                              placeholder={<Text id="integration.arduino.device.codeLabel" />}
                            />
                          </Localizer>
                        </div>
                        <div class="col">
                          <label class="form-label" for="bitLength">
                            <Text id="integration.arduino.device.bitLengthLabel" />
                          </label>
                          <Localizer>
                            <input
                              id="bitLength"
                              type="text"
                              value={props.device.params.find((e) => e.name === 'BIT_LENGTH').value}
                              onInput={this.updateBitLength}
                              class="form-control"
                              placeholder={<Text id="integration.arduino.device.bitLengthLabel" />}
                            />
                          </Localizer>
                        </div>
                      </div>
                      <label class="form-label" for="pulseLength">
                        <Text id="integration.arduino.device.pulseLengthLabel" />
                      </label>
                      <Localizer>
                        <input
                          id="pulseLength"
                          type="text"
                          value={props.device.params.find((e) => e.name === 'PULSE_LENGTH').value}
                          onInput={this.updatePulseLength}
                          class="form-control"
                          placeholder={<Text id="integration.arduino.device.pulseLengthLabel" />}
                        />
                      </Localizer>
                    </div>
                  )}

                  {props.device.params.find((e) => e.name === 'FUNCTION').value === DEVICE_FUNCTION.EMIT_433_CHACON && (
                    <div class="form-group">
                      <div class="row">
                        <div class="col">
                          <label class="form-label" for="codeOn">
                            <Text id="integration.arduino.device.codeOnLabel" />
                          </label>
                          <Localizer>
                            <input
                              id="codeOn"
                              type="text"
                              value={props.device.params.find((e) => e.name === 'CODE_ON').value}
                              onInput={this.updateCodeOn}
                              class="form-control"
                              placeholder={<Text id="integration.arduino.device.codeOnLabel" />}
                            />
                          </Localizer>
                        </div>

                        <div class="col">
                          <label class="form-label" for="codeOff">
                            <Text id="integration.arduino.device.codeOffLabel" />
                          </label>
                          <Localizer>
                            <input
                              id="codeOff"
                              type="text"
                              value={props.device.params.find((e) => e.name === 'CODE_OFF').value}
                              onInput={this.updateCodeOff}
                              class="form-control"
                              placeholder={<Text id="integration.arduino.device.codeOffLabel" />}
                            />
                          </Localizer>
                        </div>
                      </div>

                      <label class="form-label" for="pulseLength">
                        <Text id="integration.arduino.device.pulseLengthLabel" />
                      </label>
                      <Localizer>
                        <input
                          id="pulseLength"
                          type="text"
                          value={props.device.params.find((e) => e.name === 'PULSE_LENGTH').value}
                          onInput={this.updatePulseLength}
                          class="form-control"
                          placeholder={<Text id="integration.arduino.device.pulseLengthLabel" />}
                        />
                      </Localizer>
                    </div>
                  )}
                </div>
                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.arduino.device.saveButton" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger mr-2">
                    <Text id="integration.arduino.device.deleteButton" />
                  </button>
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
