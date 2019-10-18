import { Text, MarkupText } from 'preact-i18n';
import { RequestStatus } from '../../../../utils/consts';
import cx from 'classnames';

const TelegramPage = ({ children, ...props }) => (
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
                        <Text id="integration.telegram.title" />
                      </h2>
                      <p>
                        <MarkupText id="integration.telegram.introduction" />
                      </p>
                      {props.telegramSaveApiKeyStatus === RequestStatus.Error && (
                        <div class="alert alert-danger">
                          <Text id="integration.telegram.configurationError" />
                        </div>
                      )}
                      <form onSubmit={props.saveTelegramApiKey}>
                        <div class="form-group">
                          <div class="form-label">Telegram Bot API Key</div>
                          <div class="input-group">
                            <input
                              type="text"
                              class="form-control"
                              placeholder="Telegram Bot API Key"
                              onInput={props.updateTelegramApiKey}
                              value={props.telegramApiKey}
                            />
                            <span class="input-group-append">
                              <button type="submit" class="btn btn-primary">
                                Save
                              </button>
                            </span>
                          </div>
                        </div>
                      </form>
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
