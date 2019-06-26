import { Text } from 'preact-i18n';
import style from './style.css';

const GatewayRestoreInProgress = ({ children, ...props }) => (
  <div class="card">
    <h2 class="card-header">
      <Text id="gatewayBackup.restoreInProgressTitle" />
    </h2>
    <div class="card-body">
      <div class="dimmer active">
        <div class="loader" />
        <div class="dimmer-content">
          <div class={style.divLoading} />
        </div>
      </div>
    </div>
  </div>
);

export default GatewayRestoreInProgress;
