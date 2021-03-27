import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import RemoteCreation from './RemoteCreation';

const RemoteSetupTab = props => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        {(props.device && props.device.name) || <Text id="integration.broadlink.setup.noNameLabel" />}
      </h3>
    </div>
    <div
      class={cx('dimmer', {
        active: props.loading
      })}
    >
      <div class="loader" />
      <div class="dimmer-content">
        <div class="card-body">
          {props.saveStatus && (
            <div class="alert alert-danger">
              <Text id="integration.broadlink.setup.saveError" />
            </div>
          )}
          {!props.loading && !props.device && (
            <div>
              <p class="alert alert-danger">
                <Text id="integration.broadlink.setup.notFound" />
              </p>
              <Link href="/dashboard/integration/device/broadlink">
                <button type="button" class="btn btn-outline-secondary btn-sm">
                  <Text id="global.backButton" />
                </button>
              </Link>
            </div>
          )}

          {props.device && <RemoteCreation {...props} />}

          {props.device && (
            <div class="form-group">
              <Link href="/dashboard/integration/device/broadlink" class="mr-2">
                <button class="btn btn-danger">
                  <Text id="integration.broadlink.setup.cancel" />
                </button>
              </Link>
              <button
                onClick={props.saveDevice}
                disabled={!props.buttons || !props.device.name || props.device.name.length === 0}
                class="btn btn-success mr-2"
              >
                <Text id="integration.broadlink.setup.saveButton" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default RemoteSetupTab;
