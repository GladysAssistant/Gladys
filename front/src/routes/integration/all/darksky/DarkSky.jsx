import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

const DarkSkyPage = ({ children, ...props }) => (
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
                        <Text id="integration.darkSky.title" />
                      </h2>
                      <p>
                        <Text id="integration.darkSky.introduction" />
                      </p>
                      <p>
                        <Text id="integration.darkSky.instructions" />{' '}
                        <a href="https://darksky.net/dev">https://darksky.net/dev</a>.
                      </p>
                      <div class="form-group">
                        <div class="form-label">
                          <Text id="integration.darkSky.apiKeyLabel" />
                        </div>
                        <div class="input-group">
                          <Localizer>
                            <input
                              type="text"
                              class="form-control"
                              placeholder={<Text id="integration.darkSky.apiKeyPlaceholder" />}
                              onInput={props.updateApiKey}
                              value={props.darkSkyApiKey}
                            />
                          </Localizer>
                        </div>
                        <div class="form-group mt-3">
                          <div class="form-label">
                            <Text id="integration.darkSky.displayModeLabel" />
                          </div>
                          <div class="input-group">
                            <Localizer>
                              <select
                                class="form-control"
                                value={props.darkSkyDisplayMode || 'basic'}
                                onChange={props.updateDisplayMode}
                              >
                                {props.modes.map(mode => {
                                  return <option value={mode.split(' ')[0]}>{mode}</option>;
                                })}
                              </select>
                            </Localizer>
                          </div>
                        </div>
                        <div class="form-group">
                          <label>
                            <Text id="integration.darkSky.instructionsToUse" />
                          </label>
                        </div>
                        <div>
                          <span class="input-group-append">
                            <button
                              class={cx('btn', 'btn-success', 'mx-auto', {
                                'btn-loading': props.loading
                              })}
                              onClick={props.saveConfig}
                              type="button"
                            >
                              <Text id="integration.darkSky.saveButton" />
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
  </div>
);

export default DarkSkyPage;
