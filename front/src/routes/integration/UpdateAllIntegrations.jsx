import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

import { RequestStatus } from '../../utils/consts';
import style from './style.css';

// the outcome of the last "Update all" run: every update went through, or the
// list of the ones that failed, each linking to its supervision screen where
// the logs and the update button of that one integration live
const UpdateAllResult = ({ result }) => {
  if (result.failed.length === 0) {
    return (
      <div class="alert alert-success" role="status">
        <i class="fe fe-check-circle mr-2" />
        <Text id="integration.root.updateAll.success" fields={{ total: result.total }} plural={result.total} />
      </div>
    );
  }
  return (
    <div class="alert alert-warning" role="alert">
      <i class="fe fe-alert-triangle mr-2" />
      <Text
        id="integration.root.updateAll.failed"
        fields={{ failed: result.failed.length, total: result.total }}
        plural={result.failed.length}
      />
      <ul class="mb-0 mt-2">
        {result.failed.map(integration => (
          <li key={integration.selector}>
            <Link href={`/dashboard/integration/device/external/${integration.selector}/supervision`}>
              {integration.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

// one-click update of every installed community integration having a newer
// version: the existing per-integration update is called for each of them,
// one after the other, so that a single image pull and container restart
// runs at a time and each failure is reported on its own integration
const UpdateAllIntegrations = ({ integrationsToUpdateCount, status, progress, result, onUpdateAll }) => {
  const running = status === RequestStatus.Getting && progress;
  return (
    <div>
      {!running && result && <UpdateAllResult result={result} />}
      {running && (
        <div class="card">
          <div class="card-body">
            <div class="d-flex align-items-center mb-3">
              <i class="fe fe-refresh-cw text-primary mr-2" />
              <strong>
                <Text
                  id="integration.root.updateAll.progress"
                  fields={{ name: progress.name, current: progress.current, total: progress.total }}
                />
              </strong>
            </div>
            <div class="progress progress-sm">
              <div
                class="progress-bar bg-primary"
                style={{ width: `${Math.round(((progress.current - 1) / progress.total) * 100)}%` }}
                role="progressbar"
                aria-valuenow={progress.current - 1}
                aria-valuemin="0"
                aria-valuemax={progress.total}
              />
            </div>
            <div class="text-muted small mt-2">
              <Text id="integration.root.updateAll.keepPageOpen" />
            </div>
          </div>
        </div>
      )}
      {!running && integrationsToUpdateCount > 0 && (
        <div class="card">
          <div class={`card-body ${style.updateAllBody}`}>
            <div class={style.updateAllIcon}>
              <i class="fe fe-arrow-up-circle" />
            </div>
            <div class={style.updateAllText}>
              <strong>
                <Text
                  id="integration.root.updateAll.title"
                  fields={{ count: integrationsToUpdateCount }}
                  plural={integrationsToUpdateCount}
                />
              </strong>
              <div class="text-muted small">
                <Text id="integration.root.updateAll.description" />
              </div>
            </div>
            <button type="button" class={`btn btn-primary ${style.updateAllButton}`} onClick={onUpdateAll}>
              <i class="fe fe-download-cloud mr-2" />
              <Text id="integration.root.updateAll.button" />
              <span class={`badge ml-2 ${style.updateAllCount}`}>{integrationsToUpdateCount}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateAllIntegrations;
