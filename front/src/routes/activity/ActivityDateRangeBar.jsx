import { Text } from 'preact-i18n';
import style from './style.css';

const ActivityDateRangeBar = ({ customFrom, customTo, onCustomFromChange, onCustomToChange }) => (
  <div class={style.dateRangeBar}>
    <div class={style.dateRangeBarInner}>
      <span class={style.dateRangeIcon} aria-hidden="true">
        <i class="fe fe-calendar" />
      </span>
      <label class={style.dateRangeItem}>
        <span class={style.dateRangeLabel}>
          <Text id="activityLog.filters.customFrom" />
        </span>
        <input
          type="date"
          class={style.dateInput}
          value={customFrom}
          max={customTo || undefined}
          onChange={onCustomFromChange}
        />
      </label>
      <span class={style.dateRangeSep} aria-hidden="true">
        —
      </span>
      <label class={style.dateRangeItem}>
        <span class={style.dateRangeLabel}>
          <Text id="activityLog.filters.customTo" />
        </span>
        <input
          type="date"
          class={style.dateInput}
          value={customTo}
          min={customFrom || undefined}
          onChange={onCustomToChange}
        />
      </label>
    </div>
  </div>
);

export default ActivityDateRangeBar;
