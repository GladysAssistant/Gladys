import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const TmdbPage = ({ children, ...props }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.tmdb.title" />}
    tabs={
      <DeviceConfigurationLink
        user={props.user}
        configurationKey="integrations"
        documentKey="tmdb"
        linkClass="hz-tab-link"
      >
        <i class="fe fe-book-open" />
        <span>
          <Text id="integration.tmdb.documentation" />
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
              <Text id="integration.tmdb.introduction" />
            </p>
            <p>
              <MarkupText id="integration.tmdb.instructions" />
            </p>
            {props.error && (
              <p class="alert alert-danger">
                <Text id="integration.tmdb.saveError" />
              </p>
            )}
            <form onSubmit={props.saveApiKey}>
              <div class="form-group">
                <div class="form-label">
                  <Text id="integration.tmdb.apiKeyLabel" />
                </div>
                <div class="input-group">
                  <Localizer>
                    <input
                      type="text"
                      class="form-control"
                      placeholder={<Text id="integration.tmdb.apiKeyPlaceholder" />}
                      onInput={props.updateApiKey}
                      value={props.tmdbApiKey}
                    />
                  </Localizer>
                  <span class="input-group-append">
                    <button
                      class={cx('btn', 'btn-success', {
                        'btn-loading': props.loading
                      })}
                      type="submit"
                    >
                      <Text id="integration.tmdb.saveButton" />
                    </button>
                  </span>
                </div>
              </div>

              <div class="form-group">
                <label>
                  <Text id="integration.tmdb.instructionsToUse" />
                </label>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </IntegrationSubPageLayout>
);

export default TmdbPage;
