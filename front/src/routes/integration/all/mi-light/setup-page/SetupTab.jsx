import { Text } from 'preact-i18n';
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
      {props.miLightBridgesDevices && props.miLightBridgesDevices.length > 0 && (
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <Text id="integration.miLight.setup.connectedBridgesTitle" />
            </h3>
          </div>
          <div class="card-body">
            <div
              class={cx('dimmer', {
                active: props.miLightGetDevicesStatus === RequestStatus.Getting
              })}
            >
              <div class="loader" />
              <div class="dimmer-content">
                {props.miLightDeleteDeviceStatus === RequestStatus.Error && (
                  <p class="alert alert-danger">
                    <Text id="integration.miLight.setup.unknownError" />
                  </p>
                )}
                {props.miLightGetDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
                <div class="row">
                  {props.miLightBridgesDevices &&
                    props.miLightBridgesDevices.map((bridge, index) => (
                      <div class="col-md-4">
                        <div class="card">
                          <div class="card-header">
                            <h3 class="card-title">{bridge.name}</h3>
                          </div>
                          <div class="card-body">
                            <div class="form-group">
                              <label>
                                <Text id="integration.miLight.device.iplabel" />
                              </label>
                              <input type="text" value={bridge.params[0].value} class="form-control" disabled />
                            </div>
                            <div class="form-group">
                              <label>
                                <Text id="integration.miLight.device.modellabel" />
                              </label>
                              <input type="text" value={bridge.params[1].value} class="form-control" disabled />
                            </div>
                            <button class="btn btn-danger" onClick={disconnectBridge(props, bridge, index)}>
                              <Text id="integration.miLight.setup.disconnectButton" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                {props.miLightBridgesDevices && props.miLightBridgesDevices.length === 0 && (
                  <div>
                    <div style={{ marginTop: '20px', marginBottom: '20px', textAlign: 'center' }}>
                      <Text id="integration.miLight.setup.noBridgesConnected" />
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
            <Text id="integration.miLight.setup.bridgesOnNetwork" />
          </h3>
          <div class="page-options d-flex">
            <button
              class="btn btn-info"
              onClick={props.getBridges}
              disabled={props.miLightGetBridgesStatus === RequestStatus.Getting}
            >
              <i class="fe fe-radio" /> <Text id="integration.miLight.setup.scanButton" />
            </button>
          </div>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active:
                props.miLightGetBridgesStatus === RequestStatus.Getting ||
                props.miLightCreateDeviceStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              {props.miLightGetBridgesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
              {props.miLightBridges && props.miLightBridges.length === 0 && (
                <div class="col-md-12">
                  <div class="alert alert-info">
                    <Text id="integration.miLight.setup.noBridgesFound" />
                  </div>
                </div>
              )}
              {props.miLightCreateDeviceStatus === RequestStatus.Error && (
                <p class="alert alert-danger">
                  <Text id="integration.miLight.setup.unknownError" />
                </p>
              )}
              {props.miLightBridges &&
                props.miLightBridges.map(bridge => (
                  <div class="col-md-4">
                    <div class="card">
                      <div class="card-header">
                        <h3 class="card-title">{bridge.name}</h3>
                      </div>
                      <div class="card-body">
                        <div class="form-group">
                          <label>
                            <Text id="integration.miLight.device.iplabel" />
                          </label>
                          <input type="text" value={bridge.ip} class="form-control" disabled />
                        </div>
                        <div class="form-group">
                          <label>
                            <Text id="integration.miLight.device.modellabel" />
                          </label>
                          <input type="text" value={bridge.type} class="form-control" disabled />
                        </div>
                        <button class="btn btn-success" onClick={connectBridge(props, bridge)}>
                          <Text id="integration.miLight.setup.connectButton" />
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
