import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';
import { USER_ROLE } from '../../../../../../../server/utils/constants';

import style from './AccountTab.css';

const AccountTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.gradium.accountTab" />
      </h1>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.loading
        })}
      >
        <div class="loader" />
        {props.user && props.user.role === USER_ROLE.ADMIN && (
        <div class="dimmer-content">
          <p>
            <Text id="integration.gradium.accountIntroduction" />
          </p>
          <div class="form-group">
            <div class="form-label">
              <Text id="integration.gradium.endpointLabel" />
            </div>
            <Text id="integration.gradium.endpointInfo" />
            <select class="form-control" onChange={props.updateGradiumEndpoint} value={props.gradiumEndpoint}>
              {['eu', 'us'].map(endpoint => (
                <option value={endpoint}>
                  <Text id={`integration.gradium.endpoint.${endpoint}`} />
                </option>
              ))}
            </select>
          </div>
          <div class="form-group">
            <div class="form-label">
              <Text id={`integration.gradium.apiKey`} />
            </div>
            <MarkupText id={`integration.gradium.apiKeyInfo`} />
            <Localizer>
              <input
                type="password"
                class="form-control"
                placeholder={<Text id={`integration.gradium.apiKey`} />}
                onInput={props.updateGradiumApiKey}
                value={props.gradiumApiKey}
              />
            </Localizer>
          </div>
          {props.gradiumSaveSettingsStatus === RequestStatus.Error && (
            <div class="alert alert-danger">
              <Text id="integration.gradium.configurationError" />
            </div>
          )}
          {props.gradiumSaveSettingsStatus === RequestStatus.Success && (
            <p class="alert alert-info">
              <Text id="integration.gradium.configurationSuccess" />
            </p>
          )}
          <div class="form-group">
            <span class="input-group-append">
              <button className={cx('btn btn-primary', style.button)} onClick={props.saveGradiumSettings}>
                <Text id={`integration.gradium.buttonSave`} />
              </button>
            </span>
          </div>
        </div>
        )}
      </div>
    </div>
  </div>
);

export default AccountTab;
