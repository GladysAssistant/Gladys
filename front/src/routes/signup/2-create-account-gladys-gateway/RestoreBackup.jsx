import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../utils/consts';
import RestoreBackupRow from './RestoreBackupRow';

const GatewayPage = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h2 class="page-title">
        <Text id="signup.gatewayBackup.title" />
      </h2>
    </div>
    <div
      class={cx('dimmer', {
        active: props.gatewayGetBackupsStatus === RequestStatus.Getting
      })}
    >
      <div class="loader" />
      <div class="dimmer-content">
        <div class="card-body">
          <p>
            <Text id="signup.gatewayBackup.description" />
          </p>
          {props.gatewayGetBackupsStatus === RequestStatus.Success && props.gatewayBackups.length === 0 && (
            <div class="alert alert-warning mb-0">
              <Text id="signup.gatewayBackup.noBackupsFound" />
            </div>
          )}
          {props.gatewayGetBackupsStatus === RequestStatus.Error && (
            <div class="alert alert-danger mb-0">
              <Text id="signup.gatewayBackup.error" />
            </div>
          )}
        </div>
        {props.gatewayBackups && props.gatewayBackups.length > 0 && (
          <div class="table-responsive-lg">
            <table class="table table-hover table-outline table-vcenter text-nowrap card-table">
              <thead>
                <tr>
                  <th>
                    <Text id="gatewayBackup.createdAtColumn" />
                  </th>
                  <th>
                    <Text id="gatewayBackup.sizeColumn" />
                  </th>
                  <th class="text-right">
                    <Text id="gatewayBackup.restoreColumn" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {props.gatewayBackups.map(backup => (
                  <RestoreBackupRow backup={backup} user={props.user} restoreBackup={props.restoreBackup} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div class="card-footer d-flex">
          <button class="btn btn-secondary" onClick={props.changeStepToUpdateRestoreKey}>
            <Text id="signup.gatewayBackup.changeKeyButton" />
          </button>
          <button class="btn btn-outline-primary ml-auto" onClick={props.getBackups}>
            <Text id="signup.gatewayBackup.refreshButton" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default GatewayPage;
