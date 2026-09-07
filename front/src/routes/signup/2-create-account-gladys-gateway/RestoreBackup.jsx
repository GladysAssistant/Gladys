import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../utils/consts';
import RestoreBackupRow from './RestoreBackupRow';
import style from '../style.css';

// Pill rows instead of a table (same grammar as the settings containers
// card): date + size stack on the left, the restore action sits on the
// right — no horizontal overflow in the narrow auth column.
const RestoreBackup = ({ children, ...props }) => (
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
          {props.gatewayGetBackupsStatus === RequestStatus.Success &&
            props.gatewayBackups &&
            props.gatewayBackups.length === 0 && (
              <div class="alert alert-warning mb-0">
                <Text id="signup.gatewayBackup.noBackupsFound" />
              </div>
            )}
          {props.gatewayGetBackupsStatus === RequestStatus.Error && (
            <div class="alert alert-danger mb-0">
              <Text id="signup.gatewayBackup.error" />
            </div>
          )}
          {props.gatewayBackups && props.gatewayBackups.length > 0 && (
            <div class={style.backupList}>
              {props.gatewayBackups.map(backup => (
                <RestoreBackupRow
                  key={backup.id}
                  backup={backup}
                  user={props.user}
                  restoreBackup={props.restoreBackup}
                />
              ))}
            </div>
          )}
        </div>
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

export default RestoreBackup;
