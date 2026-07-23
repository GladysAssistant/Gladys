import { Text, Localizer } from 'preact-i18n';
import ScrollToTopLink from '../../components/router/ScrollToTopLink';
import StatusBadge from './all/external-integration/components/StatusBadge';
import style from './style.css';

const getImgClass = integration =>
  `card-img-top ${integration.invertInDarkMode ? 'keep-dark' : ''} ${
    integration.whiteBackground ? 'white-bg' : ''
  }`.trim();

const IntegrationTags = ({ integration }) => (
  <div class="integration-tags mt-2">
    {!integration.external && (
      <span class="badge badge-dark integration-tag">
        <i class="fe fe-check-circle mr-1" />
        <Text id="integration.tags.native" />
      </span>
    )}
    {integration.external && (
      <span class="badge badge-secondary integration-tag">
        <i class="fe fe-package mr-1" />
        <Text id="integration.tags.external" />
      </span>
    )}
    {integration.external && integration.status && (
      <StatusBadge status={integration.status} className="integration-tag" />
    )}
    {integration.external && integration.updateAvailable && (
      <span class="badge badge-primary integration-tag">
        <i class="fe fe-arrow-up-circle mr-1" />
        <Text id="integration.externalIntegration.updateAvailable" />
      </span>
    )}
    {integration.deprecated && (
      <span class="badge badge-danger integration-tag">
        <i class="fe fe-alert-triangle mr-1" />
        <Text id="integration.tags.deprecated" />
      </span>
    )}
    {integration.local && (
      <span class="badge badge-success integration-tag">
        <i class="fe fe-home mr-1" />
        <Text id="integration.tags.local" />
      </span>
    )}
    {integration.cloud && (
      <span class="badge badge-warning integration-tag">
        <i class="fe fe-cloud mr-1" />
        <Text id="integration.tags.cloud" />
      </span>
    )}
    {integration.gladysPlus && (
      <span class="badge badge-info integration-tag">
        <i class="fe fe-plus mr-1" />
        <Text id="integration.tags.gladysPlus" />
      </span>
    )}
  </div>
);

const FavoriteButton = ({ integration, toggleFavorite }) => {
  const isFavorite = !!integration.isFavorite;

  const onToggleFavorite = e => {
    e.preventDefault();
    e.stopPropagation();
    if (toggleFavorite) {
      toggleFavorite(integration.key);
    }
  };

  return (
    <button
      type="button"
      class={`favorite-star ${isFavorite ? 'favorite-star--active' : ''}`}
      onClick={onToggleFavorite}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
};

const IntegrationName = ({ integration }) =>
  integration.external ? <span>{integration.name}</span> : <Text id={`integration.${integration.key}.title`} />;

const IntegrationDescription = ({ integration }) =>
  integration.external ? (
    <span>{integration.description}</span>
  ) : (
    <Text id={`integration.${integration.key}.description`} />
  );

export const IntegrationListItem = ({ integration, toggleFavorite }) => (
  <div class={`list-group-item ${style.integrationListItem}`}>
    <div class={style.integrationListRow}>
      <ScrollToTopLink href={integration.url}>
        {integration.external && !integration.img ? (
          <span class={style.externalListImgPlaceholder}>
            <i class="fe fe-package" />
          </span>
        ) : (
          <Localizer>
            <img
              class={`${style.integrationListImg} ${integration.invertInDarkMode ? 'keep-dark' : ''} ${
                integration.whiteBackground ? 'white-bg' : ''
              }`}
              src={integration.img}
              alt={integration.external ? integration.name : <Text id={`integration.${integration.key}.title`} />}
            />
          </Localizer>
        )}
      </ScrollToTopLink>
      <ScrollToTopLink href={integration.url} class={style.integrationListContent}>
        <div class="font-weight-bold">
          <IntegrationName integration={integration} />
        </div>
        <div class={`text-muted small ${style.integrationListDescription}`}>
          <IntegrationDescription integration={integration} />
        </div>
        <IntegrationTags integration={integration} />
      </ScrollToTopLink>
      <div class={style.integrationListFavorite}>
        <FavoriteButton integration={integration} toggleFavorite={toggleFavorite} />
      </div>
    </div>
  </div>
);

const IntegrationCategory = ({ integration, toggleFavorite }) => (
  <div class="col-sm-6 col-lg-4">
    <div class="card">
      <div class="card-img-container">
        <ScrollToTopLink href={integration.url}>
          {integration.external && !integration.img ? (
            <div class={style.externalCoverPlaceholder}>
              <i class="fe fe-package" />
            </div>
          ) : (
            <Localizer>
              <img
                class={getImgClass(integration)}
                src={integration.img}
                alt={integration.external ? integration.name : <Text id={`integration.${integration.key}.title`} />}
              />
            </Localizer>
          )}
        </ScrollToTopLink>
      </div>
      <div class="card-body d-flex flex-column">
        <h4 class="d-flex align-items-center">
          <ScrollToTopLink href={integration.url} class="flex-fill">
            <IntegrationName integration={integration} />
          </ScrollToTopLink>
          <FavoriteButton integration={integration} toggleFavorite={toggleFavorite} />
        </h4>
        <div class="text-muted">
          <IntegrationDescription integration={integration} />
        </div>
        <IntegrationTags integration={integration} />
      </div>
    </div>
  </div>
);

export default IntegrationCategory;
