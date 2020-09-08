import { Text, MarkupText } from 'preact-i18n';
import { RequestStatus } from '../../../../utils/consts';
import cx from 'classnames';

const SlackPage = ({ children, ...props }) => (
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
                        <Text id="integration.slack.title" />
                      </h2>
                      <p>
                        <MarkupText id="integration.slack.introduction" />
                      </p>
                      {props.slackSaveApiKeyStatus === RequestStatus.Error && (
                        <div class="alert alert-danger">
                          <Text id="integration.slack.configurationError" />
                        </div>
                      )}
                      <form onSubmit={props.saveSlackApiKey}>
                        <div class="form-group">
                          <div class="form-label">Slack Bot API Key</div>
                          <div class="input-group">
                            <input
                              type="text"
                              class="form-control"
                              placeholder="Slack Bot API Key"
                              onInput={props.updateSlackApiKey}
                              value={props.slackApiKey}
                            />
                            <span class="input-group-append">
                              <button type="submit" class="btn btn-primary">
                                Save
                              </button>
                            </span>
                          </div>
                        </div>
                      </form>
                      {props.slackCustomLink && (
                        <div>
                          <p>
                            <MarkupText
                              id="integration.slack.link"
                              fields={{
                                link: props.slackCustomLink
                              }}
                            />
                          </p>
                          <p>
                            <Text id="integration.slack.note" />
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

export default SlackPage;
