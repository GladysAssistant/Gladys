import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';

const RunningStatus = ({ zigbee2mqttStatus, toggleZ2M }) => (
  <Fragment>
    <div class="form-group">
      <label for="enableZigbee2mqtt" class="form-label">
        <Text id={`integration.zigbee2mqtt.setup.enableLabel`} />
      </label>
      <label class="custom-switch">
        <input
          type="checkbox"
          id="enableZigbee2mqtt"
          name="enableZigbee2mqtt"
          class="custom-switch-input"
          checked={zigbee2mqttStatus.z2mEnabled}
          onClick={toggleZ2M}
          disabled={
            !zigbee2mqttStatus.dockerBased || !zigbee2mqttStatus.networkModeValid || !zigbee2mqttStatus.usbConfigured
          }
        />
        <span class="custom-switch-indicator" />
        <span class="custom-switch-description">
          {!zigbee2mqttStatus.dockerBased && <Text id="integration.zigbee2mqtt.setup.nonDockerEnv" />}
          {zigbee2mqttStatus.dockerBased && !zigbee2mqttStatus.networkModeValid && (
            <Text id="integration.zigbee2mqtt.setup.invalidDockerNetwork" />
          )}
          {zigbee2mqttStatus.dockerBased && zigbee2mqttStatus.networkModeValid && (
            <Text id="integration.zigbee2mqtt.setup.enableZigbee2mqtt" />
          )}
        </span>
      </label>
    </div>
    <div class="card-header d-none d-sm-block">
      <h2 class="card-title">
        <Text id="integration.zigbee2mqtt.setup.serviceStatus" />
      </h2>
    </div>
    <div class="row justify-content-center">
      <div class="col-auto">
        <table class="table table-responsive table-borderless table-sm d-none d-sm-block">
          <thead class="text-center">
            <tr>
              <th class="text-center">
                <Text id="integration.zigbee2mqtt.setup.gladys" />
              </th>
              <th class="text-center" />
              <th class="text-center">{zigbee2mqttStatus.mqttExist && 'MQTT'}</th>
              <th class="text-center" />
              <th class="text-center">{zigbee2mqttStatus.zigbee2mqttExist && 'Zigbee2mqtt'}</th>
            </tr>
          </thead>
          <tbody class="text-center">
            <tr>
              <td class="text-center">
                <img src="/assets/icons/favicon-96x96.png" alt={`Gladys`} title={`Gladys`} width="80" height="80" />
              </td>
              {zigbee2mqttStatus.mqttRunning && (
                <td class={style.tdCenter}>
                  <hr class={style.line} />
                  <i
                    class={cx('fe', {
                      'fe-check': zigbee2mqttStatus.gladysConnected,
                      'fe-x': !zigbee2mqttStatus.gladysConnected,
                      greenIcon: zigbee2mqttStatus.gladysConnected,
                      redIcon: !zigbee2mqttStatus.gladysConnected
                    })}
                  />
                  <hr class={style.line} />
                </td>
              )}
              <td class="text-center">
                {zigbee2mqttStatus.mqttExist && (
                  <img
                    src="/assets/integrations/logos/logo_mqtt.png"
                    alt={`MQTT`}
                    title={`MQTT`}
                    width="80"
                    height="80"
                  />
                )}
              </td>
              {zigbee2mqttStatus.zigbee2mqttRunning && (
                <td class={('text-center', style.tdCenter)}>
                  <hr class={style.line} />
                  <i
                    class={cx('fe', {
                      'fe-check': zigbee2mqttStatus.zigbee2mqttConnected,
                      'fe-x': !zigbee2mqttStatus.zigbee2mqttConnected,
                      greenIcon: zigbee2mqttStatus.zigbee2mqttConnected,
                      redIcon: !zigbee2mqttStatus.zigbee2mqttConnected
                    })}
                  />
                  <hr class={style.line} />
                </td>
              )}
              <td class="text-center">
                {zigbee2mqttStatus.zigbee2mqttExist && (
                  <img
                    src="/assets/integrations/logos/logo_zigbee2mqtt.png"
                    alt={`Zigbee2mqtt`}
                    title={`Zigbee2mqtt`}
                    width="80"
                    height="80"
                  />
                )}
              </td>
            </tr>
            <tr>
              <td class="text-center">
                <div class="tag tag-success">
                  <Text id={`systemSettings.containerState.running`} />
                </div>
              </td>
              <td class="text-center" />
              <td class="text-center">
                {zigbee2mqttStatus.mqttRunning && (
                  <span class="tag tag-success">
                    <Text id={`systemSettings.containerState.running`} />
                  </span>
                )}
              </td>
              <td class="text-center" />
              <td class="text-center">
                {zigbee2mqttStatus.zigbee2mqttRunning && (
                  <span class="tag tag-success">
                    <Text id={`systemSettings.containerState.running`} />
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card-header d-sm-none">
      <h2 class="card-title">
        <Text id="integration.zigbee2mqtt.setup.containersStatus" />
      </h2>
    </div>
    <div class="row justify-content-center d-sm-none">
      <div class="col-auto">
        <table class="table table-responsive table-borderless table-sm">
          <thead class="text-center">
            <tr>
              <th>
                <Text id="systemSettings.containers" />
              </th>
              <th>
                <Text id="integration.zigbee2mqtt.setup.status" />
              </th>
            </tr>
          </thead>
          <tbody class="text-center">
            <tr>
              <td>
                <Text id="integration.zigbee2mqtt.setup.gladys" />
              </td>
              <td>
                <span class="tag tag-success">
                  <Text id={`systemSettings.containerState.running`} />
                </span>
              </td>
            </tr>
            <tr>
              <td>
                <Text id="integration.zigbee2mqtt.setup.mqtt" />
              </td>
              <td>
                {zigbee2mqttStatus.mqttRunning && (
                  <span class="tag tag-success">
                    <Text id={`systemSettings.containerState.running`} />
                  </span>
                )}
              </td>
            </tr>
            <tr>
              <td>
                <Text id="integration.zigbee2mqtt.setup.zigbee2Mqtt" />
              </td>
              <td>
                {zigbee2mqttStatus.zigbee2mqttRunning && (
                  <span class="tag tag-success">
                    <Text id={`systemSettings.containerState.running`} />
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card-header d-sm-none">
      <h2 class="card-title">
        <Text id="integration.zigbee2mqtt.setup.serviceStatus" />
      </h2>
    </div>
    <div class="row justify-content-center d-sm-none">
      <div class="col-auto">
        <table class="table table-responsive table-borderless table-sm">
          <thead class="text-center">
            <tr>
              <th>
                <Text id="integration.zigbee2mqtt.setup.link" />
              </th>
              <th>
                <Text id="integration.zigbee2mqtt.setup.status" />
              </th>
            </tr>
          </thead>
          <tbody class="text-center">
            <tr>
              <td>
                <Text id="integration.zigbee2mqtt.setup.gladysMqttLink" />
              </td>
              <td>
                {zigbee2mqttStatus.mqttRunning && (
                  <i
                    class={cx('fe', {
                      'fe-check': zigbee2mqttStatus.gladysConnected,
                      'fe-x': !zigbee2mqttStatus.gladysConnected,
                      greenIcon: zigbee2mqttStatus.gladysConnected,
                      redIcon: !zigbee2mqttStatus.gladysConnected
                    })}
                  />
                )}
              </td>
            </tr>
            <tr>
              <td>
                <Text id="integration.zigbee2mqtt.setup.mqttZigbeeLink" />
              </td>
              <td>
                {zigbee2mqttStatus.zigbee2mqttRunning && (
                  <i
                    class={cx('fe', {
                      'fe-check': zigbee2mqttStatus.zigbee2mqttConnected,
                      'fe-x': !zigbee2mqttStatus.zigbee2mqttConnected,
                      greenIcon: zigbee2mqttStatus.zigbee2mqttConnected,
                      redIcon: !zigbee2mqttStatus.zigbee2mqttConnected
                    })}
                  />
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </Fragment>
);

export default RunningStatus;
