import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const OpenWeatherPage = ({ children, ...props }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.openWeather.title" />}
    tabs={
      <DeviceConfigurationLink
        user={props.user}
        configurationKey="integrations"
        documentKey="openweather"
        linkClass="hz-tab-link"
      >
        <i class="fe fe-book-open" />
        <span>
          <Text id="integration.openWeather.documentation" />
        </span>
      </DeviceConfigurationLink>
    }
  >
    <div class="card">
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
  </IntegrationSubPageLayout>
);

export default OpenWeatherPage;
