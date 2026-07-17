import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import StatusBadge from '../components/StatusBadge';
import { getGithubRepoUrl, getLocalizedText } from '../utils';
import { RequestStatus } from '../../../../../utils/consts';

const SubContainerRow = ({ container, language }) => (
  <tr>
    <td>{container.name}</td>
    <td>
      {container.status === 'running' ? (
        <span class="badge badge-success">
          <Text id="integration.externalIntegration.supervision.containerRunning" />
        </span>
      ) : (
        <span class="badge badge-secondary">
          <Text id="integration.externalIntegration.supervision.containerStopped" />
        </span>
      )}
    </td>
    <td>
      {(container.ports || [])
        .filter(port => port.host_port)
        .map(port => (
          <a
            class="btn btn-sm btn-outline-primary mr-1"
            href={`${window.location.protocol}//${window.location.hostname}:${port.host_port}`}
            target="_blank"
            rel="noopener noreferrer"
            disabled={container.status !== 'running'}
          >
            <i class="fe fe-external-link mr-1" />
            <Text id="integration.externalIntegration.supervision.openButton" />{' '}
            {getLocalizedText(port.label, language) || port.container_port}
          </a>
        ))}
    </td>
  </tr>
);

const SupervisionCard = ({
  integration,
  language,
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
  const subContainers = integration.containers || [];
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

            {subContainers.length > 0 && (
              <div class="mb-4">
                <h4>
                  <Text id="integration.externalIntegration.supervision.containersTitle" />
                </h4>
                <div class="table-responsive">
                  <table class="table table-sm card-table">
                    <tbody>
                      {subContainers.map(container => (
                        <SubContainerRow container={container} language={language} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
              {integration.update_available ? (
                <button class="btn btn-primary" onClick={() => executeAction('update')} disabled={actionInProgress}>
                  <i class="fe fe-arrow-up-circle mr-1" />
                  <Text id="integration.externalIntegration.supervision.updateButton" />
                </button>
              ) : (
                <Localizer>
                  <button
                    class="btn btn-outline-secondary"
                    onClick={() => executeAction('update')}
                    disabled={actionInProgress}
                    title={<Text id="integration.externalIntegration.supervision.forceUpdateTitle" />}
                  >
                    <i class="fe fe-download-cloud mr-1" />
                    <Text id="integration.externalIntegration.supervision.forceUpdateButton" />
                  </button>
                </Localizer>
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
