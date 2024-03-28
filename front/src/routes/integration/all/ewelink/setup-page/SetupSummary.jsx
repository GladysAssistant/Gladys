import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

const SetupSummary = ({ ewelinkStatus = {}, enableEditionMode, disabled, connectUser, disconnectUser }) => {
  const { configured, connected } = ewelinkStatus;

  return (
    <div class="d-flex flex-column">
      <div class="d-flex justify-content-between align-items-center">
        <div class="icon mr-3">
          <i
            class={cx('fe', {
              'fe-check-circle text-success': configured,
              'fe-x-circle text-danger': !configured
            })}
            data-cy="ewelink-setup-summary-application-icon"
          />
        </div>
        <Text id="integration.eWeLink.setup.applicationSetupLabel" />
        <button
          class="btn btn-primary btn-sm ml-auto"
          onClick={enableEditionMode}
          disabled={disabled}
          data-cy="ewelink-setup-summary-application-button"
        >
          <Text id="global.edit" />
        </button>
      </div>
      <div class="d-flex justify-content-between align-items-center mt-3">
        <div class="icon mr-3">
          <i
            class={cx('fe', {
              'fe-check-circle text-success': connected,
              'fe-x-circle text-danger': !connected
            })}
            data-cy="ewelink-setup-summary-user-icon"
          />
        </div>
        {connected && (
          <Fragment>
            <Text id="integration.eWeLink.setup.userConnectedLabel" />
            <button
              onClick={disconnectUser}
              disabled={disabled}
              class="btn btn-sm btn-danger ml-auto"
              data-cy="ewelink-setup-summary-user-disconnect"
            >
              <Text id="integration.eWeLink.setup.disconnectLabel" />
            </button>
          </Fragment>
        )}
        {!connected && (
          <Fragment>
            <Text id="integration.eWeLink.setup.userNotConnectedLabel" />
            <div class="ml-auto">
              {configured && (
                <button
                  onClick={connectUser}
                  disabled={disabled}
                  class="btn btn-sm btn-success ml-auto"
                  data-cy="ewelink-setup-summary-user-connect"
                >
                  <Text id="integration.eWeLink.setup.connectLabel" />
                </button>
              )}
            </div>
          </Fragment>
        )}
      </div>
    </div>
  );
};

export default SetupSummary;
