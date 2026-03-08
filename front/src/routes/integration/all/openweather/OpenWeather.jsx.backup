import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';

const OpenWeatherPage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.openWeather.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <DeviceConfigurationLink
                    user={props.user}
                    configurationKey="integrations"
                    documentKey="openweather"
                    linkClass="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-book-open" />
                    </span>
                    <Text id="integration.openWeather.documentation" />
                  </DeviceConfigurationLink>
                </div>
              </div>
            </div>

            <div class="col-lg-9">
              <div class="card">
                <div class="card-header">
                  <h1 class="card-title">
                    <Text id="integration.openWeather.title" />
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
