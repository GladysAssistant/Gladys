import { MarkupText, Text } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';

const disconnectBridge = (props, device, index) => () => {
  props.deleteDevice(device, index);
};

const connectBridge = (props, device) => () => {
  props.connectBridge(device);
};

const SetupTab = ({ children, ...props }) => {
  return (
    <div>
      {props.philipsHueBridgesDevices && props.philipsHueBridgesDevices.length > 0 && (
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <Text id="integration.philipsHue.setup.connectedBridgesTitle" />
            </h3>
          </div>
          <div class="card-body">
            <div
              class={cx('dimmer', {
                active: props.philipsHueGetDevicesStatus === RequestStatus.Getting
              })}
            >
              <div class="loader" />
              <div class="dimmer-content">
                {props.philipsHueDeleteDeviceStatus === RequestStatus.Error && (
                  <p class="alert alert-danger">
                    <MarkupText id="integration.philipsHue.setup.unknownError" />
                  </p>
                )}
                {props.philipsHueGetDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
                <div class="row">
                  {props.philipsHueBridgesDevices &&
                    props.philipsHueBridgesDevices.map((bridge, index) => (
                      <div class="col-md-4">
                        <div class="card">
                          <div class="card-header">
                            <h3 class="card-title">{bridge.name}</h3>
                          </div>
                          <div class="card-body">
                            <button class="btn btn-danger" onClick={disconnectBridge(props, bridge, index)}>
                              <Text id="integration.philipsHue.setup.disconnectButton" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                {props.philipsHueBridgesDevices && props.philipsHueBridgesDevices.length === 0 && (
                  <div>
                    <div style={{ marginTop: '20px', marginBottom: '20px', textAlign: 'center' }}>
                      <Text id="integration.philipsHue.setup.noBridgesConnected" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.philipsHue.setup.bridgesOnNetwork" />
          </h3>
          <div class="page-options d-flex">
            <button
              class="btn btn-info"
              onClick={props.getBridges}
              disabled={props.philipsHueGetBridgesStatus === RequestStatus.Getting}
            >
              <i class="fe fe-radio" /> <Text id="integration.philipsHue.setup.scanButton" />
            </button>
          </div>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active:
                props.philipsHueGetBridgesStatus === RequestStatus.Getting ||
                props.philipsHueCreateDeviceStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              {props.philipsHueGetBridgesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
              {props.philipsHueBridges && props.philipsHueBridges.length === 0 && (
                <div class="col-md-12">
                  <div class="alert alert-info">
                    <Text id="integration.philipsHue.setup.noBridgesFound" />
                  </div>
                </div>
              )}
              {props.philipsHueCreateDeviceStatus === RequestStatus.PhilipsHueBridgeButtonNotPressed && (
                <p class="alert alert-danger">
                  <Text id="integration.philipsHue.setup.bridgeButtonNotPressed" />
                </p>
              )}
              {props.philipsHueCreateDeviceStatus === RequestStatus.Error && (
                <p class="alert alert-danger">
                  <MarkupText id="integration.philipsHue.setup.unknownError" />
                </p>
              )}
              {props.philipsHueBridges &&
                props.philipsHueBridges.map(bridge => (
                  <div class="col-md-4">
                    <div class="card">
                      <div class="card-header">
                        <h3 class="card-title">{bridge.name}</h3>
                      </div>
                      <div class="card-body">
                        <button class="btn btn-success" onClick={connectBridge(props, bridge)}>
                          <Text id="integration.philipsHue.setup.connectButton" />
                        </button>
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
};

export default SetupTab;
