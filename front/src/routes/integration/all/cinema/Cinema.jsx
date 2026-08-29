import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const CinemaPage = ({ children, ...props }) => (
  <IntegrationSubPageLayout title={<Text id="integration.cinema.title" />}>
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
              <Text id="integration.cinema.introduction" />
            </p>
            <p>
              <MarkupText id="integration.cinema.instructions" />
            </p>
            <form onSubmit={props.saveApiKey}>
              <div class="form-group">
                <div class="form-label">
                  <Text id="integration.cinema.apiKeyLabel" />
                </div>
                <div class="input-group">
                  <Localizer>
                    <input
                      type="text"
                      class="form-control"
                      placeholder={<Text id="integration.cinema.apiKeyPlaceholder" />}
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
                      <Text id="integration.cinema.saveButton" />
                    </button>
                  </span>
                </div>
              </div>

              <div class="form-group">
                <label>
                  <Text id="integration.cinema.instructionsToUse" />
                </label>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </IntegrationSubPageLayout>
);

export default CinemaPage;
