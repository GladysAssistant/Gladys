import { Text } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';
import { STATE } from '../../../../../../../server/utils/constants';

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
      </div>
      <div class="card-body">

      <div class="page-options d-flex">
      <div class="form-group">
      <Text id="integration.rflink.settings.milight.about" />
      <div class="gatewayBar mb-2 mt-2">
        <Text id="integration.rflink.settings.milight.gatewayBarinfo" />
            <input
              type="text"
              class="form-control mb-2"
              value={props.currentMilightGateway}
              placeholder={props.currentMilightGateway}
              onInput={props.updateMilight}
            />
            <Text id="integration.rflink.settings.milight.zoneInfo" />
            <select class="form-control" onChange={props.updateZone}> 
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
            
            </select>
              
          </div>
          
        
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





    <div class="card">
    <div class="card-header">
      <h2 class="card-title">
        <Text id="integration.rflink.settings.debug.title" />
      </h2>
      </div>
      <div class="card-body">
        <Text class="mb-2" id="integration.rflink.settings.debug.info" />
          <div class="mt-2 alert alert-dark ">
             <p>
               {
                 
                 `>          ${get(props, 'rflinkStatus.lastCommand')} \n` 
               }
               </p>
          </div>
    </div>
    </div>
  </div>
);

export default SettingsTab;
