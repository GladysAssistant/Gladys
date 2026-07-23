import { Text } from 'preact-i18n';
import cx from 'classnames';

import HardwareSwitches from '../components/HardwareSwitches';
import { RequestStatus } from '../../../../../utils/consts';

// Same switches as the install screen, editable at any time (admin): a
// change recreates the affected sub-containers and notifies the
// integration (hardware-updated) so it adapts its configuration.
const HardwareCard = ({ requestedClasses, detectedClasses, grantedDevices, hardwareStatus, onToggle, onSave }) => {
  const saving = hardwareStatus === RequestStatus.Getting;
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.externalIntegration.hardware.title" />
        </h3>
      </div>
      <div class="card-body">
        <p class="text-muted small">
          <Text id="integration.externalIntegration.hardware.configDescription" />
        </p>
        {hardwareStatus === RequestStatus.Error && (
          <div class="alert alert-danger">
            <Text id="integration.externalIntegration.hardware.saveError" />
          </div>
        )}
        <HardwareSwitches
          requestedClasses={requestedClasses}
          detectedClasses={detectedClasses}
          granted={grantedDevices}
          onToggle={onToggle}
          disabled={saving}
        />
        <button class={cx('btn btn-primary mt-2', { 'btn-loading': saving })} onClick={onSave} disabled={saving}>
          <Text id="integration.externalIntegration.hardware.saveButton" />
        </button>
      </div>
    </div>
  );
};

export default HardwareCard;
