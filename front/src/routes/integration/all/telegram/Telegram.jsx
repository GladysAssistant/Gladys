import { Text, MarkupText } from 'preact-i18n';
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
                            <button class="btn btn-primary" onClick={props.saveTelegramApiKey}>
                              Save
                            </button>
                          </span>
                        </div>
                      </div>
                      <p>
                        <MarkupText
                          id="integration.telegram.link"
                          fields={{
                            link: props.telegramCustomLink
                          }}
                        />{' '}
                        <Text id="integration.telegram.note" />
                      </p>
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
