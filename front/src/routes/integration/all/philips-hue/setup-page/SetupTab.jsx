import { Component } from 'preact';
import { MarkupText, Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';

class SetupTab extends Component {
  disconnectBridge = (props, device, index) => () => {
    props.deleteDevice(device, index);
  };

  connectBridge = (props, device) => () => {
    props.connectBridge(device);
  };

  setmanualBridgeConfiguration = ipaddress => {
    this.setState({ manualBridgeConfiguration: { ipaddress: ipaddress.target.value } });
  };

  render(props) {
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
                              <button class="btn btn-danger" onClick={this.disconnectBridge(props, bridge, index)}>
                                <Text id="integration.philipsHue.setup.disconnectButton" />
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
                    <div class="col-md-6">
                      <div class="card">
                        <div class="card-header">
                          <h3 class="card-title">
                            <Text id="integration.philipsHue.setup.manualConfiguration.title" />
                          </h3>
                        </div>
                        <div class="card-body">
                          <div class="form-group">
                            <Text id="integration.philipsHue.setup.manualConfiguration.text" />
                          </div>
                          <div class="form-group">
                            <Localizer>
                              <input
                                id="manualConfiguration"
                                type="text"
                                class="form-control"
                                onChange={this.setmanualBridgeConfiguration}
                                placeholder={<Text id="integration.philipsHue.setup.manualConfiguration.input" />}
                              />
                            </Localizer>
                          </div>
                          <div class="form-group">
                            <button
                              class="btn btn-success"
                              onClick={this.connectBridge(props, this.state.manualBridgeConfiguration)}
                            >
                              <Text id="integration.philipsHue.setup.connectButton" />
                            </button>
                          </div>
                        </div>
                      </div>
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
                          <button class="btn btn-success" onClick={this.connectBridge(props, bridge)}>
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
  }
}

export default SetupTab;
