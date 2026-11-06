import style from './style.css';

// as many placeholders as a first screen shows: enough to say "a long list is
// coming", without pretending to know its length
const DESKTOP_PLACEHOLDERS = 9;
const MOBILE_PLACEHOLDERS = 6;

const range = length => Array.from({ length }, (_, index) => index);

/**
 * Stand-in for the cards while the community integrations are loading: the
 * native ones alone would be a misleading, short catalog that reshuffles
 * once the store lands. Purely decorative — the loading state is announced
 * by the header.
 */
const IntegrationCatalogSkeleton = () => (
  <div aria-hidden="true">
    <div class={`list-group list-group-flush ${style.mobileList}`}>
      {range(MOBILE_PLACEHOLDERS).map(index => (
        <div key={index} class={`list-group-item ${style.integrationListItem}`}>
          <div class={style.integrationListRow}>
            <span class={`${style.skeleton} ${style.skeletonListImg}`} />
            <div class={style.integrationListContent}>
              <div class={`${style.skeleton} ${style.skeletonTitle}`} />
              <div class={`${style.skeleton} ${style.skeletonText}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
    <div class={style.desktopGrid}>
      <div class="row row-cards">
        {range(DESKTOP_PLACEHOLDERS).map(index => (
          <div key={index} class="col-sm-6 col-lg-4">
            <div class="card">
              <div class={`${style.skeleton} ${style.skeletonCover}`} />
              <div class="card-body">
                <div class={`${style.skeleton} ${style.skeletonTitle}`} />
                <div class={`${style.skeleton} ${style.skeletonText}`} />
                <div class={`${style.skeleton} ${style.skeletonText} ${style.skeletonTextShort}`} />
                <span class={`${style.skeleton} ${style.skeletonTag}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default IntegrationCatalogSkeleton;
