import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import ScrollToTopLink from '../../components/router/ScrollToTopLink';
import StatusBadge from './all/external-integration/components/StatusBadge';
import { isNoteworthyExternalIntegrationStatus } from './all/external-integration/utils';
import { RequestStatus } from '../../utils/consts';
import style from './style.css';

// covers are lazy-loaded: with hundreds of cards (and the mobile list, hidden
// on desktop, rendered next to the grid), eager images would download tens of
// megabytes before the first screen is usable
const getImgClass = integration =>
  `card-img-top ${integration.invertInDarkMode ? 'keep-dark' : ''} ${
    integration.whiteBackground ? 'white-bg' : ''
  }`.trim();

const IntegrationTags = ({ integration, alwaysShowStatus }) => (
  <div class="integration-tags mt-2">
    {/* first weeks of a community integration in the store index: the badge
        answers "what's new?" at a glance, the "Newest first" sort gathers them */}
    {integration.isNew && (
      <span class="badge badge-primary integration-tag">
        <i class="fe fe-star mr-1" />
        <Text id="integration.tags.new" />
      </span>
    )}
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
    {integration.external && (alwaysShowStatus || isNoteworthyExternalIntegrationStatus(integration.status)) && (
      <StatusBadge status={integration.status} className="integration-tag" />
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

// the update is started from the card itself: going to the Supervision tab of
// each integration, one after the other, was the only way before. The footer
// stays after the update to say how it went — the card would otherwise just
// lose its button, which reads the same as a click that did nothing.
// `bordered`: on a grid card, the footer is pushed to the bottom so it lines up
// across a row of cards whatever the length of their description
const UpdateFooter = ({ integration, updateIntegration, bordered }) => {
  const { updateState } = integration;
  if (!updateIntegration || !integration.selector || !(integration.updateAvailable || updateState)) {
    return null;
  }
  // a version published after this update brings the button back
  const succeeded = !!updateState && updateState.status === RequestStatus.Success && !integration.updateAvailable;
  const updating = !!updateState && updateState.status === RequestStatus.Getting;
  const failed = !!updateState && updateState.status === RequestStatus.Error;
  return (
    <div class={bordered ? 'mt-auto pt-3' : `mt-2 ${style.integrationListUpdate}`}>
      <div class={cx({ 'border-top pt-3': bordered })}>
        {succeeded ? (
          <div class="text-success small">
            <i class="fe fe-check-circle mr-1" />
            <Text id="integration.root.updatedTo" fields={{ version: updateState.version }} />
          </div>
        ) : (
          <div class="d-flex align-items-center">
            {/* the latest version is unknown until the store index has been
                read: the button alone still says there is something to install */}
            <span class="flex-fill text-muted small">
              {integration.version && integration.latestVersion && (
                <span>
                  v{integration.version} <i class="fe fe-arrow-right" />{' '}
                  <strong class="text-body">v{integration.latestVersion}</strong>
                </span>
              )}
            </span>
            {/* flex: the theme sizes a button icon to 1rem, above the text of a
                small button, so baseline alignment pushed the label down */}
            <button
              type="button"
              class={cx('btn btn-sm d-inline-flex align-items-center', failed ? 'btn-outline-danger' : 'btn-dark', {
                'btn-loading': updating
              })}
              onClick={() => updateIntegration(integration.selector)}
              disabled={updating}
            >
              <i class={cx('fe mr-1', failed ? 'fe-rotate-ccw' : 'fe-arrow-up-circle')} />
              <Text id={failed ? 'integration.root.updateRetryButton' : 'integration.root.updateButton'} />
            </button>
          </div>
        )}
        {failed && (
          <div class="text-danger small mt-2">
            <Text id="integration.root.updateError" />
          </div>
        )}
      </div>
    </div>
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

export const IntegrationListItem = ({ integration, toggleFavorite, alwaysShowStatus, updateIntegration }) => (
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
              loading="lazy"
              decoding="async"
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
        <IntegrationTags integration={integration} alwaysShowStatus={alwaysShowStatus} />
      </ScrollToTopLink>
      <div class={style.integrationListFavorite}>
        <FavoriteButton integration={integration} toggleFavorite={toggleFavorite} />
      </div>
    </div>
    <UpdateFooter integration={integration} updateIntegration={updateIntegration} />
  </div>
);

const IntegrationCategory = ({ integration, toggleFavorite, alwaysShowStatus, updateIntegration }) => (
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
                loading="lazy"
                decoding="async"
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
        <IntegrationTags integration={integration} alwaysShowStatus={alwaysShowStatus} />
        <UpdateFooter integration={integration} updateIntegration={updateIntegration} bordered />
      </div>
    </div>
  </div>
);

export default IntegrationCategory;
