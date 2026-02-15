import { Text, Localizer } from 'preact-i18n';
import ScrollToTopLink from '../../components/router/ScrollToTopLink';

/**
 * Component to display an integration category.
 *
 * @param {Object} integration - The key of integration.
 * @prop {string} integration.url - The URL of integration.
 * @prop {string} integration.img - The URL of image for integration.
 * @prop {boolean} integration.invertInDarkMode - If true, image will be
 *  inverted in dark mode.
 * @prop {boolean} integration.whiteBackground - If true, image will have a
 *  white background.
 * @param {Function} integration.toggleFavorite - Function to toggle favorite status.
 *
 * @returns {ReactElement} The integration category component.
 */
const IntegrationCategory = ({ integration, toggleFavorite }) => {
  const favorites = JSON.parse(localStorage.getItem('integration_favorites') || '[]');
  const isFavorite = integration.isFavorite !== undefined ? integration.isFavorite : favorites.includes(integration.key);

  const onToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Debug: confirm click is triggered
    // eslint-disable-next-line no-console
    console.log('[integration] star clicked', integration.key);

    if (toggleFavorite) {
      toggleFavorite(integration.key);
      return;
    }

    // Fallback: if toggleFavorite is not provided, still persist in localStorage
    const currentFavorites = JSON.parse(localStorage.getItem('integration_favorites') || '[]');
    const newFavorites = currentFavorites.includes(integration.key)
      ? currentFavorites.filter((key) => key !== integration.key)
      : [...currentFavorites, integration.key];
    localStorage.setItem('integration_favorites', JSON.stringify(newFavorites));
    window.location.reload();
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
          <button
            type="button"
            class={`favorite-star ${isFavorite ? 'favorite-star--active' : ''}`}
            onClick={onToggleFavorite}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill={isFavorite ? '#FFD700' : 'none'}
              stroke={isFavorite ? '#FFD700' : '#9aa0a6'}
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>
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
