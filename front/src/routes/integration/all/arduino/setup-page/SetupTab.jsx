import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';

const SetupTab = ({ children, ...props }) => {
  return (
    <div>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.arduino.setup.title" />
          </h3>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: props.connectArduinoStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <p>
                <MarkupText id="integration.arduino.setup.arduinoDescription" />
              </p>
              {props.connectArduinoStatus === RequestStatus.Error && (
                <p class="alert alert-danger">
                  <Text id="integration.arduino.setup.error" />
                </p>
              )}
              {props.connectArduinoStatus === RequestStatus.Success && !props.arduinoConnected && (
                <p class="alert alert-info">
                  <Text id="integration.arduino.setup.connecting" />
                </p>
              )}
              {props.arduinoConnected && (
                <p class="alert alert-success">
                  <Text id="integration.arduino.setup.connected" />
                </p>
              )}
              {props.arduinoConnectionError && (
                <p class="alert alert-danger">
                  <Text id="integration.arduino.setup.connectionError" /> - {props.arduinoConnectionError}
                </p>
              )}
              <form>
                <div class="row mt-5">
                  <div class="col">
                    <button type="submit" class="btn btn-success" onClick={props.saveConfiguration}>
                      <Text id="integration.arduino.setup.detectionLabel" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>


      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.arduino.device.title" />
          </h3>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: props.connectArduinoStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />






          </div>
        </div>
      </div>
    </div>

  );
};

export default SetupTab;
