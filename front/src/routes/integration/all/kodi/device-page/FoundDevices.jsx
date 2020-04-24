import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';
import Device from './Device';

const FoundDevices = ({ children, user, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.kodi.device.deviceOnNetworkTitle" />
      </h1>
      <div class="page-options d-flex">
        <button onClick={props.addKodi} class="btn btn-outline-primary ml-2">
          <Text id="integration.kodi.new" /> <i class="fe fe-plus" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.getKodiDevicesStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {props.getKodiDevicesStatus === RequestStatus.Getting && <div class={style.emptyDiv} />}
          <div class="row">
            {props.kodiDevices &&
              props.kodiDevices.map((device, index) => (
                <Device
                  device={device}
                  deviceIndex={index}
                  houses={props.houses}
                  updateDeviceProperty={props.updateDeviceProperty}
                  updateParamProperty={props.updateParamProperty}
                  saveDevice={props.saveDevice}
                  deleteDevice={props.deleteDevice}
                  testConnection={props.testConnection}
                />
              ))}
            {props.kodiDevices && props.kodiDevices.length === 0 && (
              <div class="col-md-12">
                <div class="alert alert-info">
                  <Text id="integration.kodi.device.noDevicesFound" />
                </div>
                <div class="alert alert-info">
                  <Text id="integration.kodi.device.beforeAddingDevice" />
                  {user.language === 'fr' && <img class="card-img-top" src="/assets/images/kodi/kodi-config-fr.jpg" />}
                  {user.language !== 'fr' && <img class="card-img-top" src="/assets/images/kodi/kodi-config-en.jpg" />}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default FoundDevices;
