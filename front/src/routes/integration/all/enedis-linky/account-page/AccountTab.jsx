import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';

const AccountTab = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-12">
              <div class="card">
                <div class="card-body">
                  <div
                    class={cx('dimmer', {
                      active: props.loading
                    })}
                  >
                    <div class="loader" />
                    <div class="dimmer-content">
                      <h2>
                        <Text id="integration.enedisLinky.accountTab" />
                      </h2>
                      <p>
                        <Text id="integration.enedisLinky.accountIntroduction" />
                      </p>
                      <div class="form-group">
                        <div class="form-label">
                          <Text id={'integration.enedisLinky.accessToken'} />
                        </div>
                        <Text id={'integration.enedisLinky.accessTokenInfo'} />
                        <Localizer>
                          <input
                            type="text"
                            class="form-control"
                            placeholder={<Text id={'integration.enedisLinky.accessToken'} />}
                            onInput={props.updateEnedisAccessToken}
                            value={props.enedisAccessToken}
                          />
                        </Localizer>
                      </div>
                      <div class="form-group">
                        <div class="form-label">
                          <Text id={`integration.enedisLinky.refreshToken`} />
                        </div>
                        <MarkupText id={'integration.enedisLinky.refreshTokenInfo'} />
                        <Localizer>
                          <input
                            type="text"
                            class="form-control"
                            placeholder={<Text id={'integration.enedisLinky.refreshToken'} />}
                            onInput={props.updateEnedisRefreshToken}
                            value={props.enedisRefreshToken}
                          />
                        </Localizer>
                      </div>
                      {props.enedisSaveSettingsStatus === RequestStatus.Error && (
                        <div class="alert alert-danger">
                          <Text id="integration.enedisLinky.saveError" />
                        </div>
                      )}
                      {props.enedisSaveSettingsStatus === RequestStatus.Success && (
                        <p class="alert alert-info">
                          <Text id="integration.enedisLinky.saveSuccess" />
                        </p>
                      )}
                      <div class="form-group">
                        <span class="input-group-append">
                          <button class="btn btn-primary" onClick={props.saveEnedisSettings}>
                            <Text id={`integration.enedisLinky.buttonSave`} />
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AccountTab;
