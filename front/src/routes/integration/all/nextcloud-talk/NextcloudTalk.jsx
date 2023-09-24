import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../utils/consts';

const NextcloudTalkPage = ({ children, ...props }) => (
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
                        <Text id="integration.nextcloudTalk.title" />
                      </h2>
                      <p>
                        <Text id="integration.nextcloudTalk.introduction" />
                      </p>
                      <div class="form-group">
                        <div class="form-label">
                          <Text id={`integration.nextcloudTalk.url`} />
                        </div>
                        <Text id={`integration.nextcloudTalk.urlInfo`} />
                        <Localizer>
                          <input
                            type="text"
                            class="form-control"
                            placeholder={<Text id={`integration.nextcloudTalk.url`} />}
                            onInput={props.updateNextcloudUrl}
                            value={props.nextcloudUrl}
                          />
                        </Localizer>
                      </div>
                      <div class="form-group">
                        <div class="form-label">
                          <Text id={`integration.nextcloudTalk.username`} />
                        </div>
                        <Text id={`integration.nextcloudTalk.usernameInfo`} />
                        <Localizer>
                          <input
                            type="text"
                            class="form-control"
                            autocomplete="off"
                            placeholder={<Text id={`integration.nextcloudTalk.username`} />}
                            onInput={props.updateNextcloudBotUsername}
                            value={props.nextcloudBotUsername}
                          />
                        </Localizer>
                      </div>
                      <div class="form-group">
                        <div class="form-label">
                          <Text id={`integration.nextcloudTalk.password`} />
                        </div>
                        <MarkupText id={`integration.nextcloudTalk.passwordInfo`} />
                        <Localizer>
                          <input
                            type="password"
                            autocomplete="off"
                            class="form-control"
                            placeholder={<Text id={`integration.nextcloudTalk.password`} />}
                            onInput={props.updateNextcloudBotPassword}
                            value={props.nextcloudBotPassword}
                          />
                        </Localizer>
                      </div>
                      <div class="form-group">
                        <div class="form-label">
                          <Text id={`integration.nextcloudTalk.token`} />
                        </div>
                        <Text id={`integration.nextcloudTalk.tokenInfo`} />
                        <Localizer>
                          <input
                            type="text"
                            class="form-control"
                            placeholder={<Text id={`integration.nextcloudTalk.token`} />}
                            onInput={props.updateNextcloudTalkToken}
                            value={props.nextcloudTalkToken}
                          />
                        </Localizer>
                      </div>
                      {props.nextcloudTalkSaveSettingsStatus === RequestStatus.Error && (
                        <div class="alert alert-danger">
                          <Text id="integration.nextcloudTalk.configurationError" />
                        </div>
                      )}
                      {props.nextcloudTalkSaveSettingsStatus === RequestStatus.Success && (
                        <p class="alert alert-info">
                          <Text id="integration.nextcloudTalk.configurationSuccess" />
                        </p>
                      )}
                      <div class="form-group">
                        <span class="input-group-append">
                          <button class="btn btn-primary" onClick={props.saveNextcloudTalkSettings}>
                            <Text id={`integration.nextcloudTalk.buttonSave`} />
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

export default NextcloudTalkPage;
