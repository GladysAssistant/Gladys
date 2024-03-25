import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

const SetupTab = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">
          <Text id="integration.ecovacs.setup.title" />
        </h1>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.connectEcovacsStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <p>
              <Text id="integration.ecovacs.setup.ecovacsDescription" />
            </p>
            {props.connectEcovacsStatus === RequestStatus.Error && !props.ecovacsConnectionError && (
              <p class="alert alert-danger">
                <Text id="integration.ecovacs.setup.error" />
              </p>
            )}
            {props.connectEcovacsStatus === RequestStatus.Success && !props.ecovacsConnected && (
              <p class="alert alert-info">
                <Text id="integration.ecovacs.setup.connecting" />
              </p>
            )}
            {props.ecovacsConnected && (
              <p class="alert alert-success">
                <Text id="integration.ecovacs.setup.connected" />
              </p>
            )}
            {props.ecovacsConnectionError && (
              <p class="alert alert-danger">
                <Text id="integration.ecovacs.setup.connectionError" />
              </p>
            )}

            <form>
              <div class="form-group">
                <label for="ecovacsUsername" class="form-label">
                  <Text id={`integration.ecovacs.setup.userLabel`} />
                </label>
                <Localizer>
                  <input
                    name="ecovacsUsername"
                    placeholder={<Text id="integration.ecovacs.setup.userPlaceholder" />}
                    value={props.ecovacsUsername}
                    class="form-control"
                    onInput={props.updateConfiguration}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="ecovacsPassword" class="form-label">
                  <Text id={`integration.ecovacs.setup.passwordLabel`} />
                </label>
                <Localizer>
                  <input
                    name="ecovacsPassword"
                    type="password"
                    placeholder={<Text id="integration.ecovacs.setup.passwordPlaceholder" />}
                    value={props.ecovacsPassword}
                    class="form-control"
                    onInput={props.updateConfiguration}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="ecovacsCountry" class="form-label">
                  <Text id={`integration.ecovacs.setup.countryCodeLabel`} />
                </label>
                <Localizer>
                  <input
                    name="ecovacsCountryCode"
                    placeholder={<Text id="integration.ecovacs.setup.countryPlaceholder" />}
                    value={props.ecovacsCountryCode}
                    class="form-control"
                    onInput={props.updateConfiguration}
                  />
                </Localizer>
              </div>

              <div class="row mt-5">
                <div class="col">
                  <button type="submit" class="btn btn-success" onClick={props.saveConfiguration}>
                    <Text id="integration.ecovacs.setup.saveLabel" />
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
