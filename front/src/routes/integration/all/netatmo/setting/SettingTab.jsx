import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';

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
          <label class="form-label">Username</label>
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
          <label class="form-label">Password</label>
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
          <label class="form-label">Client ID</label>
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
          <label class="form-label">Client Secret</label>
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
