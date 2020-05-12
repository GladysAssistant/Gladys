import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';

const SetupTab = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.heatzy.setup.title" />
        </h3>
      </div>
      <div class="card-body">
        { <div
          class={cx('dimmer', {
            active: props.connectHeatzyStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <p>
              <MarkupText id="integration.heatzy.setup.heatzyDescription" />
            </p>
            {props.connectHeatzyStatus === RequestStatus.Error && (
              <p class="alert alert-danger">
                <Text id="integration.heatzy.setup.error" />
              </p>
            )}
            {props.connectHeatzyStatus === RequestStatus.Success && !props.heatzyConnected && (
              <p class="alert alert-info">
                <Text id="integration.heatzy.setup.connecting" />
              </p>
            )}
            {props.heatzyConnected && (
              <p class="alert alert-success">
                <Text id="integration.heatzy.setup.connected" />
              </p>
            )}
            {props.heatzyConnectionError && (
              <p class="alert alert-danger">
                <Text id="integration.heatzy.setup.connectionError" />
              </p>
            )}
            <form>
              <div class="form-group">
                <label for="heatzyLogin" class="form-label">
                  <Text id={`integration.heatzy.setup.userLabel`} />
                </label>
                <Localizer>
                  <input
                    name="heatzyLogin"
                    placeholder={<Text id="integration.heatzy.setup.userPlaceholder" />}
                    value={props.heatzyLogin}
                    class="form-control"
                    onInput={props.updateConfigration}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="heatzyPassword" class="form-label">
                  <Text id={`integration.heatzy.setup.passwordLabel`} />
                </label>
                <Localizer>
                  <input
                    name="heatzyPassword"
                    type="password"
                    placeholder={<Text id="integration.heatzy.setup.passwordPlaceholder" />}
                    value={props.heatzyPassword}
                    class="form-control"
                    onInput={props.updateConfigration}
                  />
                </Localizer>
              </div>

              <div class="row mt-5">
                <div class="col">
                  <button type="submit" class="btn btn-success" onClick={props.saveConfiguration}>
                    <Text id="integration.heatzy.setup.saveLabel" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div> }
      </div>
    </div>
  );
};

export default SetupTab;
