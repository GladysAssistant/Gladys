import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

const SetupTab = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.mqtt.setup.title" />
        </h3>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.mqttStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <form>
              <div class="form-group">
                <label for="mqttURL" class="form-label">
                  <Text id={`integration.mqtt.setup.urlLabel`} />
                </label>
                <Localizer>
                  <input
                    name="mqttURL"
                    placeholder={<Text id="integration.mqtt.setup.urlPlaceholder" />}
                    value={props.mqttURL}
                    onChange={e => updateConfig(e, 'mqttURL')}
                    class="form-control"
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="mqttUser" class="form-label">
                  <Text id={`integration.mqtt.setup.userLabel`} />
                </label>
                <Localizer>
                  <input
                    name="mqttUser"
                    placeholder={<Text id="integration.mqtt.setup.userPlaceholder" />}
                    value={props.mqttURL}
                    onChange={e => updateConfig(e, 'mqttUser')}
                    class="form-control"
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="mqttPass" class="form-label">
                  <Text id={`integration.mqtt.setup.passwordLabel`} />
                </label>
                <Localizer>
                  <input
                    name="mqttPass"
                    placeholder={<Text id="integration.mqtt.setup.passwordPlaceholder" />}
                    value={props.mqttURL}
                    onChange={e => updateConfig(e, 'mqttPass')}
                    class="form-control"
                  />
                </Localizer>
              </div>

              <div class="row mt-10">
                <div class="col">
                  <button type="submit" class="btn btn-success" onClick={this.saveConfig}>
                    <Text id="integration.mqtt.setup.saveLabel" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupTab;
