import { Text } from 'preact-i18n';
import cx from 'classnames';
import { ACTIVITY_CATEGORY_GROUPS } from './utils';
import style from './style.css';

const ActivityCategoryFilters = ({ categoryGroups, onCategoryGroupToggle, onCategoryGroupsClear }) => {
  const hasSelection = categoryGroups.length > 0;

  return (
    <div class={style.categoryBar}>
      <div class={style.categoryBarInner}>
        <span class={style.categoryBarLabel}>
          <Text id="activityLog.filters.deviceTypes" />
        </span>
        <div class={style.categoryChips}>
          {ACTIVITY_CATEGORY_GROUPS.map(group => (
            <button
              key={group.id}
              type="button"
              class={cx(style.categoryChip, {
                [style.categoryChipActive]: categoryGroups.indexOf(group.id) !== -1
              })}
              onClick={() => onCategoryGroupToggle(group.id)}
            >
              <i class={cx('fe', `fe-${group.icon}`, style.categoryChipIcon)} />
              <Text id={`activityLog.categoryGroups.${group.id}`} />
            </button>
          ))}
        </div>
        {hasSelection && (
          <button type="button" class={style.categoryClear} onClick={onCategoryGroupsClear}>
            <Text id="activityLog.filters.clearCategories" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ActivityCategoryFilters;
