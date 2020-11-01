import { Text } from 'preact-i18n';
import cx from 'classnames';
import { Link } from 'preact-router/match';

import { RequestStatus } from '../../../../../utils/consts';
import CheckMqttPanel from '../../mqtt/commons/CheckMqttPanel';
import TasmotaDeviceBox from '../TasmotaDeviceBox';
import IntegrationDeviceListOptions from '../../../../../components/integration/IntegrationDeviceListOptions';
import IntegrationEmptyState from '../../../../../components/integration/IntegrationEmptyState';

const DeviceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.tasmota.device.title" />
      </h1>
      <div class="page-options d-flex">
        <IntegrationDeviceListOptions changeOrderDir={props.changeOrderDir} debouncedSearch={props.debouncedSearch} />
      </div>
    </div>
    <div class="card-body">
      <CheckMqttPanel />

      <div
        class={cx('dimmer', {
          active: props.getTasmotaStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content deviceList">
          <div class="row">
            {props.tasmotaDevices &&
              props.tasmotaDevices.length > 0 &&
              props.tasmotaDevices.map((device, index) => (
                <TasmotaDeviceBox
                  {...props}
                  editable
                  saveButton
                  deleteButton
                  editButton
                  device={device}
                  deviceIndex={index}
                  listName="tasmotaDevices"
                />
              ))}
            {(!props.tasmotaDevices || props.tasmotaDevices.length === 0) && (
              <IntegrationEmptyState>
                <Text id="integration.tasmota.device.noDeviceFound" />

                <div class="mt-5">
                  <Text id="integration.tasmota.discoverDeviceDescr" />
                  <Link href="/dashboard/integration/device/tasmota/discover">
                    <button class="btn btn-outline-primary ml-2">
                      <Text id="integration.tasmota.discoverTab" /> <i class="fe fe-radio" />
                    </button>
                  </Link>
                </div>
              </IntegrationEmptyState>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DeviceTab;
