/* eslint-disable preact-i18n/no-unknown-key */
import { Text, Localizer } from 'preact-i18n';
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
        {props.netatmoConnectStatus === RequestStatus.Getting && (
          <p class="text-center alert alert-info">
            <Text id="integration.netatmo.setting.currentConnection" />
          </p>
        )}
        {props.netatmoConnectStatus === RequestStatus.ServiceConnected && (
          <p class="text-center alert alert-success">
            <Text id="integration.netatmo.setting.connect" />
          </p>
        )}
        {props.netatmoConnectStatus === RequestStatus.ServiceDisconnected && (
          <p class="text-center alert alert-danger">
            <Text id="integration.netatmo.setting.disconnect" />
          </p>
        )}
        {props.netatmoConnectStatus === RequestStatus.Error && (
          <p class="text-center alert alert-danger">
            <Text id="integration.netatmo.setting.error" />
          </p>
        )}
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.netatmo.setting.usernamePlaceholder" />
          </label>
          <Localizer>
            <input
              type="text"
              class="form-control"
              name="netatmoUsername"
              value={props.netatmoUsername}
              onInput={props.updateConfiguration}
              placeholder={<Text id="integration.netatmo.setting.usernamePlaceholder" />}
            />
          </Localizer>
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.netatmo.setting.passwordPlaceholder" />
          </label>
          <Localizer>
            <input
              type="password"
              class="form-control"
              name="netatmoPassword"
              value={props.netatmoPassword}
              onInput={props.updateConfiguration}
              placeholder={<Text id="integration.netatmo.setting.passwordPlaceholder" />}
            />
          </Localizer>
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.netatmo.setting.clientIdPlaceholder" />
          </label>
          <Localizer>
            <input
              type="text"
              class="form-control"
              name="netatmoClientId"
              value={props.netatmoClientId}
              onInput={props.updateConfiguration}
              placeholder={<Text id="integration.netatmo.setting.clientIdPlaceholder" />}
            />
          </Localizer>
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.netatmo.setting.clientSecretPlaceholder" />
          </label>
          <Localizer>
            <input
              type="password"
              class="form-control"
              name="netatmoClientSecret"
              value={props.netatmoClientSecret}
              onInput={props.updateConfiguration}
              placeholder={<Text id="integration.netatmo.setting.clientSecretPlaceholder" />}
            />
          </Localizer>
        </div>
      </div>
      <div class="card-footer">
        <div class="d-flex">
          <div class="col text-left">
            <button type="submit" class="btn btn-success" onClick={props.saveConfiguration}>
              <Text id="integration.netatmo.setting.saveAndConnectLabel" />
            </button>
          </div>
          <div class="col text-right">
            <button type="submit" class="btn btn-danger" onClick={props.disconnectAction}>
              <Text id="integration.netatmo.setting.disconnectLabel" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupTab;
