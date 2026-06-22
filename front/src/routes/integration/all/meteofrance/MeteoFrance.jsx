import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../utils/consts';

const MeteoFrancePage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.meteoFrance.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <a
                    href="https://portail-api.meteofrance.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-book-open" />
                    </span>
                    <Text id="integration.meteoFrance.documentation" />
                  </a>
                </div>
              </div>
            </div>

            <div class="col-lg-9">
              <div class="card">
                <div class="card-header">
                  <h1 class="card-title">
                    <Text id="integration.meteoFrance.title" />
                  </h1>
                </div>
                <div class="card-body">
                  <div class={cx('dimmer', { active: props.loading })}>
                    <div class="loader" />
                    <div class="dimmer-content">
                      <p>
                        <Text id="integration.meteoFrance.introduction" />
                      </p>
                      <p>
                        <MarkupText id="integration.meteoFrance.instructions" />
                      </p>
                      <form onSubmit={props.saveMeteoFranceApiKey}>
                        <div class="form-group">
                          <div class="form-label">
                            <Text id="integration.meteoFrance.apiKeyLabel" />
                          </div>
                          <div class="input-group">
                            <Localizer>
                              <input
                                type="text"
                                class="form-control"
                                placeholder={<Text id="integration.meteoFrance.apiKeyPlaceholder" />}
                                onInput={props.updateMeteoFranceApiKey}
                                value={props.meteoFranceApiKey}
                              />
                            </Localizer>
                            <span class="input-group-append">
                              <button
                                class={cx('btn', 'btn-success', {
                                  'btn-loading': props.loading
                                })}
                                type="submit"
                              >
                                <Text id="integration.meteoFrance.saveButton" />
                              </button>
                            </span>
                          </div>
                          {props.meteoFranceSaveApiKeyStatus === RequestStatus.Success && (
                            <p class="mt-2 text-success">
                              <Text id="integration.meteoFrance.saveSuccess" />
                            </p>
                          )}
                          {props.meteoFranceSaveApiKeyStatus === RequestStatus.Error && (
                            <p class="mt-2 text-danger">
                              <Text id="integration.meteoFrance.saveError" />
                            </p>
                          )}
                        </div>

                        <div class="form-group">
                          <label>
                            <Text id="integration.meteoFrance.instructionsToUse" />
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

export default MeteoFrancePage;
