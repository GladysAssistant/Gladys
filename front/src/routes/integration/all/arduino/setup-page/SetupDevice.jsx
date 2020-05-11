import { Text, MarkupText, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';

class SetupDevice extends Component {
  saveDevice = async () => {
    this.setState({
      loading: true,
    });
    try {
      await this.props.saveDevice(this.props.deviceIndex);
    } catch (e) {
      this.setState({
        saveError: RequestStatus.Error,
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

  updateArduinoName = (e) => {
    this.props.updateArduinoName(this.props.deviceIndex, e.target.value);
  };

  updateArduinoPath = (e) => {
    this.props.updateArduinoPath(this.props.deviceIndex, e.target.value);
  };

  updateArduinoManufacturer = (e) => {
    this.props.updateArduinoManufacturer(this.props.deviceIndex, e.target.value);
  }

  updateArduinoModel = (e) => {
    this.props.updateArduinoModel(this.props.deviceIndex, e.target.value);
  };

  componentWillMount() {}

  render(props, { loading }) {
    return (
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.connectArduinoStatus === RequestStatus.Getting,
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            {props.arduinoConnected === RequestStatus.Success && (
              <p class="alert alert-success">
                <Text id="integration.arduino.setup.connected" />
              </p>
            )}
            {props.arduinoConnected === RequestStatus.Error && (
              <p class="alert alert-danger">
                <Text id="integration.arduino.setup.notConnected" />
              </p>
            )}
            {props.arduinoConnectionError && (
              <p class="alert alert-danger">
                <Text id="integration.arduino.setup.connectionError" /> - {props.arduinoConnectionError}
              </p>
            )}
            <div class="row mt-5">
              <div class="col">
                <div class="form-group">
                  <label class="form-label" for="arduinoName">
                    <Text id="integration.arduino.setup.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id="arduinoName"
                      type="text"
                      value={props.device.name}
                      onInput={this.updateArduinoName}
                      class="form-control"
                      placeholder={<Text id="integration.arduino.setup.nameLabel" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.arduino.setup.arduinoModelLabel" />
                  </label>
                  <select class="form-control" onChange={this.updateArduinoModel}>
                    <option>
                      <Text id="global.emptySelectOption" />
                    </option>
                    {props.arduinoModelsList &&
                      props.arduinoModelsList.map((model) => (
                        <option
                          value={model}
                          selected={props.device.params.find((e) => e.name === 'ARDUINO_MODEL').value === model}
                        >
                          {model}
                        </option>
                      ))}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.arduino.setup.arduinoUsbDriverPathLabel" />
                  </label>
                  <select class="form-control" onChange={this.updateArduinoPath}>
                    <option>
                      <Text id="global.emptySelectOption" />
                    </option>
                    {props.usbPorts &&
                      props.usbPorts.map((usbPort) => (
                        <option
                          value={usbPort.comPath}
                          selected={
                            props.device.params.find((e) => e.name === 'ARDUINO_PATH').value === usbPort.comPath
                          }
                        >
                          {usbPort.comName} - {usbPort.manufacturer}
                        </option>
                      ))}
                  </select>
                </div>

                <button class="btn btn-success" onClick={this.saveDevice}>
                  <Text id="integration.arduino.setup.connectButton" />
                </button>
                <button class="btn btn-danger ml-2" onClick={this.deleteDevice}>
                  <Text id="integration.arduino.setup.disconnectButton" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SetupDevice;
