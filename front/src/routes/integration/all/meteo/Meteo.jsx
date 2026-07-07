import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import { RequestStatus } from '../../../../utils/consts';

const MeteoPage = ({ children, ...props }) => {
  const source = props.meteoSource || 'meteofrance';
  const isOpenWeather = source === 'openweather';
  return (
    <div class="page">
      <div class="page-main">
        <div class="my-3 my-md-5">
          <div class="container">
            <div class="row">
              <div class="col-lg-3">
                <h3 class="page-title mb-5">
                  <Text id="integration.meteo.title" />
                </h3>
                <div>
                  <div class="list-group list-group-transparent mb-0">
                    <DeviceConfigurationLink
                      user={props.user}
                      configurationKey="integrations"
                      documentKey="meteo-france"
                      linkClass="list-group-item list-group-item-action d-flex align-items-center"
                    >
                      <span class="icon mr-3">
                        <i class="fe fe-book-open" />
                      </span>
                      <Text id="integration.meteo.documentation" />
                    </DeviceConfigurationLink>
                  </div>
                </div>
              </div>

              <div class="col-lg-9">
                <div class="card">
                  <div class="card-header">
                    <h1 class="card-title">
                      <Text id="integration.meteo.title" />
                    </h1>
                  </div>
                  <div class="card-body">
                    <div class={cx('dimmer', { active: props.loading })}>
                      <div class="loader" />
                      <div class="dimmer-content">
                        <p>
                          <Text id="integration.meteo.introduction" />
                        </p>
                        <p>
                          <Text id="integration.meteo.instructionsToUse" />
                        </p>

                        <hr />

                        <form onSubmit={props.saveMeteoSettings}>
                          <div class="form-group">
                            <div class="form-label">
                              <Text id="integration.meteo.sourceLabel" />
                            </div>
                            <select class="form-control" onChange={props.updateMeteoSource} value={source}>
                              <option value="meteofrance">
                                <Text id="integration.meteo.sourceMeteoFrance" />
                              </option>
                              <option value="openweather">
                                <Text id="integration.meteo.sourceOpenWeather" />
                              </option>
                            </select>
                          </div>

                          {!isOpenWeather && (
                            <div>
                              <p>
                                <i class="fe fe-check-circle text-success mr-1" />
                                <Text id="integration.meteo.meteoFranceNoConfiguration" />
                              </p>
                              <p>
                                <MarkupText id="integration.meteo.meteoFranceInstructions" />
                              </p>
                            </div>
                          )}
                          {isOpenWeather && (
                            <div>
                              <p>
                                <Text id="integration.meteo.openWeatherIntroduction" />
                              </p>
                              <p>
                                <MarkupText id="integration.meteo.openWeatherInstructions" />
                              </p>
                            </div>
                          )}

                          <div class="form-group">
                            <div class="form-label">
                              {!isOpenWeather && <Text id="integration.meteo.meteoFranceApiKeyLabel" />}
                              {isOpenWeather && <Text id="integration.meteo.openWeatherApiKeyLabel" />}
                            </div>
                            <div class="input-group">
                              {!isOpenWeather && (
                                <Localizer>
                                  <input
                                    type="text"
                                    class="form-control"
                                    placeholder={<Text id="integration.meteo.meteoFranceApiKeyPlaceholder" />}
                                    onInput={props.updateMeteoFranceApiKey}
                                    value={props.meteoFranceApiKey}
                                  />
                                </Localizer>
                              )}
                              {isOpenWeather && (
                                <Localizer>
                                  <input
                                    type="text"
                                    class="form-control"
                                    placeholder={<Text id="integration.meteo.openWeatherApiKeyPlaceholder" />}
                                    onInput={props.updateMeteoOpenWeatherApiKey}
                                    value={props.meteoOpenWeatherApiKey}
                                  />
                                </Localizer>
                              )}
                              <span class="input-group-append">
                                <button
                                  class={cx('btn', 'btn-success', {
                                    'btn-loading': props.loading
                                  })}
                                  type="submit"
                                  disabled={props.loading}
                                >
                                  <Text id="integration.meteo.saveButton" />
                                </button>
                              </span>
                            </div>
                            {props.meteoSaveSettingsStatus === RequestStatus.Success && (
                              <p class="mt-2 text-success">
                                <Text id="integration.meteo.saveSuccess" />
                              </p>
                            )}
                            {props.meteoSaveSettingsStatus === RequestStatus.Error && (
                              <p class="mt-2 text-danger">
                                <Text id="integration.meteo.saveError" />
                              </p>
                            )}
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
};

export default MeteoPage;
