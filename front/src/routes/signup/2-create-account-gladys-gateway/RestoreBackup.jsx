import { Text } from 'preact-i18n';

import RestoreBackupRow from './RestoreBackupRow';

const GatewayPage = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h2 class="page-title">
        <Text id="signup.gatewayBackup.title" />
      </h2>
    </div>
    <div class="card-body">
      <p>
        <Text id="signup.gatewayBackup.description" />
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
              <RestoreBackupRow backup={backup} user={props.user} restoreBackup={props.restoreBackup} />
            ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default GatewayPage;
