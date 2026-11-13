import { Text } from 'preact-i18n';

import ContainerError from '../../commons/ContainerError';

// Failures with a message of their own; the others tell why Zigbee2mqtt does not start (see ContainerError)
const ERROR_TEXTS = {
  NO_ANSWER: 'integration.zigbee2mqtt.setup.installation.errors.NO_ANSWER',
  DONGLE_NOT_FOUND: 'integration.zigbee2mqtt.setup.installation.errors.DONGLE_NOT_FOUND',
  NOT_ENOUGH_DISK_SPACE: 'integration.zigbee2mqtt.setup.installation.errors.NOT_ENOUGH_DISK_SPACE',
  SYSTEM_NOT_RUNNING_DOCKER: 'integration.zigbee2mqtt.setup.nonDockerEnv',
  DOCKER_BAD_NETWORK: 'integration.zigbee2mqtt.setup.invalidDockerNetwork',
  BAD_CREDENTIALS: 'integration.zigbee2mqtt.setup.mqttConnectionErrors.BAD_CREDENTIALS',
  NOT_AUTHORIZED: 'integration.zigbee2mqtt.setup.mqttConnectionErrors.NOT_AUTHORIZED',
  BROKER_UNREACHABLE: 'integration.zigbee2mqtt.setup.mqttConnectionErrors.BROKER_UNREACHABLE'
};

const InstallationError = ({ error }) => {
  if (!error.code) {
    return (
      <span>
        <Text id="integration.zigbee2mqtt.setup.installation.errors.unknownErrorPrefix" />
        <code>{error.message}</code>
      </span>
    );
  }
  if (ERROR_TEXTS[error.code]) {
    return <Text id={ERROR_TEXTS[error.code]} />;
  }
  return <ContainerError error={error} />;
};

// Same failure as one of the errors of the status, already shown below the setup
const isShownBelow = (error, statusErrors) =>
  statusErrors.some(
    statusError => statusError && statusError.code === error.code && statusError.message === error.message
  );

// Progress of the installation launched by saving the configuration, or of its failure
const InstallationProgress = ({ installation, zigbee2mqttConnected, statusErrors = [] }) => {
  if (!installation || (installation.state !== 'running' && installation.state !== 'failed')) {
    return null;
  }
  const failed = installation.state === 'failed';
  // Zigbee2mqtt answered after the failure (restarted by Docker, slow machine, update postponed with the old
  // containers still running): the failure no longer matters
  if (failed && zigbee2mqttConnected) {
    return null;
  }
  const findPhase = phaseState => installation.phases.find(({ state }) => state === phaseState);
  // Between two phases, none runs: the next one is named
  const phase = failed ? findPhase('failed') : findPhase('running') || findPhase('pending');

  return (
    <li class="list-group-item" data-cy="z2m-installation-progress">
      <div class="form-label">
        <Text id={`integration.zigbee2mqtt.setup.installation.titles.${installation.kind}`} />
      </div>
      {failed ? (
        <div class="alert alert-danger my-3" data-cy="z2m-installation-error">
          {phase && (
            <div class="font-weight-bold mb-1" data-cy="z2m-installation-failed-phase">
              <Text id="integration.zigbee2mqtt.setup.installation.failedPhase" />{' '}
              <Text id={`integration.zigbee2mqtt.setup.installation.phases.${phase.key}`} />
            </div>
          )}
          {installation.error && !isShownBelow(installation.error, statusErrors) && (
            <div data-cy="z2m-installation-error-message">
              <InstallationError error={installation.error} />
            </div>
          )}
        </div>
      ) : (
        <div class="my-3">
          <div class="progress mb-2">
            <div
              class="progress-bar progress-bar-striped progress-bar-animated bg-primary"
              style={{ width: `${installation.progress}%` }}
              role="progressbar"
              aria-valuenow={installation.progress}
              aria-valuemin="0"
              aria-valuemax="100"
              data-cy="z2m-installation-progress-bar"
            />
          </div>
          <div class="d-flex justify-content-between">
            <span data-cy="z2m-installation-phase">
              {phase && <Text id={`integration.zigbee2mqtt.setup.installation.phases.${phase.key}`} />}
            </span>
            <span class="text-muted">{installation.progress}%</span>
          </div>
          <small class="text-muted">
            <Text id="integration.zigbee2mqtt.setup.installation.leavePage" />
          </small>
        </div>
      )}
    </li>
  );
};

export default InstallationProgress;
