import { Text } from 'preact-i18n';

const GatewayNotConfigured = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h2 class="page-title">
        <Text id="gatewayBackup.title" />
      </h2>
    </div>
    <div class="card-body">
      <Text id="gatewayBackup.notConfigured" />
    </div>
  </div>
);

export default GatewayNotConfigured;
