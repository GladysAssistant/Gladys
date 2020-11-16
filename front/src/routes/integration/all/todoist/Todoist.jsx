import cx from 'classnames';
import { Localizer, MarkupText, Text } from 'preact-i18n';

const TodoistPage = ({ children, ...props }) => (
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
                        <Text id="integration.todoist.title" />
                      </h2>
                      <p>
                        <Text id="integration.todoist.introduction" />
                      </p>
                      <p>
                        <MarkupText id="integration.todoist.instructions" />
                      </p>
                      <form onSubmit={props.saveApiKey}>
                        <div class="form-group">
                          <div class="form-label">
                            <Text id="integration.todoist.apiKeyLabel" />
                          </div>
                          <div class="input-group">
                            <Localizer>
                              <input
                                type="text"
                                class="form-control"
                                placeholder={<Text id="integration.todoist.apiKeyPlaceholder" />}
                                onInput={props.updateApiKey}
                                value={props.todoistApiKey}
                              />
                            </Localizer>
                            <span class="input-group-append">
                              <button
                                class={cx('btn', 'btn-success', {
                                  'btn-loading': props.loading
                                })}
                                type="submit"
                              >
                                <Text id="integration.todoist.saveButton" />
                              </button>
                            </span>
                          </div>
                        </div>

                        <div class="form-group">
                          <label>
                            <Text id="integration.todoist.instructionsToUse" />
                          </label>
                        </div>
                      </form>
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

export default TodoistPage;
