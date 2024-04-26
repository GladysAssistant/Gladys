import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

const SetupTab = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">
          <Text id="integration.eWeLink.setup.title" />
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
              <Text id="integration.eWeLink.setup.eweLinkDescription" />
            </p>
            <p class="alert alert-danger">
              <MarkupText id="integration.eWeLink.setup.ewelinkIntegrationDeprecated" />
            </p>
            {props.connectEweLinkStatus === RequestStatus.Error && !props.eweLinkConnectionError && (
              <p class="alert alert-danger">
                <Text id="integration.eWeLink.setup.error" />
              </p>
            )}
            {props.connectEweLinkStatus === RequestStatus.Success && !props.eweLinkConnected && (
              <p class="alert alert-info">
                <Text id="integration.eWeLink.setup.connecting" />
              </p>
            )}
            {props.eweLinkConnected && (
              <p class="alert alert-success">
                <Text id="integration.eWeLink.setup.connected" />
              </p>
            )}
            {props.eweLinkConnectionError && (
              <p class="alert alert-danger">
                <Text id="integration.eWeLink.setup.connectionError" />
              </p>
            )}

            <form>
              <div class="form-group">
                <label for="eweLinkUsername" class="form-label">
                  <Text id={`integration.eWeLink.setup.userLabel`} />
                </label>
                <Localizer>
                  <input
                    name="eweLinkUsername"
                    placeholder={<Text id="integration.eWeLink.setup.userPlaceholder" />}
                    value={props.eweLinkUsername}
                    class="form-control"
                    onInput={props.updateConfigration}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="eweLinkPassword" class="form-label">
                  <Text id={`integration.eWeLink.setup.passwordLabel`} />
                </label>
                <Localizer>
                  <input
                    name="eweLinkPassword"
                    type="password"
                    placeholder={<Text id="integration.eWeLink.setup.passwordPlaceholder" />}
                    value={props.eweLinkPassword}
                    class="form-control"
                    onInput={props.updateConfigration}
                  />
                </Localizer>
              </div>

              <div class="row mt-5">
                <div class="col">
                  <button type="submit" class="btn btn-success" onClick={props.saveConfiguration}>
                    <Text id="integration.eWeLink.setup.saveLabel" />
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
