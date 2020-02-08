import { Text } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';

const SettingsTab = ({ children, ...props }) => (
<div class="page">
  <div class="card">
    <div class="card-header">
      <h2 class="card-title">
        <Text id="integration.rflink.settings.title" />
      </h2>
      <div class="page-options d-flex">
        <button class="btn btn-info" onClick={props.getUsbPorts}>
          <Text id="integration.rflink.settings.refreshButton" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.loading
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {get(props, 'rflinkStatus.connected') && (
            <div class="alert alert-success">
              <Text id="integration.rflink.settings.connectedWithSuccess" />
            </div>
          )}
          {!get(props, 'rflinkStatus.connected') && (
            <div class="alert alert-warning">
              <Text id="integration.rflink.settings.notConnected" />
            </div>
          )}
          {props.rflinkConnectionInProgress && (
            <div class="alert alert-info">
              <Text id="integration.rflink.settings.connecting" />
            </div>
          )}
          {props.rflinkFailed && (
            <div class="alert alert-danger">
              <Text id="integration.rflink.settings.driverFailedError" />
            </div>
          )}
          <p>
            <Text id="integration.rflink.settings.description" />
          </p>
          <div class="form-group">
            <label class="form-label">
              <Text id="integration.rflink.settings.rflinkUsbDriverPathLabel" />
            </label>
            <select class="form-control" onChange={props.updateRflinkPath}>
              <option>
                <Text id="global.emptySelectOption" />
              </option>
              {props.usbPorts &&
                props.usbPorts.map(usbPort => (
                  <option value={usbPort.comPath} selected={props.RflinkPath === usbPort.comPath}>
                    {usbPort.comName}
                  </option>
                ))}
            </select>
          </div>
          <div class="form-group">
            <button class="btn btn-success" onClick={props.saveDriverPathAndConnect}>
              <Text id="integration.rflink.settings.connectButton" />
            </button>
            <button class="btn btn-danger ml-2" onClick={props.disconnect}>
              <Text id="integration.rflink.settings.disconnectButton" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>






  <div class="card">
    <div class="card-header">
      <h2 class="card-title">
        <Text id="integration.rflink.settings.milight.title" />
      </h2>
      <div class="page-options d-flex">
        <button class="btn btn-success" onClick={props.pair}>
        <Text id="integration.rflink.settings.milight.pairButton" />
      </button>
      <button class="btn btn-danger ml-2" onClick={props.unpair}>
        <Text id="integration.rflink.settings.milight.unpairButton" />
      </button>
    </div>
    </div>
  </div>
</div>
);

export default SettingsTab;
