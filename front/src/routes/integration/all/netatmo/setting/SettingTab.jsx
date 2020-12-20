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
        {props.netatmoConnectedMessage === true && (
          <p class="text-center alert alert-success">
            <Text id="integration.netatmo.setting.configure" />
          </p>
        )}
        {props.netatmoConnectedError === true && (
          <p class="text-center alert alert-danger">
            <Text id="integration.netatmo.setting.error" />
          </p>
        )}
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.netatmo.setting.usernamePlaceholder" />
          </label>
          <input
            type="text"
            class="form-control"
            name="netatmoUsername"
            value={props.netatmoUsername}
            onInput={props.updateConfiguration}
            placeholder={<Text id="integration.netatmo.setting.usernamePlaceholder" />}
          />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.netatmo.setting.passwordPlaceholder" />
          </label>
          <input
            type="password"
            class="form-control"
            name="netatmoPassword"
            value={props.netatmoPassword}
            onInput={props.updateConfiguration}
            placeholder={<Text id="integration.netatmo.setting.passwordPlaceholder" />}
          />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.netatmo.setting.clientIdPlaceholder" />
          </label>
          <input
            type="text"
            class="form-control"
            name="netatmoClientId"
            value={props.netatmoClientId}
            onInput={props.updateConfiguration}
            placeholder={<Text id="integration.netatmo.setting.clientIdPlaceholder" />}
          />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.netatmo.setting.clientSecretPlaceholder" />
          </label>
          <input
            type="password"
            class="form-control"
            name="netatmoClientSecret"
            value={props.netatmoClientSecret}
            onInput={props.updateConfiguration}
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
