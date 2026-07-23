import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';

const LogsTab = ({ logs, logsStatus, getLogs, subContainers = [], selectedContainer, selectContainer }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.externalIntegration.logs.title" />
      </h1>
      <div class="card-options">
        {subContainers.length > 0 && (
          <Localizer>
            <select
              class="form-control form-control-sm custom-select w-auto mr-2"
              value={selectedContainer}
              onChange={selectContainer}
              aria-label={<Text id="integration.externalIntegration.logs.containerSelectLabel" />}
            >
              <option value="main">
                <Text id="integration.externalIntegration.logs.mainContainerOption" />
              </option>
              {subContainers.map(name => (
                <option value={name}>{name}</option>
              ))}
            </select>
          </Localizer>
        )}
        <button
          class="btn btn-outline-primary btn-sm"
          onClick={getLogs}
          disabled={logsStatus === RequestStatus.Getting}
        >
          <i class="fe fe-refresh-cw mr-1" />
          <Text id="integration.externalIntegration.logs.refreshButton" />
        </button>
      </div>
    </div>
    <div class="card-body">
      {logsStatus === RequestStatus.Error && (
        <div class="alert alert-danger">
          <Text id="integration.externalIntegration.logs.error" />
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
              <Text id="integration.externalIntegration.logs.empty" />
            </div>
          )}
          {logs && <pre class={style.logs}>{logs}</pre>}
        </div>
      </div>
    </div>
  </div>
);

export default LogsTab;
