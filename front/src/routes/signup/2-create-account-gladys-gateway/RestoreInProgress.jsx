import { Text } from 'preact-i18n';

const GatewayPage = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h2 class="page-title">
        <Text id="gatewayBackup.title" />
      </h2>
    </div>
    <div class="card-body">
      <p>
        <Text id="gatewayBackup.description" />
      </p>
    </div>
    <div class={props.loading ? 'dimmer active' : 'dimmer'}>
      <div class="loader" />
      <div class="dimmer-content">{props.loading && <div style={{ height: '10rem' }} />}</div>
    </div>
  </div>
);

export default GatewayPage;
