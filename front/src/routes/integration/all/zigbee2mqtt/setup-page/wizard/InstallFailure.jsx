import { Text, MarkupText } from 'preact-i18n';

// Failures whose message tells to "save the configuration again" elsewhere: the wizard tells to retry
const WIZARD_TEXTS = ['NO_ANSWER', 'DONGLE_NOT_FOUND', 'NOT_ENOUGH_DISK_SPACE', 'BAD_CREDENTIALS', 'NOT_AUTHORIZED'];

// Failures explained by the messages of the setup page
const SETUP_TEXTS = {
  SYSTEM_NOT_RUNNING_DOCKER: 'integration.zigbee2mqtt.setup.nonDockerEnv',
  DOCKER_BAD_NETWORK: 'integration.zigbee2mqtt.setup.invalidDockerNetwork',
  BROKER_UNREACHABLE: 'integration.zigbee2mqtt.setup.mqttConnectionErrors.BROKER_UNREACHABLE'
};

// Failures whose text ends on the message, which is then shown in clear: the settings Zigbee2mqtt refused
const MESSAGE_SHOWN = ['INVALID_CONFIGURATION'];

const KNOWN_CODES = [
  ...WIZARD_TEXTS,
  ...Object.keys(SETUP_TEXTS),
  'EZSP_PROTOCOL_VERSION',
  'ADAPTER_UNREACHABLE',
  'ADAPTER_NO_RESPONSE',
  'INVALID_CONFIGURATION'
];

const FailureText = ({ code }) => {
  if (WIZARD_TEXTS.includes(code)) {
    return <Text id={`integration.zigbee2mqtt.setup.wizard.failure.texts.${code}`} />;
  }
  if (SETUP_TEXTS[code]) {
    return <Text id={SETUP_TEXTS[code]} />;
  }
  // Why Zigbee2mqtt does not start, read in its logs
  return <MarkupText id={`integration.zigbee2mqtt.setup.modes.local.containerErrors.${code}`} />;
};

// Why the installation failed: a short title, what to do, and the technical details folded
const InstallFailure = ({ error }) => {
  const code = error && KNOWN_CODES.includes(error.code) ? error.code : null;
  const message = error && error.message;
  return (
    <div data-cy="z2m-wizard-failure">
      <strong class="d-block mb-1" data-cy="z2m-wizard-failure-title">
        <Text id={`integration.zigbee2mqtt.setup.wizard.failure.titles.${code || 'unknown'}`} />
      </strong>
      <span data-cy="z2m-wizard-failure-text">
        {code ? <FailureText code={code} /> : <Text id="integration.zigbee2mqtt.setup.wizard.failure.texts.unknown" />}
      </span>
      {message && MESSAGE_SHOWN.includes(code) && (
        <code class="d-block mt-1" data-cy="z2m-wizard-failure-details">
          {message}
        </code>
      )}
      {message && !MESSAGE_SHOWN.includes(code) && (
        <details class="mt-2">
          <summary>
            <Text id="integration.zigbee2mqtt.setup.wizard.failure.details" />
          </summary>
          <code class="d-block mt-1" data-cy="z2m-wizard-failure-details">
            {message}
          </code>
        </details>
      )}
    </div>
  );
};

export default InstallFailure;
