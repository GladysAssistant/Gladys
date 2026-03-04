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
 * @prop {Function} integration.toggleFavorite - Function to toggle favorite status.
 *
 * @returns {ReactElement} The integration category component.
 */
const IntegrationCategory = ({ integration, toggleFavorite }) => {
  const isFavorite = !!integration.isFavorite;

  const onToggleFavorite = e => {
    e.preventDefault();
    e.stopPropagation();
    if (toggleFavorite) {
      toggleFavorite(integration.key);
    }
  };

  return (
    <div class="col-sm-6 col-lg-4">
      <div class="card">
        <div class="card-img-container">
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
        </div>
        <div class="card-body d-flex flex-column">
          <h4 class="d-flex align-items-center">
            <ScrollToTopLink href={integration.url} class="flex-fill">
              <Text id={`integration.${integration.key}.title`} />
            </ScrollToTopLink>
            <button
              type="button"
              class={`favorite-star ${isFavorite ? 'favorite-star--active' : ''}`}
              onClick={onToggleFavorite}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
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
