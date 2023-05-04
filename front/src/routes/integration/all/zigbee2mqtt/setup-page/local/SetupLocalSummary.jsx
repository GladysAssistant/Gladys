import { Text } from 'preact-i18n';

const SetupLocalSummary = ({ configuration, enableEditionMode, disabled }) => {
  const { z2mDriverPath, z2mDongleName } = configuration;
  return (
    <div class="form-inline" data-cy="z2m-setup-local-summary">
      <div class="form-group">
        <div>
          <Text id={`integration.zigbee2mqtt.setup.modes.local.summary.title`} />
          <ul class="list-unstyled list-separated ml-2">
            <li>
              <small>
                <Text
                  id={`integration.zigbee2mqtt.setup.modes.local.summary.usbPort`}
                  fields={{ usbPort: z2mDriverPath }}
                />
              </small>
            </li>
            <li>
              <small>
                <Text
                  id={`integration.zigbee2mqtt.setup.modes.local.summary.dongleName`}
                  fields={{ dongleName: z2mDongleName }}
                />
              </small>
            </li>
          </ul>
        </div>
      </div>
      <button class="btn btn-primary btn-sm ml-auto" onClick={enableEditionMode} disabled={disabled}>
        <Text id="integration.zigbee2mqtt.setup.changeButtonLabel" />
      </button>
    </div>
  );
};

export default SetupLocalSummary;
