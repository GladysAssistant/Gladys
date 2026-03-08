import { Text, MarkupText, Localizer } from 'preact-i18n';
import { RequestStatus } from '../../../../utils/consts';
import { USER_ROLE } from '../../../../../../server/utils/constants';
import cx from 'classnames';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';

const TelegramPage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.telegram.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <DeviceConfigurationLink
                    user={props.user}
                    configurationKey="integrations"
                    documentKey="telegram"
                    linkClass="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-book-open" />
                    </span>
                    <Text id="integration.telegram.documentation" />
                  </DeviceConfigurationLink>
                </div>
              </div>
            </div>

            <div class="col-lg-9">
              <div class="card">
                <div class="card-header">
                  <h1 class="card-title">
                    <Text id="integration.telegram.title" />
                  </h1>
                </div>
                <div class="card-body">
                  <div
                    class={cx('dimmer', {
                      active: props.loading
                    })}
                  >
                    <div class="loader" />
                    <div class="dimmer-content">
                      {props.user && props.user.role === USER_ROLE.ADMIN && (
                        <p>
                          <MarkupText id="integration.telegram.introduction" />
                        </p>
                      )}
                      {props.telegramSaveApiKeyStatus === RequestStatus.Error && (
                        <div class="alert alert-danger">
                          <Text id="integration.telegram.configurationError" />
                        </div>
                      )}
                      {props.user && props.user.role === USER_ROLE.ADMIN && (
                        <form onSubmit={props.saveTelegramApiKey}>
                          <div class="form-group">
                            <div class="form-label">
                              <Text id="integration.telegram.apiKey" />
                            </div>
                            <div class="input-group">
                              <Localizer>
                                <input
                                  type="text"
                                  class="form-control"
                                  placeholder={<Text id="integration.telegram.apiKey" />}
                                  onInput={props.updateTelegramApiKey}
                                  value={props.telegramApiKey}
                                />
                              </Localizer>
                              <span class="input-group-append">
                                <button type="submit" class="btn btn-primary">
                                  <Text id="integration.telegram.saveButton" />
                                </button>
                              </span>
                            </div>
                          </div>
                        </form>
                      )}
                      {props.telegramCustomLink && (
                        <div>
                          <p>
                            <MarkupText
                              id="integration.telegram.link"
                              fields={{
                                link: props.telegramCustomLink
                              }}
                            />
                          </p>
                          <p>
                            <Text id="integration.telegram.note" />
                          </p>
                        </div>
                      )}
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

export default TelegramPage;
