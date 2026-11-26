import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import { INSTALL_VIEW } from './constants';
import { getPhases } from './phases';
import InstallFailure from './InstallFailure';
import WaitingText from './WaitingText';
import KeyChip from './KeyChip';
import style from './wizard.css';

const T = 'integration.zigbee2mqtt.setup.wizard';

const PHASE_ICONS = {
  done: 'fe fe-check text-success',
  skipped: 'fe fe-check text-success',
  failed: 'fe fe-x text-danger',
  running: `fe fe-loader text-primary ${style.spin}`
};

const PhaseRow = ({ phase }) => (
  <li
    class={cx(style.phase, {
      [style.phaseFailed]: phase.state === 'failed',
      [style.phasePending]: phase.state === 'pending'
    })}
    data-cy="z2m-wizard-phase"
    data-state={phase.state}
  >
    <span class={style.phaseIcon}>
      {PHASE_ICONS[phase.state] ? (
        <i class={PHASE_ICONS[phase.state]} aria-hidden="true" />
      ) : (
        <span class={style.phaseDot} aria-hidden="true" />
      )}
    </span>
    <span class={style.phaseLabel}>
      <Text id={phase.label} />
    </span>
    <span class={style.phaseDetail}>
      {phase.detail && <Text id={phase.detail} />}
      {!phase.detail && phase.state === 'running' && phase.key.startsWith('pull_') && `${phase.progress} %`}
    </span>
  </li>
);

// ② The installation (or the connection to an external broker): its progress, the ezsp fallback, its failure
const DesktopStepInstall = ({ view, actions }) => {
  const { installView, external, savedConfiguration, savedAdapter, zigbee2mqttStatus, saving } = view;
  const starting = installView === INSTALL_VIEW.STARTING;
  const installation = starting ? null : zigbee2mqttStatus.installation;
  const failed = installView === INSTALL_VIEW.FAILED;
  const waiting = installView === INSTALL_VIEW.WAITING;
  const ezspFallback = Boolean(zigbee2mqttStatus.ezspFallback);
  const phases = getPhases(installation, { configuration: savedConfiguration, external, ezspFallback });
  const progress = installation ? installation.progress : 0;
  return (
    <div data-cy="z2m-wizard-install-step">
      <div class="mb-3">
        <h3 class="mb-1">
          <Text id={external ? `${T}.progress.titleConnect` : `${T}.progress.titleInstall`} />
        </h3>
        {!failed && !waiting && (
          <p class="text-muted mb-0" data-cy="z2m-wizard-leave-page">
            <Text id={`${T}.progress.leavePage`} />
          </p>
        )}
      </div>
      {!external && <KeyChip adapter={savedAdapter} configuration={savedConfiguration} />}
      <div class={style.progressRow}>
        <div class={cx('progress', style.progress)}>
          <div
            class={cx('progress-bar', failed ? 'bg-danger' : 'bg-primary')}
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
            data-cy="z2m-wizard-progress-bar"
          />
        </div>
        <span class={style.progressValue} data-cy="z2m-wizard-progress">
          {progress} %
        </span>
      </div>
      <ul class={style.phases}>
        {phases.map(phase => (
          <PhaseRow key={phase.key} phase={phase} />
        ))}
      </ul>
      {ezspFallback && !failed && !external && (
        <div class="alert alert-info" data-cy="z2m-wizard-ezsp-note">
          <MarkupText id={`${T}.progress.ezspNote`} />
        </div>
      )}
      {waiting && (
        <div>
          <div class="alert alert-info" role="status" data-cy="z2m-wizard-waiting-zigbee2mqtt">
            <WaitingText status={zigbee2mqttStatus} />
          </div>
          <div class={style.buttons}>
            <button
              type="button"
              class="btn btn-outline-primary"
              onClick={actions.changeKey}
              data-cy="z2m-wizard-change-key"
            >
              <Text id={`${T}.failure.changeConnection`} />
            </button>
          </div>
        </div>
      )}
      {failed && (
        <div>
          <div class="alert alert-danger" role="alert">
            <InstallFailure
              error={zigbee2mqttStatus.installation && zigbee2mqttStatus.installation.error}
              networkCoordinator={savedConfiguration.z2mAdapterMode === 'network'}
            />
          </div>
          <div class={style.buttons}>
            <button
              type="button"
              class={cx('btn btn-primary', { 'btn-loading': saving })}
              onClick={actions.retry}
              disabled={saving}
              data-cy="z2m-wizard-retry"
            >
              <i class="fe fe-refresh-cw mr-2" aria-hidden="true" />
              <Text id={`${T}.failure.retry`} />
            </button>
            <button
              type="button"
              class="btn btn-outline-primary"
              onClick={actions.changeKey}
              data-cy="z2m-wizard-change-key"
            >
              <Text id={external ? `${T}.failure.changeConnection` : `${T}.failure.changeKey`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopStepInstall;
