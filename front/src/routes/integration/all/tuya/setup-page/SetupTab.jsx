import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

const SetupTab = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">
          <Text id="integration.tuya.setup.title" />
        </h1>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.connectEweLinkStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <p>
              <Text id="integration.tuya.setup.description" />
            </p>

            <form>
              <div class="form-group">
                <label for="tuyaEndpoint" class="form-label">
                  <Text id={`integration.tuya.setup.endpoint`} />
                </label>
                <select className="form-control" name="tuyaEndpoint" value={props.tuyaEndpoint}
                  onChange={props.updateConfiguration}>
                  <option value="china">
                    <Text id="integration.tuya.setup.endpoints.china"/>
                  </option>
                  <option value="westernAmerica">
                    <Text id="integration.tuya.setup.endpoints.westernAmerica"/>
                  </option>
                  <option value="easternAmerica">
                    <Text id="integration.tuya.setup.endpoints.easternAmerica"/>
                  </option>
                  <option value="centralEurope">
                    <Text id="integration.tuya.setup.endpoints.centralEurope"/>
                  </option>
                  <option value="westernEurope">
                    <Text id="integration.tuya.setup.endpoints.westernEurope"/>
                  </option>
                  <option value="india">
                    <Text id="integration.tuya.setup.endpoints.india"/>
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="tuyaAccessKey" class="form-label">
                  <Text id={`integration.tuya.setup.accessKey`} />
                </label>
                <Localizer>
                  <input
                    name="tuyaAccessKey"
                    type="text"
                    placeholder={<Text id="integration.tuya.setup.accessKeyPlaceholder" />}
                    value={props.tuyaAccessKey}
                    class="form-control"
                    onInput={props.updateConfiguration}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label htmlFor="tuyaSecretKey" className="form-label">
                  <Text id={`integration.tuya.setup.secretKey`} />
                </label>
                <Localizer>
                  <input
                    name="tuyaSecretKey"
                    type="text"
                    placeholder={<Text id="integration.tuya.setup.secretKeyPlaceholder" />}
                    value={props.tuyaSecretKey}
                    className="form-control"
                    onInput={props.updateConfiguration}
                  />
                </Localizer>
              </div>

              <div class="row mt-5">
                <div class="col">
                  <button type="submit" class="btn btn-success" onClick={props.saveTuyaConfiguration}>
                    <Text id="integration.tuya.setup.saveLabel" />
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
