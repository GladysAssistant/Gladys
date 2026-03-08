import { Text } from 'preact-i18n';

const SubmitConfiguration = ({ saveConfiguration, resetConfiguration, saveDisabled, disabled }) => (
  <div class="d-flex">
    <button
      class="btn btn-success mx-auto"
      onClick={saveConfiguration}
      disabled={saveDisabled || disabled}
      data-cy="z2m-setup-save"
    >
      <i class="fe fe-save mr-2" />
      <Text id="global.save" />
    </button>
    <button class="btn btn-primary mx-auto" onClick={resetConfiguration} disabled={disabled} data-cy="z2m-setup-reset">
      <i class="fe fe-rotate-ccw mr-2" />
      <Text id="integration.zigbee2mqtt.setup.resetLabel" />
    </button>
  </div>
);

export default SubmitConfiguration;
