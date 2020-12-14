import { Text } from 'preact-i18n';

const SetupTab = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.netatmo.setting.title" />
        </h3>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label"><Text id="integration.netatmo.setting.usernamePlaceholder" /></label>
          <input
            type="text"
            class="form-control"
            name="netatmoUsername"
            value={props.netatmoUsername}
            onInput={props.updateConfigration}
            placeholder={<Text id="integration.netatmo.setting.usernamePlaceholder" />}
          />
        </div>
        <div class="form-group">
          <label class="form-label"><Text id="integration.netatmo.setting.passwordPlaceholder" /></label>
          <input
            type="password"
            class="form-control"
            name="netatmoPassword"
            value={props.netatmoPassword}
            onInput={props.updateConfigration}
            placeholder={<Text id="integration.netatmo.setting.passwordPlaceholder" />}
          />
        </div>
        <div class="form-group">
          <label class="form-label"><Text id="integration.netatmo.setting.clientIdPlaceholder" /></label>
          <input
            type="text"
            class="form-control"
            name="netatmoClientId"
            value={props.netatmoClientId}
            onInput={props.updateConfigration}
            placeholder={<Text id="integration.netatmo.setting.clientIdPlaceholder" />}
          />
        </div>
        <div class="form-group">
          <label class="form-label"><Text id="integration.netatmo.setting.clientSecretPlaceholder" /></label>
          <input
            type="password"
            class="form-control"
            name="netatmoClientSecret"
            value={props.netatmoClientSecret}
            onInput={props.updateConfigration}
            placeholder={<Text id="integration.netatmo.setting.clientSecretPlaceholder" />}
          />
        </div>

      </div>
      <div class="card-footer text-right">
        <div class="d-flex">
          <button type="submit" class="btn btn-success" onClick={props.saveConfiguration}>
            <Text id="integration.netatmo.setting.saveLabel" />
          </button>
          <button type="submit" class="btn btn-primary ml-auto" onClick={props.connectConfiguration}>
            <Text id="integration.netatmo.setting.connectLabel" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupTab;
