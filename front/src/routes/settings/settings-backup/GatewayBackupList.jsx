import { Text } from 'preact-i18n';
import { RequestStatus } from '../../../utils/consts';

import GatewayBackupRow from './GatewayBackupRow';

const GatewayPage = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h2 class="page-title">
        <Text id="gatewayBackup.title" />
      </h2>
      <div class="page-options d-flex">
        {props.gatewayCreateBackupStatus === RequestStatus.Success ? (
          <Text id="gatewayBackup.backupStarted" />
        ) : (
          <button class="btn btn-success" onClick={props.createBackup}>
            <Text id="gatewayBackup.backupNowButton" />
          </button>
        )}
      </div>
    </div>
    <div class="card-body">
      {props.gatewayRestoreErrored && (
        <div class="alert alert-danger" role="alert">
          <Text id="gatewayBackup.restoreFailed" />
        </div>
      )}
      <p>
        <Text id="gatewayBackup.description" />
      </p>
    </div>
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
          {props.gatewayBackups &&
            props.gatewayBackups.map(backup => (
              <GatewayBackupRow backup={backup} user={props.user} restoreBackup={props.restoreBackup} />
            ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default GatewayPage;
