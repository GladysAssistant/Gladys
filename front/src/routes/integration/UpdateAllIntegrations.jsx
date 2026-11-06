import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { useEffect, useRef } from 'preact/hooks';

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

// the run in progress. Started from the keyboard, the button that had the
// focus is gone: the focus moves onto this card, which announces each step
// (aria-live) — but only when it was lost, never taken from another control
// on a return to the view. The integration in flight counts as half done, so
// the bar moves from the first update on, a single one included
const UpdateAllProgress = ({ progress }) => {
  const card = useRef(null);
  useEffect(() => {
    if (card.current && (!document.activeElement || document.activeElement === document.body)) {
      card.current.focus();
    }
  }, []);
  const done = progress.current - 0.5;
  return (
    <div class="card" ref={card} tabIndex={-1} role="status" aria-live="polite">
      <div class="card-body">
        <div class="d-flex align-items-center mb-3">
          <i class={`fe fe-refresh-cw text-primary mr-2 ${style.updateAllSpinner}`} />
          <strong>
            <Text
              id="integration.root.updateAll.progress"
              fields={{ name: progress.name, current: progress.current, total: progress.total }}
            />
          </strong>
        </div>
        <div class="progress progress-sm">
          <div
            class="progress-bar progress-bar-striped progress-bar-animated bg-primary"
            style={{ width: `${Math.round((done / progress.total) * 100)}%` }}
            role="progressbar"
            aria-valuenow={done}
            aria-valuemin="0"
            aria-valuemax={progress.total}
          />
        </div>
        <div class="text-muted small mt-2">
          <Text id="integration.root.updateAll.keepPageOpen" />
        </div>
      </div>
    </div>
  );
};

// one-click update of every installed community integration displayed in the
// To update view: the card update is run for each of them, one after the
// other, so that a single image pull and container restart runs at a time and
// each failure is reported on its own integration
const UpdateAllIntegrations = ({
  integrationsToUpdateCount,
  cardUpdateRunning,
  status,
  progress,
  result,
  onUpdateAll
}) => {
  const running = status === RequestStatus.Getting && progress;
  return (
    <div>
      {!running && result && <UpdateAllResult result={result} />}
      {running && <UpdateAllProgress progress={progress} />}
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
                {/* a card update in flight: the run would pull alongside it */}
                <Text
                  id={
                    cardUpdateRunning
                      ? 'integration.root.updateAll.waitCardUpdate'
                      : 'integration.root.updateAll.description'
                  }
                />
              </div>
            </div>
            <button
              type="button"
              class={`btn btn-primary ${style.updateAllButton}`}
              onClick={onUpdateAll}
              disabled={cardUpdateRunning}
            >
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
