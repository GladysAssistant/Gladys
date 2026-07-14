import { Text } from 'preact-i18n';
import cx from 'classnames';

import Modal from '../components/Modal';
import modalStyle from '../components/modal.css';
import { RequestStatus } from '../../../../../utils/consts';

const LogsModal = ({ logs, logsStatus, getLogs, closeLogs }) => (
  <Modal title={<Text id="integration.externalIntegration.supervision.logsTitle" />} onClose={closeLogs} large>
    <div class="card-body">
      {logsStatus === RequestStatus.Error && (
        <div class="alert alert-danger">
          <Text id="integration.externalIntegration.supervision.logsError" />
        </div>
      )}
      <div
        class={cx('dimmer', {
          active: logsStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          {logsStatus === RequestStatus.Success && !logs && (
            <div class="text-muted">
              <Text id="integration.externalIntegration.supervision.logsEmpty" />
            </div>
          )}
          {logs && <pre class={modalStyle.modalLogs}>{logs}</pre>}
        </div>
      </div>
    </div>
    <div class="card-footer text-right">
      <button class="btn btn-outline-primary mr-2" onClick={getLogs} disabled={logsStatus === RequestStatus.Getting}>
        <i class="fe fe-refresh-cw mr-1" />
        <Text id="integration.externalIntegration.supervision.logsRefreshButton" />
      </button>
      <button class="btn btn-secondary" onClick={closeLogs}>
        <Text id="integration.externalIntegration.supervision.logsCloseButton" />
      </button>
    </div>
  </Modal>
);

export default LogsModal;
