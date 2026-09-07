import { Text } from 'preact-i18n';

import style from './style.css';

// Two very different situations used to share one "No houses found." line:
// a filter that matches nothing (the houses are still there) and an
// install with no house at all (nothing to do but create one).
const EmptyState = ({ housesSearch, addHouse }) => {
  const isSearch = Boolean(housesSearch && housesSearch.length);

  return (
    <div class={style.emptyState}>
      <div class={style.emptyIcon}>
        <i class={isSearch ? 'fe fe-search' : 'fe fe-home'} />
      </div>
      <div class={style.emptyTitle}>
        <Text id={isSearch ? 'housesSettings.noHouseFound' : 'housesSettings.empty.title'} />
      </div>
      {!isSearch && (
        <div class={style.emptyText}>
          <Text id="housesSettings.empty.description" />
        </div>
      )}
      {!isSearch && (
        <button onClick={addHouse} class="btn btn-primary">
          <i class="fe fe-plus mr-2" />
          <Text id="housesSettings.empty.button" />
        </button>
      )}
    </div>
  );
};

export default EmptyState;
