import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';

const createDevice = (props, device) => () => {
  props.createDevice(device);
};

const GITHUB_BASE_URL = 'https://github.com/GladysAssistant/Gladys/issues/new';

const createGithubUrl = device => {
  const title = encodeURIComponent(`TP-Link: Add device ${device.model}`);
  const body = encodeURIComponent(`\`\`\`\n${JSON.stringify(device, null, 2)}\n\`\`\``);
  return `${GITHUB_BASE_URL}?title=${title}&body=${body}`;
};

const FoundDevices = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="integration.tpLink.device.deviceOnNetworkTitle" />
      </h3>
      <div class="page-options d-flex">
        <button
          class="btn btn-info"
          onClick={props.getTpLinkNewDevices}
          disabled={props.getTpLinkNewDevicesStatus === RequestStatus.Getting}
        >
          <i class="fe fe-radio" /> <Text id="integration.tpLink.device.scanButton" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active:
            props.getTpLinkNewDevicesStatus === RequestStatus.Getting ||
            props.getTpLinkCreateDeviceStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.getTpLinkNewDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.tpLinkNewDevices && props.tpLinkNewDevices.length === 0 && (
              <div class="col-md-12">
                <div class="alert alert-info">
                  <Text id="integration.tpLink.device.noDevicesFound" />
                </div>
              </div>
            )}
            {props.tpLinkNewDevices &&
              props.tpLinkNewDevices.map(device => (
                <div class="col-md-4">
                  <div class="card">
                    <div class="card-header">
                      <h3 class="card-title">{device.name}</h3>
                    </div>
                    <div class="card-body">
                      {!device.not_handled && (
                        <button class="btn btn-success" onClick={createDevice(props, device)}>
                          <Text id="integration.tpLink.device.connectButton" />
                        </button>
                      )}
                      {device.not_handled && (
                        <div>
                          <div class="alert alert-warning">
                            <Text id="integration.tpLink.device.deviceNotHandled" />
                          </div>
                          <a
                            class="btn btn-primary"
                            href={createGithubUrl(device)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Text id="integration.tpLink.device.createGithubIssue" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default FoundDevices;
