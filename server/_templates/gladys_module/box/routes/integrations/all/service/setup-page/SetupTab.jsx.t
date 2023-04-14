---
to: ../front/src/routes/integration/all/<%= module %>/setup-page/SetupTab.jsx
---
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

const SetupTab = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">
          <Text id="integration.<%= module %>.setup.title" />
        </h1>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.<%= attributeName %>ConnectionStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <p>
              <Text id="integration.<%= module %>.setup.<%= attributeName %>Description" />
            </p>
            {props.<%= attributeName %>ConnectionsStatus === RequestStatus.Error && !props.<%= attributeName %>ConnectionError && (
              <p class="alert alert-danger">
                <Text id="integration.<%= module %>.setup.error" />
              </p>
            )}
            {props.<%= attributeName %>ConnectionStatus === RequestStatus.Success && !props.<%= attributeName %>Connected && (
              <p class="alert alert-info">
                <Text id="integration.<%= module %>.setup.connecting" />
              </p>
            )}
            {props.<%= attributeName %>Connected && (
              <p class="alert alert-success">
                <Text id="integration.<%= module %>.setup.connected" />
              </p>
            )}
            {props.<%= attributeName %>ConnectionError && (
              <p class="alert alert-danger">
                <Text id="integration.<%= module %>.setup.connectionError" />
              </p>
            )}

            <form>
              <div class="form-group">
                <label for="<%= attributeName %>Username" class="form-label">
                  <Text id={`integration.<%= module %>.setup.userLabel`} />
                </label>
                <Localizer>
                  <input
                    name="<%= attributeName %>Username"
                    placeholder={<Text id="integration.<%= module %>.setup.userPlaceholder" />}
                    value={props.<%= attributeName %>Username}
                    class="form-control"
                    onInput={props.updateConfiguration}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="<%= attributeName %>Password" class="form-label">
                  <Text id={`integration.<%= module %>.setup.passwordLabel`} />
                </label>
                <Localizer>
                  <input
                    name="<%= attributeName %>Password"
                    type="password"
                    placeholder={<Text id="integration.<%= module %>.setup.passwordPlaceholder" />}
                    value={props.<%= attributeName %>Password}
                    class="form-control"
                    onInput={props.updateConfiguration}
                  />
                </Localizer>
              </div>

              <div class="row mt-5">
                <div class="col">
                  <button type="submit" class="btn btn-success" onClick={props.saveConfiguration}>
                    <Text id="integration.<%= module %>.setup.saveLabel" />
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