import { Text, Localizer } from 'preact-i18n';
import ScrollToTopLink from '../../components/router/ScrollToTopLink';

/**
 * Component to display an integration category.
 *
 * @param {Object} integration
 * @prop {string} integration.key - The key of the integration.
 * @prop {string} integration.url - The URL of the integration.
 * @prop {string} integration.img - The URL of the image for the integration.
 * @prop {boolean} integration.invertInDarkMode - If true, the image will be
 *  inverted in dark mode.
 * @prop {boolean} integration.whiteBackground - If true, the image will have a
 *  white background.
 *
 * @returns {ReactElement} The integration category component.
 */
const IntegrationCategory = ({ integration }) => {
  return (
    <div class="col-sm-6 col-lg-4">
      <div class="card">
        <ScrollToTopLink href={integration.url}>
          <Localizer>
            <img
              class={`card-img-top ${integration.invertInDarkMode ? 'keep-dark' : ''} ${
                integration.whiteBackground ? 'white-bg' : ''
              }`}
              src={integration.img}
              alt={<Text id={`integration.${integration.key}.title`} />}
            />
          </Localizer>
        </ScrollToTopLink>
        <div class="card-body d-flex flex-column">
          <h4>
            <ScrollToTopLink href={integration.url}>
              <Text id={`integration.${integration.key}.title`} />
            </ScrollToTopLink>
          </h4>
          <div class="text-muted">
            <Text id={`integration.${integration.key}.description`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationCategory;
