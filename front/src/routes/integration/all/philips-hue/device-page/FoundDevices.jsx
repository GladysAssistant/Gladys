import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';

const createDevice = (props, device) => () => {
  props.createDevice(device);
};

const GITHUB_BASE_URL = 'https://github.com/GladysAssistant/Gladys/issues/new';

const createGithubUrl = device => {
  const title = encodeURIComponent(`Philips Hue: Add device ${device.model}`);
  const body = encodeURIComponent(`\`\`\`\n${JSON.stringify(device, null, 2)}\n\`\`\``);
  return `${GITHUB_BASE_URL}?title=${title}&body=${body}`;
};

const FoundDevices = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.philipsHue.device.deviceOnNetworkTitle" />
      </h3>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active:
            props.getPhilipsHueNewDevicesStatus === RequestStatus.Getting ||
            props.getPhilipsHueCreateDeviceStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.getPhilipsHueNewDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.philipsHueNewDevices && props.philipsHueNewDevices.length === 0 && (
              <div class="col-md-12">
                <div class="alert alert-info">
                  <Text id="integration.philipsHue.device.noDevicesFound" />
                </div>
              </div>
            )}
            {props.philipsHueNewDevices &&
              props.philipsHueNewDevices.map(device => (
                <div class="col-md-4">
                  <div class="card">
                    <div class="card-header">
                      <h3 class="card-title">{device.name}</h3>
                    </div>
                    <div class="card-body">
                      {!device.not_handled && (
                        <button class="btn btn-success" onClick={createDevice(props, device)}>
                          <Text id="integration.philipsHue.device.connectButton" />
                        </button>
                      )}
                      {device.not_handled && (
                        <div>
                          <div class="alert alert-warning">
                            <Text id="integration.philipsHue.device.deviceNotHandled" />
                          </div>
                          <a
                            class="btn btn-primary"
                            href={createGithubUrl(device)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Text id="integration.philipsHue.device.createGithubIssue" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            {props.philipsHueDevices && props.philipsHueDevices.length === 0 && (
              <Text id="integration.philipsHue.device.noDevices" />
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default FoundDevices;
