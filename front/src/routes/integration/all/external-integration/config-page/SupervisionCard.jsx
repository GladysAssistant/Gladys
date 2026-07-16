import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import StatusBadge from '../components/StatusBadge';
import { getGithubRepoUrl } from '../utils';
import { RequestStatus } from '../../../../../utils/consts';

const SupervisionCard = ({
  integration,
  actionStatus,
  actionError,
  uninstallStatus,
  askingUninstall,
  executeAction,
  onAskUninstall,
  onCancelUninstall,
  onUninstall
}) => {
  const repoUrl = getGithubRepoUrl(integration.store_slug);
  const actionInProgress = actionStatus === RequestStatus.Getting;
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.externalIntegration.supervision.title" />
        </h3>
        <div class="card-options">
          <StatusBadge status={integration.status} />
        </div>
      </div>
      <div
        class={cx('dimmer', {
          active: actionInProgress || uninstallStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <div class="card-body">
            {actionError && (
              <div class="alert alert-danger">
                <Text id="integration.externalIntegration.supervision.actionError" />
              </div>
            )}
            {uninstallStatus === RequestStatus.Error && (
              <div class="alert alert-danger">
                <Text id="integration.externalIntegration.supervision.uninstallError" />
              </div>
            )}
            {integration.update_available && (
              <div class="alert alert-info">
                <Text id="integration.externalIntegration.supervision.updateAvailableText" />
              </div>
            )}
            <dl class="row">
              <dt class="col-5 col-sm-4">
                <Text id="integration.externalIntegration.supervision.statusLabel" />
              </dt>
              <dd class="col-7 col-sm-8">
                <StatusBadge status={integration.status} />
              </dd>
              {integration.version && [
                <dt class="col-5 col-sm-4">
                  <Text id="integration.externalIntegration.supervision.versionLabel" />
                </dt>,
                <dd class="col-7 col-sm-8">{integration.version}</dd>
              ]}
              {integration.docker_image && [
                <dt class="col-5 col-sm-4">
                  <Text id="integration.externalIntegration.supervision.dockerImageLabel" />
                </dt>,
                <dd class="col-7 col-sm-8">
                  <code>{integration.docker_image}</code>
                </dd>
              ]}
              {repoUrl && [
                <dt class="col-5 col-sm-4">
                  <Text id="integration.externalIntegration.supervision.repoLabel" />
                </dt>,
                <dd class="col-7 col-sm-8">
                  <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                    <i class="fe fe-github mr-1" />
                    {integration.store_slug}
                  </a>
                </dd>
              ]}
            </dl>

            <div class="btn-list">
              <button
                class="btn btn-outline-success"
                onClick={() => executeAction('start')}
                disabled={actionInProgress}
              >
                <i class="fe fe-play mr-1" />
                <Text id="integration.externalIntegration.supervision.startButton" />
              </button>
              <button class="btn btn-outline-warning" onClick={() => executeAction('stop')} disabled={actionInProgress}>
                <i class="fe fe-square mr-1" />
                <Text id="integration.externalIntegration.supervision.stopButton" />
              </button>
              <button
                class="btn btn-outline-primary"
                onClick={() => executeAction('restart')}
                disabled={actionInProgress}
              >
                <i class="fe fe-rotate-cw mr-1" />
                <Text id="integration.externalIntegration.supervision.restartButton" />
              </button>
              {integration.update_available && (
                <button class="btn btn-primary" onClick={() => executeAction('update')} disabled={actionInProgress}>
                  <i class="fe fe-arrow-up-circle mr-1" />
                  <Text id="integration.externalIntegration.supervision.updateButton" />
                </button>
              )}
              <Link
                href={`/dashboard/integration/device/external/${integration.selector}/logs`}
                class="btn btn-secondary"
              >
                <i class="fe fe-file-text mr-1" />
                <Text id="integration.externalIntegration.supervision.logsButton" />
              </Link>
              {!askingUninstall && (
                <button class="btn btn-danger" onClick={onAskUninstall}>
                  <i class="fe fe-trash-2 mr-1" />
                  <Text id="integration.externalIntegration.supervision.uninstallButton" />
                </button>
              )}
            </div>

            {askingUninstall && (
              <div class="alert alert-danger mt-4">
                <p>
                  <Text id="integration.externalIntegration.supervision.uninstallWarning" />
                </p>
                <div class="btn-list mb-0">
                  <button class="btn btn-danger" onClick={onUninstall}>
                    <i class="fe fe-trash-2 mr-1" />
                    <Text id="integration.externalIntegration.supervision.confirmUninstallButton" />
                  </button>
                  <button class="btn btn-secondary" onClick={onCancelUninstall}>
                    <Text id="integration.externalIntegration.supervision.cancelUninstallButton" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisionCard;
