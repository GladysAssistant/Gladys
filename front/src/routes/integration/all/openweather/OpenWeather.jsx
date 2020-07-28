import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';

const OpenWeatherPage = ({ children, ...props }) => (
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
                        <Text id="integration.openWeather.title" />
                      </h2>
                      <p>
                        <Text id="integration.openWeather.introduction" />
                      </p>
                      <p>
                        <MarkupText id="integration.openWeather.instructions" />
                      </p>
                      <form onSubmit={props.saveApiKey}>
                        <div class="form-group">
                          <div class="form-label">
                            <Text id="integration.openWeather.apiKeyLabel" />
                          </div>
                          <div class="input-group">
                            <Localizer>
                              <input
                                type="text"
                                class="form-control"
                                placeholder={<Text id="integration.openWeather.apiKeyPlaceholder" />}
                                onInput={props.updateApiKey}
                                value={props.openWeatherApiKey}
                              />
                            </Localizer>
                            <span class="input-group-append">
                              <button
                                class={cx('btn', 'btn-success', {
                                  'btn-loading': props.loading
                                })}
                                type="submit"
                              >
                                <Text id="integration.openWeather.saveButton" />
                              </button>
                            </span>
                          </div>
                        </div>

                        <div class="form-group">
                          <label>
                            <Text id="integration.openWeather.instructionsToUse" />
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

export default OpenWeatherPage;
